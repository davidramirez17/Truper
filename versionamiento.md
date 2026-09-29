# Versionamiento — Truper Workspace

Este archivo registra cambios importantes del proyecto y de su forma de trabajo. No es un historial de cada ajuste visual.

## Versión de aplicación

- La versión declarada actualmente es `0.1.0` en `package.json`.
- Mientras el producto se estabiliza, los cambios se integran con Conventional Commits y se agrupan en releases pequeños.
- `main` debe representar una versión ejecutable; no se publican cambios con el gate en rojo.

## Tipos de cambio

| Prefijo | Uso |
|---|---|
| `feat` | capacidad visible nueva |
| `fix` | corrección de comportamiento |
| `docs` | documentación, guías o mapa |
| `test` | pruebas sin cambio funcional |
| `chore` | tooling, dependencias o mantenimiento |
| `refactor` | reorganización sin cambio de comportamiento |

## Reglas

- No cambiar el contrato de Excel, Zod, RPC, RLS o una migración sin registrar impacto y pruebas.
- No borrar cargas históricas para corregir una vista; la corrección debe conservar trazabilidad.
- No actualizar una dependencia global del proyecto sin verificar compatibilidad con Node, Next y el lockfile.
- No versionar `.env*` reales, logs, `.next`, reportes temporales ni datos de usuarios.
- Los documentos derivados `docs/graph.json` y `docs/MAPA.md` se regeneran con `pnpm graph` y se revisan junto con cambios estructurales.

## Historial

### 2026-09-28 — Rebase documental y toolbelt del proyecto

- Se reemplazó el marco heredado de VM, scraping, Oracle, ZelogiG y backend Python por reglas específicas de Next.js, Supabase, Excel y workspace.
- Se añadieron `AGENTS.md`, adaptadores de Claude/Copilot, `docs/PLAN.md`, el grafo reproducible y las dos guías para Jr.
- Se instalaron RTK para comprimir terminal y CodeBurn para medir consumo de sesiones; RTK quedó integrado por proyecto para Claude, Codex y Copilot.
- Decisión: Context Mode y Tokensave quedan como evaluación futura porque introducen MCP/hooks globales y no son necesarios para el flujo actual.

### 2026-09-28 — Base funcional documentada

- La aplicación mantiene la versión `0.1.0`.
- La fuente de ventas actual es Excel/CSV; los indicadores se calculan desde la carga activa de cada proyecto.
- La seguridad combina sesión, contratos Zod, RPC y RLS; ocultar una acción en la UI no se considera autorización.
