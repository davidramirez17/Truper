# Truper Workspace — mapa técnico para una persona Jr

**Estado:** descripción del código verificado el 2026-09-28. Si el código cambia, este documento debe actualizarse junto con `docs/MAPA.md` cuando cambien conexiones o contratos.

## 1. Qué archivo es el principal

El punto de entrada del workspace es:

```text
src/app/[[...slug]]/page.tsx
```

Es una ruta dinámica de Next.js. Recibe la URL, decide qué vista se solicita, pide los datos al servidor y entrega todo a `src/modules/workspace/Workspace.tsx`.

`Workspace.tsx` es el coordinador de la interfaz: arma la navegación, filtros, búsqueda, diálogos, permisos visibles, exportación y selecciona la vista concreta. No es el lugar donde deben vivir las consultas SQL ni las reglas completas de importación.

La lectura principal ocurre en `src/modules/analytics/service.ts`. Las mutaciones principales ocurren en `src/modules/platform/actions.ts`. Los contratos que validan entradas antes de tocar la base están en `src/modules/platform/contracts.ts`.

La verdad de tablas, RPC, RLS y restricciones está en `supabase/migrations/202609230001_truper_workspace.sql`.

## 2. Recorrido completo de una pantalla

```text
URL
  → src/app/[[...slug]]/page.tsx
  → getWorkspaceData()
  → requireSession()
  → Supabase Auth + truper_profiles
  → consultas RLS a proyectos/cargas/movimientos/auditoría
  → Workspace.tsx
  → views.tsx + componentes reutilizables
```

1. Next.js recibe `/`, `/proyectos`, `/reportes` u otra ruta del workspace.
2. `page.tsx` traduce el segmento a un `WorkspaceView`. Si la vista no existe, responde 404.
3. `getWorkspaceData()` exige una sesión activa y lee datos con el cliente server de Supabase.
4. Supabase aplica RLS: el frontend no decide por sí solo qué filas puede ver una persona.
5. `Workspace.tsx` calcula filtros de periodo/proyecto con `selectAnalytics()` y muestra la vista correspondiente.
6. Un error de conexión se conserva como estado legible; no se muestran totales parciales de movimientos.

## 3. Rutas y archivo responsable

Todas las rutas de negocio pasan por `src/app/[[...slug]]/page.tsx`.

| URL | Vista | Qué muestra |
|---|---|---|
| `/` | `overview` | panorama, KPIs, tendencia y proyectos |
| `/proyectos` | `projects` | listado y creación de proyectos |
| `/proyectos/:id` | `detail` | detalle e indicadores de un proyecto |
| `/fuentes` | `sources` | origen de datos y acción de carga |
| `/reportes` | `reports` | KPIs, movimientos y exportación CSV |
| `/alertas` | `alerts` | pendientes derivados de los datos disponibles |
| `/cargas` | `history` | historial de archivos importados |
| `/actividad` | `activity` | auditoría de operaciones |
| `/configuracion` | `settings` | tema y configuración visible |
| `/usuarios` | `users` | usuarios y accesos; solo superusuario |
| `/diseno` | `design` | catálogo interno del sistema visual |

Autenticación:

| Ruta | Archivo | Responsabilidad |
|---|---|---|
| `/login` | `src/app/login/page.tsx` | iniciar sesión |
| `/registro` | `src/app/registro/page.tsx` | solicitar registro |
| `/recuperar` | `src/app/recuperar/page.tsx` | solicitar recuperación |
| `/actualizar-clave` | `src/app/actualizar-clave/page.tsx` | cambiar contraseña tras enlace |
| `/acceso` | `src/app/acceso/page.tsx` | explicar cuenta pendiente, suspendida o sin configuración |
| `/auth/callback` | `src/app/auth/callback/route.ts` | intercambiar código de Supabase por sesión |
| `/auth/signout` | `src/app/auth/signout/route.ts` | cerrar sesión |

El endpoint `/api/alertas` usa `src/lib/alertService.ts` y está separado del workspace principal. Requiere revisar su token antes de usarlo en producción.

## 4. Carpetas y conexiones

### `src/app/`

Rutas, estados globales de carga/error/404, layout y handlers HTTP. No debe contener lógica de negocio grande.

### `src/modules/auth/`

- `types.ts`: roles `superadmin`, `admin`, `analyst`, `viewer` y estados de perfil.
- `session.ts`: obtiene el usuario y el perfil desde Supabase; `requireSession()` redirige si no hay sesión activa.
- `AuthShell.tsx` y `AuthForm.tsx`: interfaz y operaciones de login, registro y recuperación.

### `src/modules/analytics/`

- `types.ts`: contratos internos de proyectos, movimientos, cargas, usuarios y `WorkspaceData`.
- `service.ts`: agrega datos del servidor. Lee hasta 50,000 movimientos de los lotes activos.
- `selectors.ts`: filtros de 7/14/30 días, comparación con periodo anterior, métricas, moneda MXN y CSV.
- `SalesChart.tsx`: visualización de la tendencia y alternativa legible para datos.

### `src/modules/sources/`

- `UploadDialog.tsx`: flujo cliente de archivo → hoja → mapeo → confirmación → guardado.
- `validation.worker.ts`: usa SheetJS fuera del hilo principal para leer `.xlsx/.csv`.
- `validation.ts`: reconoce alias de columnas y valida cliente, fecha, zona e importe.

Flujo de carga:

```text
archivo
  → worker SheetJS
  → inferMapping()/validateRows()
  → vista previa
  → importSales()
  → importSchema.safeParse()
  → RPC truper_import_sales
  → lote nuevo + filas + lote activo + auditoría
```

La interfaz no guarda el archivo original. Convierte cada importe a centavos y manda registros normalizados. La carga debe ser confirmada explícitamente y usa un `requestId` para que un reintento no duplique la operación.

### `src/modules/platform/`

- `contracts.ts`: Zod para crear proyecto, importar ventas, administrar usuarios y asignar miembros.
- `actions.ts`: Server Actions que vuelven a exigir sesión, validan rol/entrada, llaman RPC y revalidan el layout.
- `PlatformViews.tsx`: vistas de usuarios, cargas, actividad y diseño.
- `ProjectDialog.tsx`: formulario para crear un proyecto.

### `src/modules/workspace/`

- `navigation.ts`: nombres de vistas, URLs, iconos y textos de página.
- `views.tsx`: composición de dashboard, proyectos, fuentes, reportes, alertas, detalle y configuración.
- `Workspace.tsx`: coordinación de estado cliente y navegación.

### `src/components/`

Componentes compartidos. `MetricCard`, `Dialog`, `Brand` y `MobileDock` están conectados al workspace; `KpiCard`, `GraficoVentas`, `Navbar` y `ModuloError` deben considerarse piezas antiguas o auxiliares hasta demostrar una conexión real.

### `src/lib/`

- `supabase/config.ts`: lee variables públicas necesarias.
- `supabase/server.ts`: cliente server con cookies y `server-only`.
- `supabase/browser.ts`: cliente para operaciones de Auth en navegador.
- `excelReader.ts`: lector auxiliar local; no es el camino usado por la carga actual del workspace.
- `alertService.ts`: envío administrativo por Nodemailer para `/api/alertas`.

## 5. Base de datos y seguridad

La migración crea tablas `truper_profiles`, `truper_projects`, `truper_project_members`, `truper_imports`, `truper_sales_rows` y `truper_audit`.

Las funciones públicas que consume la aplicación son `truper_create_project`, `truper_import_sales`, `truper_manage_user` y `truper_assign_member`. La importación valida, inserta el lote, conserva el anterior, activa el nuevo y registra auditoría.

La seguridad tiene dos capas:

1. La interfaz oculta acciones que no corresponden al rol.
2. La base vuelve a validar mediante RPC, permisos SQL y RLS.

La primera capa mejora UX; la segunda es la autoridad. Nunca confiar solo en botones ocultos.

## 6. Reglas de los indicadores

`moduleRegistry` registra el módulo `ventas` y define ventas del periodo, movimientos, clientes distintos e importe promedio. `selectAnalytics()` compara periodos de igual duración y agrupa por zona. `money()` recibe centavos y los presenta como MXN; no cambiar el contrato a números flotantes sin una decisión de datos.

## 7. Cómo encontrar una cosa

Desde la raíz de `app/`:

```powershell
rg -n "nombreDeFuncion|nombreDeTabla|texto visible" src supabase tests
pnpm graph
```

| Pregunta | Empieza en |
|---|---|
| ¿Qué URL muestra esto? | `src/app/[[...slug]]/page.tsx` y `src/modules/workspace/navigation.ts` |
| ¿De dónde salen los números? | `src/modules/analytics/service.ts` y `selectors.ts` |
| ¿Quién puede hacerlo? | `src/modules/auth/types.ts`, `session.ts`, `actions.ts`, migración |
| ¿Cómo se valida Excel? | `src/modules/sources/UploadDialog.tsx`, `validation.ts`, `validation.worker.ts` |
| ¿Qué cambia en la base? | `src/modules/platform/actions.ts` y la migración |
| ¿Qué prueba los permisos? | `tests/security.test.ts` |
| ¿Qué conecta los archivos? | `docs/MAPA.md` y `docs/graph.json` |

## 8. Decisiones y mejoras posibles

- Next.js concentra rutas y server actions para mantener sesión/servidor cerca del flujo.
- Supabase RPC + RLS evita que el navegador escriba directamente en tablas protegidas.
- Las cargas son versionadas: la anterior no se borra, pero solo una es activa.
- La lectura falla cerrada cuando no puede completar los movimientos; evita totales engañosos.

Mejoras pendientes, no implementadas por esta documentación:

1. Agregaciones server-side para no cargar 50,000 filas en cada dashboard.
2. Contrato de módulo extensible: hoy la migración y los RPC solo aceptan `ventas`.
3. Pruebas de navegador con un Supabase de prueba.
4. Revisión de piezas antiguas (`excelReader.ts` y componentes no conectados) antes de borrarlas.
5. Reglas reales para alertas, metas, duplicados y periodos de negocio.

## 9. Criterio para actualizar este mapa

Actualiza este archivo cuando cambie una ruta, una frontera entre módulos, un contrato, una tabla/RPC/RLS, el flujo de carga o la fuente de un indicador. Para un cambio de imports ejecuta también `pnpm graph`; para un cambio visible actualiza la guía no técnica.
