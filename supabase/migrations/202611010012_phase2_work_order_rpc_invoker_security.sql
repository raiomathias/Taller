-- Las RPC públicas quedan SECURITY INVOKER; los helpers privados validan rol y usuario.
grant usage on schema private to authenticated;
grant execute on function private.crear_orden_trabajo(uuid,uuid,uuid,numeric,text,text,text,text,timestamptz) to authenticated;
grant execute on function private.agregar_detalle_ot(uuid,uuid,text,uuid,uuid,text,numeric,numeric) to authenticated;
create or replace function public.crear_orden_trabajo(p_taller_id uuid,p_cliente_id uuid,p_vehiculo_id uuid,p_kilometraje numeric default 0,p_sintomas text default null,p_trabajo_solicitado text default null,p_observaciones text default null,p_prioridad text default 'normal',p_fecha_prometida timestamptz default null)
returns uuid language sql security invoker set search_path='' as $$ select private.crear_orden_trabajo(p_taller_id,p_cliente_id,p_vehiculo_id,p_kilometraje,p_sintomas,p_trabajo_solicitado,p_observaciones,p_prioridad,p_fecha_prometida);$$;
revoke all on function public.crear_orden_trabajo(uuid,uuid,uuid,numeric,text,text,text,text,timestamptz) from public,anon;
grant execute on function public.crear_orden_trabajo(uuid,uuid,uuid,numeric,text,text,text,text,timestamptz) to authenticated;
create or replace function public.agregar_detalle_ot(p_taller_id uuid,p_orden_id uuid,p_tipo text,p_producto_id uuid default null,p_bodega_id uuid default null,p_descripcion text default null,p_cantidad numeric default 1,p_precio_unitario numeric default 0)
returns uuid language sql security invoker set search_path='' as $$ select private.agregar_detalle_ot(p_taller_id,p_orden_id,p_tipo,p_producto_id,p_bodega_id,p_descripcion,p_cantidad,p_precio_unitario);$$;
revoke all on function public.agregar_detalle_ot(uuid,uuid,text,uuid,uuid,text,numeric,numeric) from public,anon;
grant execute on function public.agregar_detalle_ot(uuid,uuid,text,uuid,uuid,text,numeric,numeric) to authenticated;
revoke all on public.ot_detalles from authenticated;
grant select on public.ot_detalles to authenticated;