# Truper Workspace — mapa técnico para una persona Jr

**Estado:** descripción del código verificado el 2026-09-29. Si el código cambia, este documento debe actualizarse junto con `docs/MAPA.md` cuando cambien conexiones o contratos.

## 1. Qué archivo es el principal

El punto de entrada del workspace es:

```text
src/app/[[...slug]]/page.tsx
```

Es una ruta dinámica de Next.js. Recibe la URL, decide qué vista se solicita, pide los datos al servidor y entrega todo a `src/modules/workspace/Workspace.tsx`.

`Workspace.tsx` es el coordinador de la interfaz: arma la navegación, filtros, búsqueda, diálogos, permisos visibles, exportación y selecciona la vista concreta. No es el lugar donde deben vivir las consultas SQL ni las reglas completas de importación.

La lectura principal ocurre en `src/modules/analytics/service.ts`. Las mutaciones principales ocurren en `src/modules/platform/actions.ts`. Los contratos que validan entradas antes de tocar la base están en `src/modules/platform/contracts.ts`.

La verdad de tablas, RPC, RLS y restricciones está en `supabase/migrations/202609230001_truper_workspace.sql`; la salud de la base en `202609290001_truper_system_health.sql`; y el directorio, fotos y organización en `202609290002_truper_people_and_permissions.sql`.

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
| `/fuentes` | `sources` | única entrada para actualizar datos y revisar el historial |
| `/reportes` | `reports` | KPIs, movimientos y exportación CSV |
| `/alertas` | `alerts` | pendientes derivados de los datos disponibles |
| `/cargas` | `history` | historial de archivos importados |
| `/actividad` | `activity` | auditoría de operaciones |
| `/configuracion` | `settings` | tema y configuración visible |
| `/usuarios` | `users` | directorio, fotos, organigrama y accesos; solo superusuario |
| `/sistema` | `system` | espacio, estadísticas y recomendaciones; solo superusuario |
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
- `selectors.ts`: filtros de 7/14/30 días, comparación con periodo anterior, métricas, moneda MXN y CSV. La tendencia agrupa por fecha en una sola pasada para no volver a recorrer todos los movimientos por cada día.
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

- `contracts.ts`: Zod para crear proyecto, importar ventas, administrar usuarios, asignar miembros y actualizar perfiles.
- `actions.ts`: Server Actions que vuelven a exigir sesión, validan rol/entrada, llaman RPC y revalidan el layout.
- `health.ts`: lectura server-only del RPC de observabilidad; mide el tiempo de la consulta y normaliza estadísticas de PostgreSQL.
- `PlatformViews.tsx`: directorio de usuarios, organigrama, matriz de permisos, foto de perfil, cargas, actividad y diseño.
- `SystemHealthView.tsx`: pantalla visual de salud de Supabase, tamaño de tablas, rendimiento y recomendaciones no destructivas.
- `ProjectDialog.tsx`: formulario para crear un proyecto.

### `src/modules/workspace/`

- `navigation.ts`: nombres de vistas, URLs, iconos y textos de página.
- `views.tsx`: composición de dashboard, proyectos, fuentes, reportes, alertas, detalle y configuración.
- `Workspace.tsx`: coordinación de estado cliente y navegación.
- `Workspace.tsx` también coloca el botón común `Guardar PDF` en la barra superior y evita que las vistas generales abran cargas directamente.

### `src/components/`

Componentes compartidos. `MetricCard`, `Dialog`, `Brand`, `Avatar`, `PdfButton` y `MobileDock` están conectados al workspace. Los componentes visuales antiguos sin referencias fueron retirados para no conservar dos lenguajes de UI.

### `src/lib/`

- `supabase/config.ts`: lee variables públicas necesarias.
- `supabase/server.ts`: cliente server con cookies y `server-only`.
- `supabase/browser.ts`: cliente para operaciones de Auth en navegador.
- `alertService.ts`: envío administrativo por Nodemailer para `/api/alertas`.

## 5. Base de datos y seguridad

La migración crea tablas `truper_profiles`, `truper_projects`, `truper_project_members`, `truper_imports`, `truper_sales_rows` y `truper_audit`.

La migración `202609290001_truper_system_health.sql` agrega el RPC protegido `truper_get_system_health`. Solo un `superadmin` puede consultarlo. Devuelve el tamaño total de la base, tamaño de las seis tablas, índices, filas estimadas, tuplas vivas/muertas, lecturas secuenciales/por índice, caché, conexiones y transacciones agregadas. No devuelve filas de negocio ni ejecuta `VACUUM`.

La migración `202609290002_truper_people_and_permissions.sql` agrega `area`, `job_title`, `avatar_url` y `manager_id` a `truper_profiles`, además de los RPC `truper_update_user_profile` y `truper_update_my_profile`. También prepara el bucket `truper-avatars` para JPG/PNG/WebP de hasta 5 MB. El superusuario administra perfiles ajenos; una persona activa puede actualizar su propio nombre y foto. La base vuelve a comprobar el rol y evita que una persona se asigne a sí misma como responsable.

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
| ¿Dónde se actualizan los datos? | `src/modules/workspace/views.tsx` (`SourcesView`) y `src/modules/sources/UploadDialog.tsx`; no se agrega el selector de archivo en cada módulo |
| ¿Dónde se administra una persona? | `src/modules/platform/PlatformViews.tsx` (`UsersView`, `UserDialog`, `ProfileSettings`) |
| ¿Cómo se forma el organigrama? | `truper_profiles.manager_id` + `OrgChart` en `PlatformViews.tsx` |
| ¿Cómo se guarda una vista en PDF? | `src/components/ui/PdfButton.tsx` y `@media print` en `src/app/platform.css` |
| ¿Cómo reviso espacio y rendimiento? | `src/modules/platform/health.ts`, `SystemHealthView.tsx` y `202609290001_truper_system_health.sql` |
| ¿Qué prueba los permisos? | `tests/security.test.ts` |
| ¿Qué conecta los archivos? | `docs/MAPA.md` y `docs/graph.json` |

## 8. Decisiones y mejoras posibles

- Next.js concentra rutas y server actions para mantener sesión/servidor cerca del flujo.
- Supabase RPC + RLS evita que el navegador escriba directamente en tablas protegidas.
- Las cargas son versionadas: la anterior no se borra, pero solo una es activa.
- La actualización de datos tiene un solo punto de entrada: `/fuentes`; el resto de módulos enlaza hacia él para evitar cargas duplicadas y confusas.
- El directorio separa identidad (`truper_profiles`), rol general, permisos de proyecto y relación jerárquica (`manager_id`); ocultar una opción en la interfaz nunca sustituye a RLS/RPC.
- El PDF usa la impresión del navegador: no se guarda un archivo en el servidor y la persona decide dónde descargarlo.
- La lectura falla cerrada cuando no puede completar los movimientos; evita totales engañosos.
- Los mapas internos de `service.ts` y el agrupamiento por fecha de `selectors.ts` reducen recorridos repetidos cuando aumente el Excel.

Mejoras pendientes, no implementadas por esta documentación:

1. Agregaciones server-side para no cargar 50,000 filas en cada dashboard.
2. Contrato de módulo extensible: hoy la migración y los RPC solo aceptan `ventas`.
3. Pruebas de navegador con un Supabase de prueba.
4. Reglas reales para alertas, metas, duplicados y periodos de negocio.
5. Activar la migración de observabilidad en el proyecto Supabase real y configurar `SUPABASE_DATABASE_LIMIT_BYTES` para calcular el porcentaje del plan.
6. Añadir métricas de aplicación/APM y pruebas de carga; la vista actual mide la consulta de salud y estadísticas de PostgreSQL, no el tiempo completo de cada pantalla.
7. Confirmar en Supabase remoto la migración de personas, el bucket y sus políticas antes de usar fotos reales; la implementación local sí tiene fallback para perfiles antiguos, pero no puede crear el bucket remoto por sí sola.

## 9. Criterio para actualizar este mapa

Actualiza este archivo cuando cambie una ruta, una frontera entre módulos, un contrato, una tabla/RPC/RLS, el flujo de carga o la fuente de un indicador. Para un cambio de imports ejecuta también `pnpm graph`; para un cambio visible actualiza la guía no técnica.
