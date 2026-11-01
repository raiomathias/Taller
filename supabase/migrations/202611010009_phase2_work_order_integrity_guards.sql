-- Integridad operacional de órdenes de trabajo y autorización por rol.
create unique index if not exists ot_tiempos_unico_timer_activo_idx on public.ot_tiempos(taller_id,mecanico_id) where termino is null;
create unique index if not exists ot_asignaciones_una_activa_por_tarea_idx on public.ot_asignaciones(tarea_id) where activa and tarea_id is not null;
revoke insert,update on public.ot_detalles from authenticated;
grant select,delete on public.ot_detalles to authenticated;
drop policy if exists ot_asignaciones_insert on public.ot_asignaciones;
drop policy if exists ot_asignaciones_update on public.ot_asignaciones;
create policy ot_asignaciones_insert on public.ot_asignaciones for insert to authenticated with check(private.tiene_rol_taller(taller_id,array['administrador','gerente','jefe_taller']) and exists(select 1 from public.usuarios_taller u where u.taller_id=ot_asignaciones.taller_id and u.usuario_id=ot_asignaciones.mecanico_id and u.activo));
create policy ot_asignaciones_update on public.ot_asignaciones for update to authenticated using(private.tiene_rol_taller(taller_id,array['administrador','gerente','jefe_taller'])) with check(private.tiene_rol_taller(taller_id,array['administrador','gerente','jefe_taller']) and exists(select 1 from public.usuarios_taller u where u.taller_id=ot_asignaciones.taller_id and u.usuario_id=ot_asignaciones.mecanico_id and u.activo));
drop policy if exists ot_tiempos_insert on public.ot_tiempos;
drop policy if exists ot_tiempos_update on public.ot_tiempos;
create policy ot_tiempos_insert on public.ot_tiempos for insert to authenticated with check(private.tiene_rol_taller(taller_id,array['administrador','gerente','jefe_taller','mecanico']) and exists(select 1 from public.usuarios_taller u where u.taller_id=ot_tiempos.taller_id and u.usuario_id=ot_tiempos.mecanico_id and u.activo) and (mecanico_id=(select auth.uid()) or private.tiene_rol_taller(taller_id,array['administrador','gerente','jefe_taller'])));
create policy ot_tiempos_update on public.ot_tiempos for update to authenticated using(private.tiene_rol_taller(taller_id,array['administrador','gerente','jefe_taller']) or (mecanico_id=(select auth.uid()) and private.tiene_rol_taller(taller_id,array['mecanico']))) with check((private.tiene_rol_taller(taller_id,array['administrador','gerente','jefe_taller']) or (mecanico_id=(select auth.uid()) and private.tiene_rol_taller(taller_id,array['mecanico']))) and exists(select 1 from public.usuarios_taller u where u.taller_id=ot_tiempos.taller_id and u.usuario_id=ot_tiempos.mecanico_id and u.activo));
create or replace function private.ot_validar_transicion_estado() returns trigger language plpgsql security definer set search_path='' as $$
declare v_ok boolean:=false;
begin
 if new.estado is not distinct from old.estado then return new;end if;
 if old.estado in('entregada','cancelada') then raise exception 'No se puede modificar una orden cerrada.' using errcode='23514';end if;
 v_ok:=case old.estado
 when 'recibida' then new.estado in('diagnostico','cancelada')
 when 'diagnostico' then new.estado in('presupuestada','cancelada')
 when 'presupuestada' then new.estado in('esperando_autorizacion','cancelada')
 when 'esperando_autorizacion' then new.estado in('autorizada','cancelada')
 when 'autorizada' then new.estado in('esperando_repuestos','en_reparacion','cancelada')
 when 'esperando_repuestos' then new.estado in('en_reparacion','cancelada')
 when 'en_reparacion' then new.estado in('control_calidad','cancelada')
 when 'control_calidad' then new.estado in('en_reparacion','lista_entrega','cancelada')
 when 'lista_entrega' then new.estado in('entregada','en_reparacion','cancelada')
 else false end;
 if not v_ok then raise exception 'Transición de estado no permitida: % → %.',old.estado,new.estado using errcode='23514';end if;
 if new.estado='autorizada' and (nullif(trim(coalesce(new.autorizado_por,'')),'') is null or new.autorizado_at is null) then raise exception 'Registra quién autorizó el presupuesto.' using errcode='23514';end if;
 if new.estado='en_reparacion' and old.estado not in('autorizada','esperando_repuestos','control_calidad','lista_entrega') then raise exception 'La orden requiere autorización antes de reparar.' using errcode='23514';end if;
 if new.estado='lista_entrega' and not exists(select 1 from public.ot_inspecciones i where i.orden_id=new.id and i.taller_id=new.taller_id and i.etapa='calidad' and i.resultado='aprobada') then raise exception 'Completa y aprueba el checklist de control de calidad.' using errcode='23514';end if;
 if new.estado='entregada' and (old.estado<>'lista_entrega' or new.fecha_entrega is null) then raise exception 'La orden debe estar lista para entrega.' using errcode='23514';end if;
 return new;
end;$$;
revoke all on function private.ot_validar_transicion_estado() from public,anon,authenticated;
drop trigger if exists ot_validar_transicion_estado_trg on public.ordenes_trabajo;
create trigger ot_validar_transicion_estado_trg before update of estado on public.ordenes_trabajo for each row execute function private.ot_validar_transicion_estado();