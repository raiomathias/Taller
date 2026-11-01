alter table public.ot_detalles add column servicio_id uuid references public.servicios_taller(id) on delete set null;
create index ot_detalles_servicio_id_idx on public.ot_detalles(servicio_id);
create or replace function private.agregar_detalle_ot_catalogo(p_taller_id uuid,p_orden_id uuid,p_tipo text,p_producto_id uuid,p_bodega_id uuid,p_descripcion text,p_cantidad numeric,p_servicio_id uuid,p_precio_propuesto numeric default 0)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_price numeric:=coalesce(p_precio_propuesto,0);v_status text;v_owner uuid;v_id uuid;
begin
 if p_servicio_id is not null then
  select precio,estado,creado_por into v_price,v_status,v_owner from public.servicios_taller where id=p_servicio_id and taller_id=p_taller_id;
  if not found then raise exception 'El trabajo del catálogo no existe.';end if;
  if v_status='rechazado' then raise exception 'Este trabajo fue rechazado por administración.';end if;
  if v_status='pendiente' and v_owner is distinct from auth.uid() and not private.tiene_rol_taller(p_taller_id,array['administrador','gerente']) then raise exception 'No puedes utilizar una propuesta de otro usuario.' using errcode='42501';end if;
 end if;
 v_id:=private.agregar_detalle_ot(p_taller_id,p_orden_id,p_tipo,p_producto_id,p_bodega_id,p_descripcion,p_cantidad,v_price);
 if p_servicio_id is not null then update public.ot_detalles set servicio_id=p_servicio_id where id=v_id;end if;
 return v_id;
end;$$;
revoke all on function private.agregar_detalle_ot_catalogo(uuid,uuid,text,uuid,uuid,text,numeric,uuid,numeric) from public,anon,authenticated;
grant execute on function private.agregar_detalle_ot_catalogo(uuid,uuid,text,uuid,uuid,text,numeric,uuid,numeric) to authenticated;
create or replace function public.agregar_detalle_ot_catalogo(p_taller_id uuid,p_orden_id uuid,p_tipo text,p_producto_id uuid default null,p_bodega_id uuid default null,p_descripcion text default null,p_cantidad numeric default 1,p_servicio_id uuid default null,p_precio_propuesto numeric default 0)
returns uuid language sql security invoker set search_path='' as $$ select private.agregar_detalle_ot_catalogo(p_taller_id,p_orden_id,p_tipo,p_producto_id,p_bodega_id,p_descripcion,p_cantidad,p_servicio_id,p_precio_propuesto);$$;
revoke all on function public.agregar_detalle_ot_catalogo(uuid,uuid,text,uuid,uuid,text,numeric,uuid,numeric) from public,anon;
grant execute on function public.agregar_detalle_ot_catalogo(uuid,uuid,text,uuid,uuid,text,numeric,uuid,numeric) to authenticated;