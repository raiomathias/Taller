
-- Inserta el detalle y consume inventario en una única transacción.
create or replace function private.agregar_detalle_ot(p_taller_id uuid,p_orden_id uuid,p_tipo text,p_producto_id uuid,p_bodega_id uuid,p_descripcion text,p_cantidad numeric,p_precio_unitario numeric)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_uid uuid:=auth.uid();v_cost numeric:=0;v_id uuid;
begin
 if v_uid is null then raise exception 'Debes iniciar sesión.' using errcode='42501';end if;
 if not private.tiene_rol_taller(p_taller_id,array['administrador','gerente','jefe_taller','recepcionista','administracion']) then raise exception 'No tienes permiso para agregar detalles.' using errcode='42501';end if;
 if p_tipo not in('mano_obra','repuesto','insumo','servicio','otro') or p_cantidad is null or p_cantidad<=0 or p_precio_unitario is null or p_precio_unitario<0 then raise exception 'Detalle inválido.';end if;
 if not exists(select 1 from public.ordenes_trabajo where id=p_orden_id and taller_id=p_taller_id and estado not in('entregada','cancelada')) then raise exception 'La orden no existe o ya está cerrada.';end if;
 if p_tipo in('repuesto','insumo') then
  select costo_unitario into v_cost from public.productos where id=p_producto_id and taller_id=p_taller_id and activo and controla_stock;
  if not found then raise exception 'Producto inválido o sin control de stock.';end if;
  if not exists(select 1 from public.bodegas where id=p_bodega_id and taller_id=p_taller_id and activo) then raise exception 'Bodega inválida.';end if;
 end if;
 insert into public.ot_detalles(taller_id,orden_id,tipo,producto_id,bodega_id,descripcion,cantidad,precio_unitario,costo_unitario_historico,creado_por)
 values(p_taller_id,p_orden_id,p_tipo,case when p_tipo in('repuesto','insumo') then p_producto_id end,case when p_tipo in('repuesto','insumo') then p_bodega_id end,trim(p_descripcion),p_cantidad,p_precio_unitario,v_cost,v_uid) returning id into v_id;
 if p_tipo in('repuesto','insumo') then
  perform private.registrar_movimiento_stock(p_taller_id,p_producto_id,p_bodega_id,'salida',p_cantidad,v_cost,'Consumo en orden de trabajo','OT:'||p_orden_id::text);
  update public.ot_detalles set consumido=true,consumido_at=now() where id=v_id;
 end if;
 insert into public.auditoria(taller_id,usuario_id,entidad,entidad_id,accion,detalle) values(p_taller_id,v_uid,'ordenes_trabajo',p_orden_id::text,'agregar_detalle',jsonb_build_object('detalle_id',v_id,'tipo',p_tipo,'cantidad',p_cantidad));
 return v_id;
end;$$;
revoke all on function private.agregar_detalle_ot(uuid,uuid,text,uuid,uuid,text,numeric,numeric) from public,anon,authenticated;
create or replace function public.agregar_detalle_ot(p_taller_id uuid,p_orden_id uuid,p_tipo text,p_producto_id uuid default null,p_bodega_id uuid default null,p_descripcion text default null,p_cantidad numeric default 1,p_precio_unitario numeric default 0)
returns uuid language sql set search_path='' as $$ select private.agregar_detalle_ot(p_taller_id,p_orden_id,p_tipo,p_producto_id,p_bodega_id,p_descripcion,p_cantidad,p_precio_unitario);$$;
revoke all on function public.agregar_detalle_ot(uuid,uuid,text,uuid,uuid,text,numeric,numeric) from public,anon;
grant execute on function public.agregar_detalle_ot(uuid,uuid,text,uuid,uuid,text,numeric,numeric) to authenticated;
