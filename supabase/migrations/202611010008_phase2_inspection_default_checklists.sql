-- Plantillas iniciales para checklists de recepción y control de calidad.
create or replace function private.ot_inspeccion_default_items()
returns trigger language plpgsql set search_path='' as $$
begin
 if coalesce(jsonb_array_length(new.items),0)=0 then
  if new.etapa='recepcion' then
   new.items:=jsonb_build_array(
    jsonb_build_object('label','Carrocería y pintura','estado','pendiente'),
    jsonb_build_object('label','Parabrisas y cristales','estado','pendiente'),
    jsonb_build_object('label','Luces y señalizadores','estado','pendiente'),
    jsonb_build_object('label','Neumáticos y llantas','estado','pendiente'),
    jsonb_build_object('label','Espejos','estado','pendiente'),
    jsonb_build_object('label','Interior y tapicería','estado','pendiente'),
    jsonb_build_object('label','Herramientas y rueda de repuesto','estado','pendiente'),
    jsonb_build_object('label','Documentos del vehículo','estado','pendiente')
   );
  elsif new.etapa='calidad' then
   new.items:=jsonb_build_array(
    jsonb_build_object('label','Trabajo solicitado completado','estado','pendiente'),
    jsonb_build_object('label','Sin fugas visibles','estado','pendiente'),
    jsonb_build_object('label','Prueba de funcionamiento realizada','estado','pendiente'),
    jsonb_build_object('label','Herramientas retiradas del vehículo','estado','pendiente'),
    jsonb_build_object('label','Vehículo limpio y ordenado','estado','pendiente'),
    jsonb_build_object('label','Testigos del tablero revisados','estado','pendiente')
   );
  end if;
 end if;
 return new;
end;$$;
revoke all on function private.ot_inspeccion_default_items() from public,anon,authenticated;
drop trigger if exists ot_inspeccion_default_items_trg on public.ot_inspecciones;
create trigger ot_inspeccion_default_items_trg before insert on public.ot_inspecciones for each row execute function private.ot_inspeccion_default_items();