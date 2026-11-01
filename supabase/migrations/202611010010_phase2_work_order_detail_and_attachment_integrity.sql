-- Los detalles solo se agregan mediante RPC transaccional; no permitir borrados sin reversa de inventario.
revoke insert,update,delete on public.ot_detalles from authenticated;
grant select on public.ot_detalles to authenticated;
alter table public.ot_adjuntos drop constraint if exists ot_adjuntos_storage_path_scope_chk;
alter table public.ot_adjuntos add constraint ot_adjuntos_storage_path_scope_chk check(storage_path like taller_id::text||'/'||orden_id::text||'/%');