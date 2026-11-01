create index if not exists permisos_rol_taller_updated_by_idx on public.permisos_rol_taller(updated_by);
create index if not exists servicios_taller_creado_por_idx on public.servicios_taller(creado_por);
create index if not exists servicios_taller_revisado_por_idx on public.servicios_taller(revisado_por);
drop policy usuarios_taller_select on public.usuarios_taller;
create policy usuarios_taller_select on public.usuarios_taller for select to authenticated using(usuario_id=(select auth.uid()) or private.tiene_permiso_taller(taller_id,'usuarios','ver') or private.tiene_permiso_taller(taller_id,'ordenes','ver'));
drop policy servicios_taller_insert on public.servicios_taller;
create policy servicios_taller_insert on public.servicios_taller for insert to authenticated with check(private.es_miembro_taller(taller_id) and creado_por=(select auth.uid()));
drop policy permisos_rol_insert on public.permisos_rol_taller;
create policy permisos_rol_insert on public.permisos_rol_taller for insert to authenticated with check(private.tiene_rol_taller(taller_id,array['administrador','gerente','administracion']) and updated_by=(select auth.uid()));