drop policy servicios_taller_insert on public.servicios_taller;
create policy servicios_taller_insert on public.servicios_taller for insert to authenticated with check(private.es_miembro_taller(taller_id) and creado_por=(select auth.uid()) and (estado='pendiente' or private.tiene_permiso_taller(taller_id,'catalogo','crear')));
drop policy servicios_taller_update on public.servicios_taller;
create policy servicios_taller_update on public.servicios_taller for update to authenticated using(private.tiene_permiso_taller(taller_id,'catalogo','editar')) with check(private.tiene_permiso_taller(taller_id,'catalogo','editar'));
drop policy servicios_taller_delete on public.servicios_taller;
create policy servicios_taller_delete on public.servicios_taller for delete to authenticated using(private.tiene_permiso_taller(taller_id,'catalogo','eliminar'));