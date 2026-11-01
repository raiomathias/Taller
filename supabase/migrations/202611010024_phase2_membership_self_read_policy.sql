drop policy talleres_select on public.talleres;
create policy talleres_select on public.talleres for select to authenticated using(private.es_miembro_taller(id));
drop policy usuarios_taller_select on public.usuarios_taller;
create policy usuarios_taller_select on public.usuarios_taller for select to authenticated using(usuario_id=auth.uid() or private.tiene_permiso_taller(taller_id,'usuarios','ver') or private.tiene_permiso_taller(taller_id,'ordenes','ver'));