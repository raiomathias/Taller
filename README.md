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
- `VITE_SUPABASE_PUBLISHABLE_KEY`: clave publicable del proyecto.

Nunca uses `service_role` ni claves secretas en el navegador.

## GitHub Pages
El proyecto se publica en `https://raiomathias.github.io/Taller/`.
El workflow `.github/workflows/deploy.yml` compila y publica al hacer push a `main`.

Para habilitar datos reales desde Pages:
1. En Settings → Pages, selecciona **GitHub Actions** como fuente de publicación.
2. En Supabase → Authentication → URL Configuration, agrega `https://raiomathias.github.io/Taller/` a las Redirect URLs.
3. La URL y la clave publicable ya están configuradas en el workflow; no se necesita una clave secreta de Supabase en GitHub.

La clave incluida es una clave publicable diseñada para clientes web; el acceso a los datos sigue protegido por RLS.

## Funciones disponibles en Fase 1
- Resumen con indicadores, valorización y alertas de stock mínimo.
- Configuración del taller, zona horaria, parámetros OT, impuesto y política de stock negativo.
- Catálogo de repuestos, insumos, herramientas y equipos.
- Categorías, proveedores y bodegas.
- Fichas de clientes y vehículos.
- Gestión de membresías y asignación de roles a usuarios existentes de Supabase (por UUID).
- Auditoría automática de cambios de catálogo, clientes, vehículos, proveedores, bodegas, usuarios y configuración.
- Movimientos de entrada, salida y ajuste con validación de stock.
- Kardex de movimientos.
- Edición y desactivación de registros.
- Navegación por mouse y teclado (Ctrl/Cmd+K, Ctrl/Cmd+N y Escape).

## Seguridad
El backend aplica RLS por taller y permisos por rol. Los cambios de stock se ejecutan mediante la función transaccional `registrar_movimiento_stock`, no mediante actualizaciones directas a la tabla de existencias.
