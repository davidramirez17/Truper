# Instrucciones para GitHub Copilot

Lee `AGENTS.md` como contrato principal del repositorio antes de sugerir o modificar código.

Este es un proyecto Next.js 15 + React 19 + TypeScript + Supabase. No lo conviertas en Vite, Python o una API REST genérica. Conserva:

- rutas en `src/app/` y módulos por responsabilidad en `src/modules/`;
- `src/modules/platform/contracts.ts` con Zod antes de acciones server;
- Supabase RPC, RLS, roles y migraciones como frontera de seguridad;
- importes internos en centavos enteros y cargas idempotentes;
- estados de carga, vacío, error y responsive accesible.

Antes de cerrar cambios ejecuta `pnpm graph`, `pnpm typecheck`, `pnpm lint` y `pnpm test`; añade `pnpm build` si cambian rutas o configuración. Actualiza `docs/bitacora.md` y la documentación de `docs/humano/` cuando cambie el comportamiento o la arquitectura.

<!-- rtk-instructions v2 -->
# RTK — Token-Optimized CLI

**rtk** is a CLI proxy that filters and compresses command outputs, saving 60-90% tokens.

## Rule

Always prefix shell commands with `rtk`:

```bash
# Instead of:              Use:
git status                 rtk git status
git log -10                rtk git log -10
cargo test                 rtk cargo test
docker ps                  rtk docker ps
kubectl get pods           rtk kubectl get pods
```

## Meta commands (use directly)

```bash
rtk gain              # Token savings dashboard
rtk gain --history    # Per-command savings history
rtk discover          # Find missed rtk opportunities
rtk proxy <cmd>       # Run raw (no filtering) but track usage
```
<!-- /rtk-instructions -->