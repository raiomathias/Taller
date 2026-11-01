# Taller — sistema de gestión de talleres mecánicos

Aplicación web para administrar talleres mecánicos. Incluye inventario, clientes, vehículos y órdenes de trabajo con un entorno de demostración local y conexión a Supabase.

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

## Funciones implementadas en Fase 2
- Recepción de vehículos y creación de OT con folio consecutivo seguro por taller.
- Seguimiento del ciclo de trabajo: recibida, diagnóstico, presupuesto, autorización, reparación, control de calidad y entrega.
- Diagnóstico técnico y prioridad de atención.
- Detalles de mano de obra, repuestos, insumos y servicios.
- Consumo de inventario vinculado a la OT mediante operación transaccional; respeta la política de stock negativo.
- Tareas de reparación, asignación de mecánicos y registro de tiempos.
- Registro de pagos parciales, saldo y cálculo automático de impuestos.
- Checklists de recepción y calidad, y almacenamiento privado de fotografías/documentos.
- Historial de órdenes asociado a cada vehículo.

## Seguridad
El backend aplica RLS por taller y permisos por rol. Los cambios de stock se ejecutan mediante la función transaccional `registrar_movimiento_stock`, no mediante actualizaciones directas a la tabla de existencias.


## Funciones implementadas en Fase 3
- Emisión de presupuestos imprimibles en formato A4; desde el diálogo de impresión del navegador se pueden guardar como PDF.
- Enlaces individuales de autorización para clientes, con vigencia de 7 días y revocación automática del enlace anterior al emitir uno nuevo.
- Portal público de revisión y aceptación/rechazo, con nombre, RUT/documento, consentimiento y fecha de respuesta.
- La aprobación actualiza el estado de la OT cuando corresponde y ambas acciones quedan registradas en Auditoría.
- Los tokens se generan aleatoriamente y solo se almacena su hash. La tabla de aprobaciones tiene RLS y no concede acceso directo a anon ni authenticated; la Edge Function valida la sesión y los permisos del taller al emitir enlaces.
- Versión actual: **0.5.0**.
