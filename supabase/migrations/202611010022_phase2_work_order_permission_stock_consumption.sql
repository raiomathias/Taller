create or replace function private.agregar_detalle_ot(p_taller_id uuid,p_orden_id uuid,p_tipo text,p_producto_id uuid,p_bodega_id uuid,p_descripcion text,p_cantidad numeric,p_precio_unitario numeric)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_uid uuid:=auth.uid();v_cost numeric:=0;v_id uuid;
begin
 if v_uid is null then raise exception 'Debes iniciar sesión.' using errcode='42501';end if;
 if not private.tiene_permiso_taller(p_taller_id,'ordenes','editar') then raise exception 'No tienes permiso para modificar los detalles de esta orden.' using errcode='42501';end if;
 if p_tipo not in('mano_obra','repuesto','insumo','servicio','otro') or p_cantidad is null or p_cantidad<=0 or p_precio_unitario is null or p_precio_unitario<0 then raise exception 'Detalle inválido.';end if;
 if not exists(select 1 from public.ordenes_trabajo where id=p_orden_id and taller_id=p_taller_id and estado not in('entregada','cancelada')) then raise exception 'La orden no existe o ya está cerrada.';end if;
 if p_tipo in('repuesto','insumo') then
  select costo_unitario into v_cost from public.productos where id=p_producto_id and taller_id=p_taller_id and activo and controla_stock;
  if not found then raise exception 'Producto inválido o sin control de stock.';end if;
  if not exists(select 1 from public.bodegas where id=p_bodega_id and taller_id=p_taller_id and activo) then raise exception 'Bodega inválida.';end if;
 end if;
 insert into public.ot_detalles(taller_id,orden_id,tipo,producto_id,bodega_id,descripcion,cantidad,precio_unitario,costo_unitario_historico,creado_por)
 values(p_taller_id,p_orden_id,p_tipo,case when p_tipo in('repuesto','insumo') then p_producto_id else null end,case when p_tipo in('repuesto','insumo') then p_bodega_id else null end,trim(p_descripcion),p_cantidad,p_precio_unitario,v_cost,v_uid) returning id into v_id;
 if p_tipo in('repuesto','insumo') then
  perform private.registrar_movimiento_stock(p_taller_id,p_producto_id,p_bodega_id,'salida',p_cantidad,v_cost,'Consumo en orden de trabajo','OT:'||p_orden_id::text);
  update public.ot_detalles set consumido=true,consumido_at=now() where id=v_id;
 end if;
 insert into public.auditoria(taller_id,usuario_id,entidad,entidad_id,accion,detalle) values(p_taller_id,v_uid,'ordenes_trabajo',p_orden_id::text,'agregar_detalle',jsonb_build_object('detalle_id',v_id,'tipo',p_tipo,'cantidad',p_cantidad));
 return v_id;
end;$$;
create or replace function private.registrar_movimiento_stock(p_taller_id uuid,p_producto_id uuid,p_bodega_id uuid,p_tipo text,p_cantidad numeric,p_costo_unitario numeric,p_motivo text,p_referencia text)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_delta numeric;v_actual numeric;v_reservado numeric;v_id uuid;v_permitir_negativo boolean:=false;v_ot_consumption boolean;
begin
 if auth.uid() is null then raise exception 'No autenticado.' using errcode='42501';end if;
 v_ot_consumption:=coalesce(p_motivo,'')='Consumo en orden de trabajo' and coalesce(p_referencia,'') like 'OT:%';
 if v_ot_consumption then
  if not private.tiene_permiso_taller(p_taller_id,'ordenes','editar') then raise exception 'No tienes permiso para consumir inventario desde esta orden.' using errcode='42501';end if;
 elsif not private.tiene_permiso_taller(p_taller_id,'movimientos','crear') then raise exception 'No tienes permiso para modificar inventario.' using errcode='42501';
 end if;
 if p_cantidad is null or p_cantidad=0 then raise exception 'La cantidad debe ser distinta de cero.';end if;
 if p_tipo not in('entrada','salida','ajuste') then raise exception 'Tipo de movimiento inválido.';end if;
 if p_tipo in('entrada','salida') and p_cantidad<0 then raise exception 'La cantidad debe ser positiva.';end if;
 if p_tipo='entrada' then v_delta:=abs(p_cantidad);elsif p_tipo='salida' then v_delta:=-abs(p_cantidad);else v_delta:=p_cantidad;end if;
 if not exists(select 1 from public.productos where id=p_producto_id and taller_id=p_taller_id and controla_stock and activo) then raise exception 'Producto inválido o sin control de stock.' using errcode='23503';end if;
 if not exists(select 1 from public.bodegas where id=p_bodega_id and taller_id=p_taller_id and activo) then raise exception 'Bodega inválida.' using errcode='23503';end if;
 select coalesce(stock_negativo_permitido,false) into v_permitir_negativo from public.configuracion_taller where taller_id=p_taller_id;
 insert into public.stock(taller_id,producto_id,bodega_id,cantidad) values(p_taller_id,p_producto_id,p_bodega_id,0) on conflict(taller_id,producto_id,bodega_id) do nothing;
 select cantidad,reservado into v_actual,v_reservado from public.stock where taller_id=p_taller_id and producto_id=p_producto_id and bodega_id=p_bodega_id for update;
 if v_actual+v_delta<0 and not v_permitir_negativo then raise exception 'Stock insuficiente. Disponible: %',v_actual using errcode='23514';end if;
 if v_actual+v_delta<0 and coalesce(v_reservado,0)>0 then raise exception 'No se puede dejar stock negativo mientras existan unidades reservadas.' using errcode='23514';end if;
 update public.stock set cantidad=v_actual+v_delta,updated_at=now() where taller_id=p_taller_id and producto_id=p_producto_id and bodega_id=p_bodega_id;
 insert into public.movimientos_stock(taller_id,producto_id,bodega_id,tipo,cantidad_delta,costo_unitario,motivo,referencia,usuario_id) values(p_taller_id,p_producto_id,p_bodega_id,p_tipo,v_delta,greatest(coalesce(p_costo_unitario,0),0),trim(p_motivo),nullif(trim(p_referencia),''),auth.uid()) returning id into v_id;
 insert into public.auditoria(taller_id,usuario_id,entidad,entidad_id,accion,detalle) values(p_taller_id,auth.uid(),'stock',p_producto_id::text,'movimiento',jsonb_build_object('tipo',p_tipo,'delta',v_delta,'bodega_id',p_bodega_id,'motivo',p_motivo));
 return v_id;
end;$$;