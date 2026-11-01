alter table public.stock drop constraint if exists stock_cantidad_check;
alter table public.stock drop constraint if exists stock_check;
alter table public.stock add constraint stock_check check (
  reservado >= 0 and (
    (cantidad >= 0 and reservado <= cantidad) or
    (cantidad < 0 and reservado = 0)
  )
);

create or replace function private.registrar_movimiento_stock(
  p_taller_id uuid,p_producto_id uuid,p_bodega_id uuid,p_tipo text,
  p_cantidad numeric,p_costo_unitario numeric,p_motivo text,p_referencia text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_delta numeric;
  v_actual numeric;
  v_reservado numeric;
  v_id uuid;
  v_permitir_negativo boolean := false;
begin
  if auth.uid() is null then raise exception 'No autenticado.' using errcode='42501'; end if;
  if not private.tiene_rol_taller(p_taller_id,array['administrador','gerente','jefe_taller','bodeguero','administracion']) then
    raise exception 'No tienes permiso para modificar inventario.' using errcode='42501';
  end if;
  if p_cantidad is null or p_cantidad = 0 then raise exception 'La cantidad debe ser distinta de cero.'; end if;
  if p_tipo not in ('entrada','salida','ajuste') then raise exception 'Tipo de movimiento inválido.'; end if;
  if p_tipo in ('entrada','salida') and p_cantidad < 0 then raise exception 'La cantidad debe ser positiva.'; end if;
  if p_tipo='entrada' then v_delta:=abs(p_cantidad);
  elsif p_tipo='salida' then v_delta:=-abs(p_cantidad);
  else v_delta:=p_cantidad; end if;

  if not exists(select 1 from public.productos where id=p_producto_id and taller_id=p_taller_id and controla_stock and activo) then
    raise exception 'Producto inválido o sin control de stock.' using errcode='23503';
  end if;
  if not exists(select 1 from public.bodegas where id=p_bodega_id and taller_id=p_taller_id and activo) then
    raise exception 'Bodega inválida.' using errcode='23503';
  end if;
  select coalesce(stock_negativo_permitido,false) into v_permitir_negativo
  from public.configuracion_taller where taller_id=p_taller_id;

  insert into public.stock(taller_id,producto_id,bodega_id,cantidad)
  values(p_taller_id,p_producto_id,p_bodega_id,0)
  on conflict(taller_id,producto_id,bodega_id) do nothing;
  select cantidad,reservado into v_actual,v_reservado from public.stock
  where taller_id=p_taller_id and producto_id=p_producto_id and bodega_id=p_bodega_id
  for update;
  if v_actual + v_delta < 0 and not v_permitir_negativo then
    raise exception 'Stock insuficiente. Disponible: %',v_actual using errcode='23514';
  end if;
  if v_actual + v_delta < 0 and coalesce(v_reservado,0) > 0 then
    raise exception 'No se puede dejar stock negativo mientras existan unidades reservadas.' using errcode='23514';
  end if;

  update public.stock set cantidad=v_actual+v_delta,updated_at=now()
  where taller_id=p_taller_id and producto_id=p_producto_id and bodega_id=p_bodega_id;
  insert into public.movimientos_stock(taller_id,producto_id,bodega_id,tipo,cantidad_delta,costo_unitario,motivo,referencia,usuario_id)
  values(p_taller_id,p_producto_id,p_bodega_id,p_tipo,v_delta,greatest(coalesce(p_costo_unitario,0),0),trim(p_motivo),nullif(trim(p_referencia),''),auth.uid())
  returning id into v_id;
  insert into public.auditoria(taller_id,usuario_id,entidad,entidad_id,accion,detalle)
  values(p_taller_id,auth.uid(),'stock',p_producto_id::text,'movimiento',jsonb_build_object('tipo',p_tipo,'delta',v_delta,'bodega_id',p_bodega_id,'motivo',p_motivo));
  return v_id;
end;
$$;

revoke all on function private.registrar_movimiento_stock(uuid,uuid,uuid,text,numeric,numeric,text,text) from public,anon,authenticated;
grant execute on function private.registrar_movimiento_stock(uuid,uuid,uuid,text,numeric,numeric,text,text) to authenticated;
