# CLAUDE.md — Adaptador para Claude Code

Este proyecto usa `AGENTS.md` como contrato común. Léelo antes de trabajar y respétalo junto con la skill del proyecto que corresponda.

Inicio: lee `docs/bitacora.md` (3 entradas), `docs/PLAN.md` y `docs/MAPA.md`; si el mapa falta o el cambio es estructural, ejecuta `pnpm graph`.

Durante el trabajo: usa `rg`, sigue la ruta real de dependencias, conserva la frontera server/client, Zod, RPC y RLS, y no inventes contratos.

Cierre: ejecuta `pnpm graph` cuando aplique, `pnpm typecheck`, `pnpm lint`, `pnpm test` y `pnpm build` si el cambio lo requiere; actualiza la bitácora y las guías Jr según el impacto. Reporta hechos, validaciones y pendientes por separado.

<!-- rtk-instructions v2 -->
# Command output

Command output here is condensed to save tokens, keeping every signal and
dropping costly noise. Treat it as the complete result: run commands
normally, and batch related commands into one call to avoid extra turns.
Truncated results state their recovery path in their own output. Re-run a
command as `rtk proxy <cmd>` only when its result is unusable: empty when
output was clearly expected, contradicting its exit code, or garbled.
<!-- /rtk-instructions -->