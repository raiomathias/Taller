
-- Fase 2: estructura relacional de órdenes de trabajo.
create unique index if not exists clientes_id_taller_uidx on public.clientes(id,taller_id);
create unique index if not exists vehiculos_id_taller_uidx on public.vehiculos(id,taller_id);
create unique index if not exists productos_id_taller_uidx on public.productos(id,taller_id);
create unique index if not exists bodegas_id_taller_uidx on public.bodegas(id,taller_id);

create table if not exists public.ordenes_trabajo (
 id uuid primary key default gen_random_uuid(), taller_id uuid not null references public.talleres(id) on delete cascade,
 folio bigint not null, numero_ot text not null, cliente_id uuid not null, vehiculo_id uuid not null,
 estado text not null default 'recibida' check(estado in ('recibida','diagnostico','presupuestada','esperando_autorizacion','autorizada','esperando_repuestos','en_reparacion','control_calidad','lista_entrega','entregada','cancelada')),
 prioridad text not null default 'normal' check(prioridad in ('baja','normal','alta','urgente')),
 fecha_recepcion timestamptz not null default now(), fecha_prometida timestamptz, fecha_inicio timestamptz, fecha_termino timestamptz, fecha_entrega timestamptz,
 kilometraje_ingreso numeric(12,1) not null default 0 check(kilometraje_ingreso>=0), nivel_combustible text,
 sintomas text, observaciones_recepcion text, accesorios jsonb not null default '[]', danos_preexistentes jsonb not null default '[]',
 diagnostico text, trabajo_solicitado text, notas_internas text, autorizado_por text, autorizado_at timestamptz,
 subtotal numeric(14,2) not null default 0 check(subtotal>=0), descuento numeric(14,2) not null default 0 check(descuento>=0),
 impuesto numeric(14,2) not null default 0 check(impuesto>=0), total numeric(14,2) not null default 0 check(total>=0), saldo numeric(14,2) not null default 0 check(saldo>=0),
 creado_por uuid references auth.users(id), entregado_por uuid references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(taller_id,folio),unique(taller_id,numero_ot),unique(id,taller_id),
 foreign key(cliente_id,taller_id) references public.clientes(id,taller_id),
 foreign key(vehiculo_id,taller_id) references public.vehiculos(id,taller_id)
);
create table if not exists public.ot_detalles (
 id uuid primary key default gen_random_uuid(),taller_id uuid not null references public.talleres(id) on delete cascade,orden_id uuid not null,
 tipo text not null check(tipo in ('mano_obra','repuesto','insumo','servicio','otro')),producto_id uuid,bodega_id uuid,
 descripcion text not null,cantidad numeric(12,3) not null default 1 check(cantidad>0),precio_unitario numeric(14,2) not null default 0 check(precio_unitario>=0),
 costo_unitario_historico numeric(14,2) not null default 0 check(costo_unitario_historico>=0),
 total_linea numeric(14,2) generated always as(round(cantidad*precio_unitario,2)) stored,consumido boolean not null default false,consumido_at timestamptz,
 creado_por uuid references auth.users(id),created_at timestamptz not null default now(),unique(id,taller_id),
 foreign key(orden_id,taller_id) references public.ordenes_trabajo(id,taller_id) on delete cascade,
 foreign key(producto_id,taller_id) references public.productos(id,taller_id),
 foreign key(bodega_id,taller_id) references public.bodegas(id,taller_id)
);
create table if not exists public.ot_tareas (
 id uuid primary key default gen_random_uuid(),taller_id uuid not null references public.talleres(id) on delete cascade,orden_id uuid not null,
 titulo text not null,descripcion text,estado text not null default 'pendiente' check(estado in ('pendiente','en_progreso','bloqueada','completada','cancelada')),
 prioridad text not null default 'normal' check(prioridad in ('baja','normal','alta','urgente')),horas_estimadas numeric(8,2) not null default 0 check(horas_estimadas>=0),
 horas_reales numeric(8,2) not null default 0 check(horas_reales>=0),fecha_inicio timestamptz,fecha_termino timestamptz,creado_por uuid references auth.users(id),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(id,taller_id),
 foreign key(orden_id,taller_id) references public.ordenes_trabajo(id,taller_id) on delete cascade
);
create table if not exists public.ot_asignaciones (
 id uuid primary key default gen_random_uuid(),taller_id uuid not null references public.talleres(id) on delete cascade,orden_id uuid not null,tarea_id uuid,
 mecanico_id uuid not null references auth.users(id),asignado_por uuid references auth.users(id),fecha_asignacion timestamptz not null default now(),activa boolean not null default true,created_at timestamptz not null default now(),
 foreign key(orden_id,taller_id) references public.ordenes_trabajo(id,taller_id) on delete cascade,
 foreign key(tarea_id,taller_id) references public.ot_tareas(id,taller_id) on delete cascade
);
create table if not exists public.ot_tiempos (
 id uuid primary key default gen_random_uuid(),taller_id uuid not null references public.talleres(id) on delete cascade,orden_id uuid not null,tarea_id uuid,
 mecanico_id uuid not null references auth.users(id),inicio timestamptz not null default now(),termino timestamptz,
 duracion_minutos integer generated always as(case when termino is null then null else greatest(0,round(extract(epoch from(termino-inicio))/60)::integer) end) stored,
 descripcion text,created_at timestamptz not null default now(),
 foreign key(orden_id,taller_id) references public.ordenes_trabajo(id,taller_id) on delete cascade,
 foreign key(tarea_id,taller_id) references public.ot_tareas(id,taller_id),check(termino is null or termino>=inicio)
);
create table if not exists public.ot_inspecciones (
 id uuid primary key default gen_random_uuid(),taller_id uuid not null references public.talleres(id) on delete cascade,orden_id uuid not null,
 etapa text not null check(etapa in ('recepcion','seguridad','calidad','entrega')),items jsonb not null default '[]',
 resultado text not null default 'pendiente' check(resultado in ('pendiente','aprobada','observada','rechazada')),observaciones text,
 revisado_por uuid references auth.users(id),revisado_at timestamptz,created_at timestamptz not null default now(),
 foreign key(orden_id,taller_id) references public.ordenes_trabajo(id,taller_id) on delete cascade
);
create table if not exists public.ot_pagos (
 id uuid primary key default gen_random_uuid(),taller_id uuid not null references public.talleres(id) on delete cascade,orden_id uuid not null,
 monto numeric(14,2) not null check(monto>0),metodo text not null check(metodo in ('efectivo','debito','credito','transferencia','cheque','otro')),
 referencia text,observaciones text,recibido_por uuid references auth.users(id),created_at timestamptz not null default now(),
 foreign key(orden_id,taller_id) references public.ordenes_trabajo(id,taller_id) on delete cascade
);
create table if not exists public.ot_adjuntos (
 id uuid primary key default gen_random_uuid(),taller_id uuid not null references public.talleres(id) on delete cascade,orden_id uuid not null,
 storage_path text not null unique,nombre_archivo text not null,mime_type text,tamano_bytes bigint check(tamano_bytes is null or tamano_bytes>=0),
 categoria text not null default 'evidencia' check(categoria in ('recepcion','diagnostico','reparacion','calidad','entrega','evidencia','documento')),
 descripcion text,subido_por uuid references auth.users(id),created_at timestamptz not null default now(),
 foreign key(orden_id,taller_id) references public.ordenes_trabajo(id,taller_id) on delete cascade
);
create index if not exists ot_taller_estado_idx on public.ordenes_trabajo(taller_id,estado,fecha_recepcion desc);
create index if not exists ot_vehiculo_fecha_idx on public.ordenes_trabajo(vehiculo_id,fecha_recepcion desc);
create index if not exists ot_detalles_orden_idx on public.ot_detalles(orden_id);
create index if not exists ot_tareas_orden_idx on public.ot_tareas(orden_id,estado);
create index if not exists ot_asignaciones_mecanico_idx on public.ot_asignaciones(mecanico_id,activa);
create index if not exists ot_tiempos_orden_idx on public.ot_tiempos(orden_id,inicio desc);
create index if not exists ot_pagos_orden_idx on public.ot_pagos(orden_id,created_at desc);
create index if not exists ot_adjuntos_orden_idx on public.ot_adjuntos(orden_id,created_at desc);

create or replace function private.ot_actualizar_timestamp() returns trigger language plpgsql set search_path='' as $$ begin new.updated_at=now();return new;end;$$;
revoke all on function private.ot_actualizar_timestamp() from public,anon,authenticated;
create trigger ot_actualizar_timestamp_trg before update on public.ordenes_trabajo for each row execute function private.ot_actualizar_timestamp();
create trigger ot_tareas_actualizar_timestamp_trg before update on public.ot_tareas for each row execute function private.ot_actualizar_timestamp();

create or replace function private.crear_orden_trabajo(p_taller_id uuid,p_cliente_id uuid,p_vehiculo_id uuid,p_kilometraje numeric,p_sintomas text,p_trabajo_solicitado text,p_observaciones text,p_prioridad text,p_fecha_prometida timestamptz)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_uid uuid:=auth.uid();v_folio bigint;v_prefijo text;v_id uuid;
begin
 if v_uid is null then raise exception 'Debes iniciar sesión.' using errcode='42501';end if;
 if not private.tiene_rol_taller(p_taller_id,array['administrador','gerente','jefe_taller','recepcionista','administracion']) then raise exception 'No tienes permiso para crear órdenes de trabajo.' using errcode='42501';end if;
 if p_kilometraje<0 or p_prioridad not in('baja','normal','alta','urgente') then raise exception 'Datos de recepción inválidos.';end if;
 if not exists(select 1 from public.clientes where id=p_cliente_id and taller_id=p_taller_id and activo) or not exists(select 1 from public.vehiculos where id=p_vehiculo_id and taller_id=p_taller_id and cliente_id=p_cliente_id and activo) then raise exception 'El vehículo no pertenece al cliente seleccionado.' using errcode='23503';end if;
 insert into public.configuracion_taller(taller_id) values(p_taller_id) on conflict(taller_id) do nothing;
 select proximo_folio_ot,prefijo_ot into v_folio,v_prefijo from public.configuracion_taller where taller_id=p_taller_id for update;
 update public.configuracion_taller set proximo_folio_ot=v_folio+1 where taller_id=p_taller_id;
 insert into public.ordenes_trabajo(taller_id,folio,numero_ot,cliente_id,vehiculo_id,kilometraje_ingreso,sintomas,trabajo_solicitado,observaciones_recepcion,prioridad,fecha_prometida,creado_por)
 values(p_taller_id,v_folio,coalesce(nullif(trim(v_prefijo),''),'OT')||'-'||lpad(v_folio::text,6,'0'),p_cliente_id,p_vehiculo_id,p_kilometraje,nullif(trim(p_sintomas),''),nullif(trim(p_trabajo_solicitado),''),nullif(trim(p_observaciones),''),p_prioridad,p_fecha_prometida,v_uid) returning id into v_id;
 insert into public.ot_inspecciones(taller_id,orden_id,etapa,items) values(p_taller_id,v_id,'recepcion','[]');
 insert into public.auditoria(taller_id,usuario_id,entidad,entidad_id,accion,detalle) values(p_taller_id,v_uid,'ordenes_trabajo',v_id::text,'crear',jsonb_build_object('folio',v_folio,'cliente_id',p_cliente_id,'vehiculo_id',p_vehiculo_id));
 return v_id;
end;$$;
revoke all on function private.crear_orden_trabajo(uuid,uuid,uuid,numeric,text,text,text,text,timestamptz) from public,anon,authenticated;
create or replace function public.crear_orden_trabajo(p_taller_id uuid,p_cliente_id uuid,p_vehiculo_id uuid,p_kilometraje numeric default 0,p_sintomas text default null,p_trabajo_solicitado text default null,p_observaciones text default null,p_prioridad text default 'normal',p_fecha_prometida timestamptz default null)
returns uuid language sql set search_path='' as $$ select private.crear_orden_trabajo(p_taller_id,p_cliente_id,p_vehiculo_id,p_kilometraje,p_sintomas,p_trabajo_solicitado,p_observaciones,p_prioridad,p_fecha_prometida);$$;
revoke all on function public.crear_orden_trabajo(uuid,uuid,uuid,numeric,text,text,text,text,timestamptz) from public,anon;
grant execute on function public.crear_orden_trabajo(uuid,uuid,uuid,numeric,text,text,text,text,timestamptz) to authenticated;

create or replace function private.ot_recalcular_totales(p_orden_id uuid) returns void language plpgsql security definer set search_path='' as $$
declare v_sub numeric;v_desc numeric;v_paid numeric;v_taller uuid;v_rate numeric;
begin
 select taller_id,descuento into v_taller,v_desc from public.ordenes_trabajo where id=p_orden_id for update;
 if v_taller is null then raise exception 'Orden no encontrada.';end if;
 select coalesce(sum(total_linea),0) into v_sub from public.ot_detalles where orden_id=p_orden_id;
 select coalesce(sum(monto),0) into v_paid from public.ot_pagos where orden_id=p_orden_id;
 select coalesce(impuesto_porcentaje,0) into v_rate from public.configuracion_taller where taller_id=v_taller;
 update public.ordenes_trabajo set subtotal=v_sub,impuesto=greatest(v_sub-coalesce(v_desc,0),0)*v_rate/100,total=greatest(v_sub-coalesce(v_desc,0),0)*(1+v_rate/100),saldo=greatest(greatest(v_sub-coalesce(v_desc,0),0)*(1+v_rate/100)-v_paid,0) where id=p_orden_id;
end;$$;
revoke all on function private.ot_recalcular_totales(uuid) from public,anon,authenticated;
create or replace function private.ot_recalcular_totales_trigger() returns trigger language plpgsql security definer set search_path='' as $$ begin perform private.ot_recalcular_totales(coalesce(new.orden_id,old.orden_id));return coalesce(new,old);end;$$;
revoke all on function private.ot_recalcular_totales_trigger() from public,anon,authenticated;
create trigger ot_detalles_totales_trg after insert or update or delete on public.ot_detalles for each row execute function private.ot_recalcular_totales_trigger();
create trigger ot_pagos_totales_trg after insert or update or delete on public.ot_pagos for each row execute function private.ot_recalcular_totales_trigger();

do $$ declare t text;begin
 foreach t in array array['ordenes_trabajo','ot_detalles','ot_tareas','ot_asignaciones','ot_tiempos','ot_inspecciones','ot_pagos','ot_adjuntos'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('grant select,insert,update,delete on public.%I to authenticated',t);
  execute format('grant all on public.%I to service_role',t);
  execute format('create policy %I on public.%I for select to authenticated using(private.es_miembro_taller(taller_id))',t||'_select',t);
  execute format('create policy %I on public.%I for insert to authenticated with check(private.tiene_rol_taller(taller_id,array[''administrador'',''gerente'',''jefe_taller'',''recepcionista'',''mecanico'',''bodeguero'',''administracion'']))',t||'_insert',t);
  execute format('create policy %I on public.%I for update to authenticated using(private.tiene_rol_taller(taller_id,array[''administrador'',''gerente'',''jefe_taller'',''recepcionista'',''mecanico'',''bodeguero'',''administracion''])) with check(private.tiene_rol_taller(taller_id,array[''administrador'',''gerente'',''jefe_taller'',''recepcionista'',''mecanico'',''bodeguero'',''administracion'']))',t||'_update',t);
  execute format('create policy %I on public.%I for delete to authenticated using(private.tiene_rol_taller(taller_id,array[''administrador'',''gerente'',''jefe_taller'']))',t||'_delete',t);
 end loop;
end$$;
grant usage on schema public to authenticated;
grant select,insert,update,delete on public.ordenes_trabajo,public.ot_detalles,public.ot_tareas,public.ot_asignaciones,public.ot_tiempos,public.ot_inspecciones,public.ot_pagos,public.ot_adjuntos to authenticated;
grant all on public.ordenes_trabajo,public.ot_detalles,public.ot_tareas,public.ot_asignaciones,public.ot_tiempos,public.ot_inspecciones,public.ot_pagos,public.ot_adjuntos to service_role;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('ot-evidencias','ot-evidencias',false,15728640,array['image/jpeg','image/png','image/webp','application/pdf']);
create policy ot_evidencias_select on storage.objects for select to authenticated using(bucket_id='ot-evidencias' and private.es_miembro_taller(((storage.foldername(name))[1])::uuid));
create policy ot_evidencias_insert on storage.objects for insert to authenticated with check(bucket_id='ot-evidencias' and private.tiene_rol_taller(((storage.foldername(name))[1])::uuid,array['administrador','gerente','jefe_taller','recepcionista','mecanico','administracion']));
create policy ot_evidencias_update on storage.objects for update to authenticated using(bucket_id='ot-evidencias' and private.tiene_rol_taller(((storage.foldername(name))[1])::uuid,array['administrador','gerente','jefe_taller','recepcionista','mecanico','administracion'])) with check(bucket_id='ot-evidencias' and private.tiene_rol_taller(((storage.foldername(name))[1])::uuid,array['administrador','gerente','jefe_taller','recepcionista','mecanico','administracion']));
create policy ot_evidencias_delete on storage.objects for delete to authenticated using(bucket_id='ot-evidencias' and private.tiene_rol_taller(((storage.foldername(name))[1])::uuid,array['administrador','gerente','jefe_taller']));
