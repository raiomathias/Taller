create or replace function private.registrar_auditoria_fase1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_new jsonb := case when tg_op <> 'DELETE' then to_jsonb(new) else null end;
  v_old jsonb := case when tg_op <> 'INSERT' then to_jsonb(old) else null end;
  v_taller_id uuid;
  v_entidad_id text;
begin
  v_taller_id := coalesce((v_new->>'taller_id')::uuid,(v_old->>'taller_id')::uuid);
  if v_taller_id is null then
    return coalesce(new,old);
  end if;
  v_entidad_id := coalesce(v_new->>'id',v_old->>'id',v_new->>'taller_id',v_old->>'taller_id');
  insert into public.auditoria(taller_id,usuario_id,entidad,entidad_id,accion,detalle)
  values (
    v_taller_id,
    auth.uid(),
    tg_table_name,
    v_entidad_id,
    lower(tg_op),
    jsonb_build_object('tabla',tg_table_name,'operacion',tg_op)
  );
  return coalesce(new,old);
end;
$$;

revoke all on function private.registrar_auditoria_fase1() from public, anon, authenticated;

drop trigger if exists trg_auditoria_productos on public.productos;
create trigger trg_auditoria_productos after insert or update or delete on public.productos for each row execute function private.registrar_auditoria_fase1();
drop trigger if exists trg_auditoria_clientes on public.clientes;
create trigger trg_auditoria_clientes after insert or update or delete on public.clientes for each row execute function private.registrar_auditoria_fase1();
drop trigger if exists trg_auditoria_vehiculos on public.vehiculos;
create trigger trg_auditoria_vehiculos after insert or update or delete on public.vehiculos for each row execute function private.registrar_auditoria_fase1();
drop trigger if exists trg_auditoria_proveedores on public.proveedores;
create trigger trg_auditoria_proveedores after insert or update or delete on public.proveedores for each row execute function private.registrar_auditoria_fase1();
drop trigger if exists trg_auditoria_bodegas on public.bodegas;
create trigger trg_auditoria_bodegas after insert or update or delete on public.bodegas for each row execute function private.registrar_auditoria_fase1();
drop trigger if exists trg_auditoria_categorias on public.categorias_productos;
create trigger trg_auditoria_categorias after insert or update or delete on public.categorias_productos for each row execute function private.registrar_auditoria_fase1();
drop trigger if exists trg_auditoria_usuarios_taller on public.usuarios_taller;
create trigger trg_auditoria_usuarios_taller after insert or update or delete on public.usuarios_taller for each row execute function private.registrar_auditoria_fase1();
drop trigger if exists trg_auditoria_talleres on public.talleres;
create trigger trg_auditoria_talleres after insert or update or delete on public.talleres for each row execute function private.registrar_auditoria_fase1();
drop trigger if exists trg_auditoria_configuracion_taller on public.configuracion_taller;
create trigger trg_auditoria_configuracion_taller after insert or update or delete on public.configuracion_taller for each row execute function private.registrar_auditoria_fase1();
