# Taller

Sistema integral de gestión de talleres mecánicos.

## Stack
- React + TypeScript + Vite
- Tailwind CSS
- Supabase Auth, PostgreSQL y Storage
- Tema claro/oscuro, diseño responsive y accesibilidad por teclado

## Fase 1
- Autenticación y configuración inicial del taller
- Clientes y vehículos
- Catálogo, categorías, proveedores y bodegas
- Existencias y movimientos de inventario
- Dashboard inicial
- Roles, RLS y auditoría

## Desarrollo
```bash
npm install
npm run dev
```

Configura `.env.local` a partir de `.env.example`.

## Supabase
Proyecto: `etwgqcgnmeulzwmdvwtf`.
Las tablas operativas están aisladas por `taller_id`. No publiques claves secretas en el frontend.
