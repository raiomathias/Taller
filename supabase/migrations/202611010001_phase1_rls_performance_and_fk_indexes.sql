-- Phase 1: avoid duplicate permissive SELECT policies while preserving role-based writes.
drop policy if exists bodegas_manage on public.bodegas;
create policy bodegas_insert on public.bodegas for insert to authenticated with check (private.tiene_rol_taller(taller_id,array['administrador','gerente','jefe_taller','bodeguero']));
create policy bodegas_update on public.bodegas for update to authenticated using (private.tiene_rol_taller(taller_id,array['administrador','gerente','jefe_taller','bodeguero'])) with check (private.tiene_rol_taller(taller_id,array['administrador','gerente','jefe_taller','bodeguero']));
create policy bodegas_delete on public.bodegas for delete to authenticated using (private.tiene_rol_taller(taller_id,array['administrador','gerente','jefe_taller','bodeguero']));

drop policy if exists categorias_manage on public.categorias_productos;
create policy categorias_insert on public.categorias_productos for insert to authenticated with check (private.tiene_rol_taller(taller_id,array['administrador','gerente','jefe_taller','bodeguero']));
create policy categorias_update on public.categorias_productos for update to authenticated using (private.tiene_rol_taller(taller_id,array['administrador','gerente','jefe_taller','bodeguero'])) with check (private.tiene_rol_taller(taller_id,array['administrador','gerente','jefe_taller','bodeguero']));
create policy categorias_delete on public.categorias_productos for delete to authenticated using (private.tiene_rol_taller(taller_id,array['administrador','gerente']));

drop policy if exists clientes_manage on public.clientes;
create policy clientes_insert on public.clientes for insert to authenticated with check (private.tiene_rol_taller(taller_id,array['administrador','gerente','jefe_taller','recepcionista','administracion']));
create policy clientes_update on public.clientes for update to authenticated using (private.tiene_rol_taller(taller_id,array['administrador','gerente','jefe_taller','recepcionista','administracion'])) with check (private.tiene_rol_taller(taller_id,array['administrador','gerente','jefe_taller','recepcionista','administracion']));
create policy clientes_delete on public.clientes for delete to authenticated using (private.tiene_rol_taller(taller_id,array['administrador','gerente']));

drop policy if exists config_taller_manage on public.configuracion_taller;
create policy config_taller_insert on public.configuracion_taller for insert to authenticated with check (private.tiene_rol_taller(taller_id,array['administrador','gerente']));
create policy config_taller_update on public.configuracion_taller for update to authenticated using (private.tiene_rol_taller(taller_id,array['administrador','gerente'])) with check (private.tiene_rol_taller(taller_id,array['administrador','gerente']));
create policy config_taller_delete on public.configuracion_taller for delete to authenticated using (private.tiene_rol_taller(taller_id,array['administrador','gerente']));

drop policy if exists productos_manage on public.productos;
create policy productos_insert on public.productos for insert to authenticated with check (private.tiene_rol_taller(taller_id,array['administrador','gerente','jefe_taller','bodeguero']));
create policy productos_update on public.productos for update to authenticated using (private.tiene_rol_taller(taller_id,array['administrador','gerente','jefe_taller','bodeguero'])) with check (private.tiene_rol_taller(taller_id,array['administrador','gerente','jefe_taller','bodeguero']));
create policy productos_delete on public.productos for delete to authenticated using (private.tiene_rol_taller(taller_id,array['administrador','gerente']));

drop policy if exists proveedores_manage on public.proveedores;
create policy proveedores_insert on public.proveedores for insert to authenticated with check (private.tiene_rol_taller(taller_id,array['administrador','gerente','jefe_taller','bodeguero','administracion']));
create policy proveedores_update on public.proveedores for update to authenticated using (private.tiene_rol_taller(taller_id,array['administrador','gerente','jefe_taller','bodeguero','administracion'])) with check (private.tiene_rol_taller(taller_id,array['administrador','gerente','jefe_taller','bodeguero','administracion']));
create policy proveedores_delete on public.proveedores for delete to authenticated using (private.tiene_rol_taller(taller_id,array['administrador','gerente']));

drop policy if exists usuarios_taller_manage on public.usuarios_taller;
create policy usuarios_taller_insert on public.usuarios_taller for insert to authenticated with check (private.tiene_rol_taller(taller_id,array['administrador','gerente']));
create policy usuarios_taller_update on public.usuarios_taller for update to authenticated using (private.tiene_rol_taller(taller_id,array['administrador','gerente'])) with check (private.tiene_rol_taller(taller_id,array['administrador','gerente']));
create policy usuarios_taller_delete on public.usuarios_taller for delete to authenticated using (private.tiene_rol_taller(taller_id,array['administrador','gerente']));

drop policy if exists vehiculos_manage on public.vehiculos;
create policy vehiculos_insert on public.vehiculos for insert to authenticated with check (private.tiene_rol_taller(taller_id,array['administrador','gerente','jefe_taller','recepcionista','administracion']));
create policy vehiculos_update on public.vehiculos for update to authenticated using (private.tiene_rol_taller(taller_id,array['administrador','gerente','jefe_taller','recepcionista','administracion'])) with check (private.tiene_rol_taller(taller_id,array['administrador','gerente','jefe_taller','recepcionista','administracion']));
create policy vehiculos_delete on public.vehiculos for delete to authenticated using (private.tiene_rol_taller(taller_id,array['administrador','gerente']));

drop policy if exists perfiles_select on public.perfiles;
create policy perfiles_select on public.perfiles for select to authenticated using ((select auth.uid())=id or private.comparte_taller(id));
drop policy if exists perfiles_update on public.perfiles;
create policy perfiles_update on public.perfiles for update to authenticated using ((select auth.uid())=id) with check ((select auth.uid())=id);

create index if not exists idx_auditoria_usuario_id on public.auditoria(usuario_id);
create index if not exists idx_movimientos_stock_bodega_id on public.movimientos_stock(bodega_id);
create index if not exists idx_movimientos_stock_producto_id on public.movimientos_stock(producto_id);
create index if not exists idx_movimientos_stock_usuario_id on public.movimientos_stock(usuario_id);
create index if not exists idx_productos_categoria_id on public.productos(categoria_id);
create index if not exists idx_productos_proveedor_id on public.productos(proveedor_principal_id);
create index if not exists idx_proveedores_taller_id on public.proveedores(taller_id);
create index if not exists idx_stock_bodega_id on public.stock(bodega_id);
create index if not exists idx_stock_producto_id on public.stock(producto_id);
