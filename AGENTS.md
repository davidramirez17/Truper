# AGENTS.md — Truper Workspace

Reglas compartidas para Codex, Claude Code, GitHub Copilot y cualquier otro agente que trabaje en este repositorio.

## 1. Alcance y precedencia

- Este repositorio es una plataforma interna para cargar archivos Excel/CSV, normalizarlos y consultar indicadores de ventas por proyecto.
- La evidencia principal es el código y la migración en `src/` y `supabase/migrations/`. La documentación explica el código; no lo sustituye.
- En conflicto gana, en este orden: seguridad y permisos de la base → contrato Zod/RPC → código existente → documentación → preferencia del agente.
- No inventar rutas, tablas, columnas, roles ni comportamiento. Marcar inferencias como `[Probable]` y vacíos como `[Bloqueado]`.

## 2. Stack real

- Next.js 15 App Router, React 19 y TypeScript estricto.
- Supabase Auth + `@supabase/ssr`, PostgreSQL, RLS y RPCs en `supabase/migrations/`.
- Tailwind solo como apoyo; la UI existente usa tokens y CSS en `src/app/globals.css` y `src/app/platform.css`.
- Zod valida contratos de acciones; SheetJS lee `.xlsx/.csv` dentro del worker de carga.
- Pruebas: `node:test`, `tsx` y PGlite para probar la migración y sus permisos.
- Gestor: `pnpm` (los scripts también funcionan con `npm` si es necesario).

## 3. Inicio de cada tarea

1. Lee las tres entradas superiores de `docs/bitacora.md` y `docs/PLAN.md`.
2. Ejecuta `pnpm graph` si `docs/MAPA.md` o `docs/graph.json` faltan, o después de un cambio estructural. El grafo se genera localmente desde los imports de `src/`.
3. Usa `rg` para localizar símbolos y abre solo los archivos conectados. No vuelques archivos grandes, `.xlsx`, `.csv`, `.json` de datos ni logs completos al contexto.
4. Antes de tocar código identifica: entrada, datos que consume, salida, permisos, contrato, pruebas afectadas y forma de reversión.
5. Trabaja en una rama de cambio; no reescribas historia ni uses `--force`.

## 4. Arquitectura que debe conservarse

```text
src/app (rutas y handlers)
  → src/modules/auth (sesión y roles)
  → src/modules/analytics (lectura y cálculos)
  → src/modules/sources (archivo, worker y validación)
  → src/modules/platform (contratos, acciones y mutaciones)
  → Supabase RPC/RLS en supabase/migrations
  → src/modules/workspace y src/components (presentación)
```

- `src/app/[[...slug]]/page.tsx` es la entrada principal del workspace autenticado.
- `src/modules/analytics/service.ts` es la lectura server-only del workspace.
- `src/modules/platform/actions.ts` es la frontera de mutaciones server-only.
- `src/modules/platform/contracts.ts` es el contrato de entrada y no se salta.
- Los importes internos son centavos enteros (`amountCents`/`amount_cents`); se muestran como MXN.
- La base conserva cargas anteriores y solo una carga activa por proyecto.
- Nunca se hace `INSERT` anónimo directo: la sesión, Zod, RPC y RLS deben coincidir.

## 5. Cambios sensibles

Detente y registra el impacto antes de:

- instalar otra dependencia o cambiar versiones;
- modificar `src/modules/platform/contracts.ts`, tipos públicos o el formato Excel;
- cambiar una migración, RPC, RLS, roles, permisos o datos reales;
- borrar/renombrar archivos o limpiar artefactos que no creó la tarea;
- cambiar tokens globales, autenticación o variables de entorno.

La instalación global de `rtk` y `codeburn` fue autorizada y documentada en `docs/PLAN.md`; futuras herramientas requieren justificar beneficio, alcance y reversión.

## 6. Validación proporcional

Ejecuta, como mínimo:

```powershell
pnpm graph
pnpm typecheck
pnpm lint
pnpm test
```

Añade `pnpm build` si cambias rutas, server actions, configuración, dependencias o renderizado. Si algo falla, corrígelo o reporta el bloqueo exacto; nunca declares éxito con el gate en rojo.

## 7. Cierre obligatorio

- Actualiza `docs/PLAN.md` solo si cambia el siguiente paso o el estado de una fase.
- Actualiza `docs/humano/01-MAPA-TECNICO.md` si cambia arquitectura, rutas, contratos, datos o flujo.
- Actualiza `docs/humano/02-GUIA-NO-TECNICA.md` si cambia el comportamiento que puede observar una persona usuaria.
- Si cambian imports, ejecuta `pnpm graph` y revisa `docs/MAPA.md`.
- Agrega arriba de `docs/bitacora.md` una entrada breve: fecha, estado, hecho, decisión, archivos, supuestos, siguiente paso y pendientes.
- Actualiza `versionamiento.md` solo para cambios de proceso, arquitectura, dependencias o documentación base; no por cada ajuste visual menor.
- Limpia temporales, `.bak`, logs locales y salidas generadas que no deban versionarse. No borres datos de usuario.
- El reporte final debe separar hechos verificados, validaciones ejecutadas y pendientes.

## 8. Skills del proyecto

Carga solo la skill que corresponda:

| Skill | Úsala cuando |
|---|---|
| `truper-frontend` | cambies rutas, componentes, estados, responsive, accesibilidad o estilos |
| `truper-data` | cambies Excel, contratos, Supabase, RPC, RLS, migraciones o permisos |
| `depuracion-de-codigo` | exista un fallo reproducible o una regresión que investigar |
| `documentacion-y-contexto` | actualices el grafo, las guías, la bitácora o el flujo entre agentes |

No cargues una skill por su nombre si el problema no pertenece a su dominio.

## 9. Herramientas de contexto

- `rtk` comprime salidas de terminal; úsalo para comandos ruidosos y consulta `rtk gain` ocasionalmente.
- `codeburn status` mide consumo de sesiones localmente; no lo uses como fuente de verdad funcional.
- El grafo del proyecto es `pnpm graph`; no asumir que una herramienta externa conoce el repositorio.
- No activar hooks globales que modifiquen otros proyectos sin documentar qué archivos/configuración cambian.

## 10. Estilo de colaboración

Comunica en español claro y compacto. Para alguien Jr explica el porqué junto al qué. No pegues archivos completos ni código que ya quedó guardado: entrega diff resumido, validación y riesgos.

@RTK.md
