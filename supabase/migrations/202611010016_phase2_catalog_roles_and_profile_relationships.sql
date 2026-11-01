-- Direct profiles relationships, service catalogue, and editable role permission storage.
alter table public.usuarios_taller add constraint usuarios_taller_perfiles_fkey foreign key(usuario_id) references public.perfiles(id) on delete cascade;
alter table public.auditoria add constraint auditoria_perfiles_fkey foreign key(usuario_id) references public.perfiles(id) on delete set null;
create table public.servicios_taller(id uuid primary key default gen_random_uuid(),taller_id uuid not null references public.talleres(id) on delete cascade,nombre text not null check(length(trim(nombre)) between 2 and 120),descripcion text,precio numeric(14,2) not null default 0 check(precio>=0),estado text not null default 'pendiente' check(estado in('pendiente','aprobado','rechazado')),creado_por uuid references auth.users(id) on delete set null,revisado_por uuid references auth.users(id) on delete set null,revisado_at timestamptz,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(taller_id,nombre));
alter table public.servicios_taller enable row level security;
create index servicios_taller_taller_estado_idx on public.servicios_taller(taller_id,estado);
create policy servicios_taller_select on public.servicios_taller for select to authenticated using(private.es_miembro_taller(taller_id));
create policy servicios_taller_insert on public.servicios_taller for insert to authenticated with check(private.es_miembro_taller(taller_id) and creado_por=auth.uid());
create policy servicios_taller_update on public.servicios_taller for update to authenticated using(private.tiene_rol_taller(taller_id,array['administrador','gerente'])) with check(private.tiene_rol_taller(taller_id,array['administrador','gerente']));
create policy servicios_taller_delete on public.servicios_taller for delete to authenticated using(private.tiene_rol_taller(taller_id,array['administrador','gerente']));
grant select,insert,update,delete on public.servicios_taller to authenticated;
create table public.permisos_rol_taller(id uuid primary key default gen_random_uuid(),taller_id uuid not null references public.talleres(id) on delete cascade,rol text not null check(rol in('administrador','gerente','jefe_taller','recepcionista','mecanico','bodeguero','administracion')),permisos jsonb not null default '{}'::jsonb check(jsonb_typeof(permisos)='object'),updated_by uuid references auth.users(id) on delete set null,updated_at timestamptz not null default now(),unique(taller_id,rol));
alter table public.permisos_rol_taller enable row level security;
create policy permisos_rol_select on public.permisos_rol_taller for select to authenticated using(private.es_miembro_taller(taller_id));
create policy permisos_rol_insert on public.permisos_rol_taller for insert to authenticated with check(private.tiene_rol_taller(taller_id,array['administrador','gerente']) and updated_by=auth.uid());
create policy permisos_rol_update on public.permisos_rol_taller for update to authenticated using(private.tiene_rol_taller(taller_id,array['administrador','gerente'])) with check(private.tiene_rol_taller(taller_id,array['administrador','gerente']));
grant select,insert,update on public.permisos_rol_taller to authenticated;
create trigger servicios_taller_auditoria after insert or update or delete on public.servicios_taller for each row execute function private.registrar_auditoria_fase1();
create trigger permisos_rol_auditoria after insert or update or delete on public.permisos_rol_taller for each row execute function private.registrar_auditoria_fase1();