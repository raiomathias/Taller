-- Agrega índices a las columnas locales de todas las FK sin índice de cobertura.
do $$
declare r record; v_cols text; v_idx text;
begin
 for r in
  select c.conrelid,c.conkey,cl.relname as table_name,array_agg(a.attname order by u.ord) as col_names
  from pg_constraint c join pg_class cl on cl.oid=c.conrelid
  cross join lateral unnest(c.conkey) with ordinality u(attnum,ord)
  join pg_attribute a on a.attrelid=c.conrelid and a.attnum=u.attnum
  where c.contype='f' and c.connamespace='public'::regnamespace
  group by c.conrelid,c.conkey,cl.relname,c.conname
 loop
  if not exists(select 1 from pg_index i where i.indrelid=r.conrelid and i.indisvalid and i.indpred is null and i.indexprs is null
   and (select array_agg(k.attnum order by k.ord) from unnest(i.indkey::smallint[]) with ordinality k(attnum,ord) where k.ord<=cardinality(r.conkey))=r.conkey) then
   select string_agg(quote_ident(x),',') into v_cols from unnest(r.col_names) x;
   v_idx:=left('idx_fk_'||r.table_name||'_'||array_to_string(r.col_names,'_'),60);
   execute format('create index if not exists %I on %s (%s)',v_idx,r.conrelid::regclass,v_cols);
  end if;
 end loop;
end $$;