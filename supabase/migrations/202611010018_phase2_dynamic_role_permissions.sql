create or replace function private.tiene_permiso_taller(p_taller_id uuid,p_modulo text,p_accion text)
returns boolean language plpgsql stable security definer set search_path='' as $$
declare v_rol text;v_permisos jsonb;
begin
 if auth.uid() is null then return false;end if;
 select rol into v_rol from public.usuarios_taller where taller_id=p_taller_id and usuario_id=auth.uid() and activo;
 if v_rol is null then return false;end if;
 if v_rol='administrador' then return true;end if;
 select permisos into v_permisos from public.permisos_rol_taller where taller_id=p_taller_id and rol=v_rol;
 if v_permisos ? p_modulo and (v_permisos->p_modulo) ? p_accion then return coalesce((v_permisos->p_modulo->>p_accion)::boolean,false);end if;
 if v_rol='gerente' then return true;end if;
 if p_accion='ver' then
  return p_modulo='resumen' or (p_modulo in('ordenes','inventario','movimientos','clientes','vehiculos','proveedores','categorias','bodegas') and v_rol='jefe_taller')
   or (p_modulo in('ordenes','clientes','vehiculos') and v_rol='recepcionista') or (p_modulo='ordenes' and v_rol='mecanico')
   or (p_modulo in('inventario','movimientos','proveedores','categorias','bodegas') and v_rol='bodeguero')
   or (p_modulo in('ordenes','clientes','vehiculos','proveedores') and v_rol='administracion') or (p_modulo='configuracion' and v_rol='administracion');
 end if;
 if p_accion in('crear','editar') then
  return (p_modulo in('ordenes','inventario','movimientos','clientes','vehiculos','proveedores','categorias','bodegas') and v_rol='jefe_taller')
   or (p_modulo in('inventario','movimientos','proveedores','categorias','bodegas') and v_rol='bodeguero')
   or (p_modulo in('ordenes','clientes','vehiculos') and v_rol in('recepcionista','administracion'));
 end if;
 return false;
end;$$;
revoke all on function private.tiene_permiso_taller(uuid,text,text) from public,anon;
grant execute on function private.tiene_permiso_taller(uuid,text,text) to authenticated;
drop policy productos_select on public.productos; create policy productos_select on public.productos for select to authenticated using(private.tiene_permiso_taller(taller_id,'inventario','ver'));
drop policy productos_insert on public.productos; create policy productos_insert on public.productos for insert to authenticated with check(private.tiene_permiso_taller(taller_id,'inventario','crear'));
drop policy productos_update on public.productos; create policy productos_update on public.productos for update to authenticated using(private.tiene_permiso_taller(taller_id,'inventario','editar')) with check(private.tiene_permiso_taller(taller_id,'inventario','editar'));
drop policy productos_delete on public.productos; create policy productos_delete on public.productos for delete to authenticated using(private.tiene_permiso_taller(taller_id,'inventario','eliminar'));
drop policy clientes_select on public.clientes; create policy clientes_select on public.clientes for select to authenticated using(private.tiene_permiso_taller(taller_id,'clientes','ver'));
drop policy clientes_insert on public.clientes; create policy clientes_insert on public.clientes for insert to authenticated with check(private.tiene_permiso_taller(taller_id,'clientes','crear'));
drop policy clientes_update on public.clientes; create policy clientes_update on public.clientes for update to authenticated using(private.tiene_permiso_taller(taller_id,'clientes','editar')) with check(private.tiene_permiso_taller(taller_id,'clientes','editar'));
drop policy clientes_delete on public.clientes; create policy clientes_delete on public.clientes for delete to authenticated using(private.tiene_permiso_taller(taller_id,'clientes','eliminar'));
drop policy vehiculos_select on public.vehiculos; create policy vehiculos_select on public.vehiculos for select to authenticated using(private.tiene_permiso_taller(taller_id,'vehiculos','ver'));
drop policy vehiculos_insert on public.vehiculos; create policy vehiculos_insert on public.vehiculos for insert to authenticated with check(private.tiene_permiso_taller(taller_id,'vehiculos','crear'));
drop policy vehiculos_update on public.vehiculos; create policy vehiculos_update on public.vehiculos for update to authenticated using(private.tiene_permiso_taller(taller_id,'vehiculos','editar')) with check(private.tiene_permiso_taller(taller_id,'vehiculos','editar'));
drop policy vehiculos_delete on public.vehiculos; create policy vehiculos_delete on public.vehiculos for delete to authenticated using(private.tiene_permiso_taller(taller_id,'vehiculos','eliminar'));
drop policy bodegas_select on public.bodegas; create policy bodegas_select on public.bodegas for select to authenticated using(private.tiene_permiso_taller(taller_id,'bodegas','ver'));
drop policy bodegas_insert on public.bodegas; create policy bodegas_insert on public.bodegas for insert to authenticated with check(private.tiene_permiso_taller(taller_id,'bodegas','crear'));
drop policy bodegas_update on public.bodegas; create policy bodegas_update on public.bodegas for update to authenticated using(private.tiene_permiso_taller(taller_id,'bodegas','editar')) with check(private.tiene_permiso_taller(taller_id,'bodegas','editar'));
drop policy bodegas_delete on public.bodegas; create policy bodegas_delete on public.bodegas for delete to authenticated using(private.tiene_permiso_taller(taller_id,'bodegas','eliminar'));
drop policy categorias_select on public.categorias_productos; create policy categorias_select on public.categorias_productos for select to authenticated using(private.tiene_permiso_taller(taller_id,'categorias','ver'));
drop policy categorias_insert on public.categorias_productos; create policy categorias_insert on public.categorias_productos for insert to authenticated with check(private.tiene_permiso_taller(taller_id,'categorias','crear'));
drop policy categorias_update on public.categorias_productos; create policy categorias_update on public.categorias_productos for update to authenticated using(private.tiene_permiso_taller(taller_id,'categorias','editar')) with check(private.tiene_permiso_taller(taller_id,'categorias','editar'));
drop policy categorias_delete on public.categorias_productos; create policy categorias_delete on public.categorias_productos for delete to authenticated using(private.tiene_permiso_taller(taller_id,'categorias','eliminar'));
drop policy proveedores_select on public.proveedores; create policy proveedores_select on public.proveedores for select to authenticated using(private.tiene_permiso_taller(taller_id,'proveedores','ver'));
drop policy proveedores_insert on public.proveedores; create policy proveedores_insert on public.proveedores for insert to authenticated with check(private.tiene_permiso_taller(taller_id,'proveedores','crear'));
drop policy proveedores_update on public.proveedores; create policy proveedores_update on public.proveedores for update to authenticated using(private.tiene_permiso_taller(taller_id,'proveedores','editar')) with check(private.tiene_permiso_taller(taller_id,'proveedores','editar'));
drop policy proveedores_delete on public.proveedores; create policy proveedores_delete on public.proveedores for delete to authenticated using(private.tiene_permiso_taller(taller_id,'proveedores','eliminar'));
drop policy movimientos_select on public.movimientos_stock; create policy movimientos_select on public.movimientos_stock for select to authenticated using(private.tiene_permiso_taller(taller_id,'movimientos','ver'));
drop policy stock_select on public.stock; create policy stock_select on public.stock for select to authenticated using(private.tiene_permiso_taller(taller_id,'inventario','ver'));
drop policy ordenes_trabajo_select on public.ordenes_trabajo; create policy ordenes_trabajo_select on public.ordenes_trabajo for select to authenticated using(private.tiene_permiso_taller(taller_id,'ordenes','ver'));
drop policy ordenes_trabajo_update on public.ordenes_trabajo; create policy ordenes_trabajo_update on public.ordenes_trabajo for update to authenticated using(private.tiene_permiso_taller(taller_id,'ordenes','editar')) with check(private.tiene_permiso_taller(taller_id,'ordenes','editar'));
drop policy ordenes_trabajo_delete on public.ordenes_trabajo; create policy ordenes_trabajo_delete on public.ordenes_trabajo for delete to authenticated using(private.tiene_permiso_taller(taller_id,'ordenes','eliminar'));
drop policy permisos_rol_insert on public.permisos_rol_taller; create policy permisos_rol_insert on public.permisos_rol_taller for insert to authenticated with check(private.tiene_rol_taller(taller_id,array['administrador','gerente','administracion']) and updated_by=auth.uid());
drop policy permisos_rol_update on public.permisos_rol_taller; create policy permisos_rol_update on public.permisos_rol_taller for update to authenticated using(private.tiene_rol_taller(taller_id,array['administrador','gerente','administracion'])) with check(private.tiene_rol_taller(taller_id,array['administrador','gerente','administracion']));