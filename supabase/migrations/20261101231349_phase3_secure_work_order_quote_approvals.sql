create table if not exists public.ot_presupuestos_aprobacion (
  id uuid primary key default gen_random_uuid(),
  taller_id uuid not null references public.talleres(id) on delete cascade,
  orden_id uuid not null references public.ordenes_trabajo(id) on delete cascade,
  token_hash text not null unique,
  estado text not null default 'pendiente'
    check (estado in ('pendiente','aprobado','rechazado','revocado','vencido')),
  quote_snapshot jsonb not null,
  creado_por uuid references auth.users(id) on delete set null,
  expires_at timestamptz not null,
  respondido_por_nombre text,
  respondido_por_rut text,
  respuesta_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists ot_presupuestos_aprobacion_orden_estado_idx on public.ot_presupuestos_aprobacion (orden_id, estado, created_at desc);
alter table public.ot_presupuestos_aprobacion enable row level security;
revoke all on public.ot_presupuestos_aprobacion from anon, authenticated;
grant all on public.ot_presupuestos_aprobacion to service_role;
