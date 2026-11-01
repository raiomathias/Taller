-- RPC de recepción con nivel de combustible, accesorios y daños preexistentes.
create or replace function private.crear_orden_trabajo_recepcion(p_taller_id uuid,p_cliente_id uuid,p_vehiculo_id uuid,p_kilometraje numeric,p_sintomas text,p_trabajo_solicitado text,p_observaciones text,p_prioridad text,p_fecha_prometida timestamptz,p_nivel_combustible text,p_accesorios jsonb,p_danos_preexistentes jsonb)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_uid uuid:=auth.uid();v_folio bigint;v_prefijo text;v_id uuid;
begin
 if v_uid is null then raise exception 'Debes iniciar sesión.' using errcode='42501';end if;
 if not private.tiene_rol_taller(p_taller_id,array['administrador','gerente','jefe_taller','recepcionista','administracion']) then raise exception 'No tienes permiso para crear órdenes de trabajo.' using errcode='42501';end if;
 if p_kilometraje<0 or p_prioridad not in('baja','normal','alta','urgente') then raise exception 'Datos de recepción inválidos.';end if;
 if p_nivel_combustible is not null and p_nivel_combustible not in('vacio','1/4','1/2','3/4','lleno') then raise exception 'Nivel de combustible inválido.';end if;
 if jsonb_typeof(coalesce(p_accesorios,'[]'::jsonb))<>'array' or jsonb_typeof(coalesce(p_danos_preexistentes,'[]'::jsonb))<>'array' then raise exception 'Accesorios y daños deben ser listas.';end if;
 if not exists(select 1 from public.clientes where id=p_cliente_id and taller_id=p_taller_id and activo) or not exists(select 1 from public.vehiculos where id=p_vehiculo_id and taller_id=p_taller_id and cliente_id=p_cliente_id and activo) then raise exception 'El vehículo no pertenece al cliente seleccionado.' using errcode='23503';end if;
 insert into public.configuracion_taller(taller_id) values(p_taller_id) on conflict(taller_id) do nothing;
 select proximo_folio_ot,prefijo_ot into v_folio,v_prefijo from public.configuracion_taller where taller_id=p_taller_id for update;
 update public.configuracion_taller set proximo_folio_ot=v_folio+1 where taller_id=p_taller_id;
 insert into public.ordenes_trabajo(taller_id,folio,numero_ot,cliente_id,vehiculo_id,kilometraje_ingreso,sintomas,trabajo_solicitado,observaciones_recepcion,prioridad,fecha_prometida,nivel_combustible,accesorios,danos_preexistentes,creado_por)
 values(p_taller_id,v_folio,coalesce(nullif(trim(v_prefijo),''),'OT')||'-'||lpad(v_folio::text,6,'0'),p_cliente_id,p_vehiculo_id,p_kilometraje,nullif(trim(p_sintomas),''),nullif(trim(p_trabajo_solicitado),''),nullif(trim(p_observaciones),''),p_prioridad,p_fecha_prometida,p_nivel_combustible,coalesce(p_accesorios,'[]'::jsonb),coalesce(p_danos_preexistentes,'[]'::jsonb),v_uid) returning id into v_id;
 insert into public.ot_inspecciones(taller_id,orden_id,etapa,items) values(p_taller_id,v_id,'recepcion','[]'::jsonb);
 insert into public.auditoria(taller_id,usuario_id,entidad,entidad_id,accion,detalle) values(p_taller_id,v_uid,'ordenes_trabajo',v_id::text,'crear',jsonb_build_object('folio',v_folio,'cliente_id',p_cliente_id,'vehiculo_id',p_vehiculo_id));
 return v_id;
end;$$;
revoke all on function private.crear_orden_trabajo_recepcion(uuid,uuid,uuid,numeric,text,text,text,text,timestamptz,text,jsonb,jsonb) from public,anon,authenticated;
grant execute on function private.crear_orden_trabajo_recepcion(uuid,uuid,uuid,numeric,text,text,text,text,timestamptz,text,jsonb,jsonb) to authenticated;
create or replace function public.crear_orden_trabajo_recepcion(p_taller_id uuid,p_cliente_id uuid,p_vehiculo_id uuid,p_kilometraje numeric default 0,p_sintomas text default null,p_trabajo_solicitado text default null,p_observaciones text default null,p_prioridad text default 'normal',p_fecha_prometida timestamptz default null,p_nivel_combustible text default null,p_accesorios jsonb default '[]'::jsonb,p_danos_preexistentes jsonb default '[]'::jsonb)
returns uuid language sql security invoker set search_path='' as $$ select private.crear_orden_trabajo_recepcion(p_taller_id,p_cliente_id,p_vehiculo_id,p_kilometraje,p_sintomas,p_trabajo_solicitado,p_observaciones,p_prioridad,p_fecha_prometida,p_nivel_combustible,p_accesorios,p_danos_preexistentes);$$;
revoke all on function public.crear_orden_trabajo_recepcion(uuid,uuid,uuid,numeric,text,text,text,text,timestamptz,text,jsonb,jsonb) from public,anon;
grant execute on function public.crear_orden_trabajo_recepcion(uuid,uuid,uuid,numeric,text,text,text,text,timestamptz,text,jsonb,jsonb) to authenticated;