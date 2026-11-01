# Taller — sistema de gestión de talleres mecánicos

Aplicación web para administrar inventario, clientes, vehículos, proveedores y bodegas. La Fase 1 incluye un entorno de demostración local y conexión opcional al backend Supabase.

## Stack
- React 19, TypeScript y Vite
- Supabase Auth y PostgreSQL
- Lucide icons
- Diseño adaptable con tema claro/oscuro

## Ejecutar localmente
```bash
npm install
cp .env.example .env.local
npm run dev
```

Si no defines una clave de Supabase, la aplicación inicia automáticamente en modo demostración local. Los cambios del modo demo se guardan en el navegador y no se sincronizan entre equipos.

## Conectar Supabase
Configura:
- `VITE_SUPABASE_URL`: URL del proyecto (por defecto ya apunta al proyecto Taller).
- `VITE_SUPABASE_ANON_KEY`: clave publicable/anon del proyecto.

Nunca uses `service_role` ni claves secretas en el navegador.

## GitHub Pages
El proyecto se publica en `https://raiomathias.github.io/Taller/`.
El workflow `.github/workflows/deploy.yml` compila y publica al hacer push a `main`.

Para habilitar datos reales desde Pages:
1. En GitHub, abre Settings → Secrets and variables → Actions.
2. Crea el secret `VITE_SUPABASE_ANON_KEY` con la clave publicable de Supabase.
3. (Opcional) crea la variable `VITE_SUPABASE_URL`; si no existe, se usa la URL del proyecto Taller.
4. En Settings → Pages, selecciona **GitHub Actions** como fuente de publicación.

Sin el secret, la página queda en modo demostración local.

## Funciones disponibles en Fase 1
- Resumen con indicadores y alertas de stock mínimo.
- Catálogo de repuestos, insumos, herramientas y equipos.
- Categorías, proveedores y bodegas.
- Fichas de clientes y vehículos.
- Movimientos de entrada, salida y ajuste con validación de stock.
- Kardex de movimientos.
- Edición y desactivación de registros.
- Navegación por mouse y teclado (Ctrl/Cmd+K, Ctrl/Cmd+N y Escape).

## Seguridad
El backend aplica RLS por taller y permisos por rol. Los cambios de stock se ejecutan mediante la función transaccional `registrar_movimiento_stock`, no mediante actualizaciones directas a la tabla de existencias.
