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