---
description: Ejecuta el cierre verificable de una tarea de Truper Workspace.
---

# Cerrar tarea

1. Revisa el diff y confirma que solo contiene la intención solicitada.
2. Ejecuta `pnpm graph` si cambió estructura o imports.
3. Ejecuta `pnpm typecheck`, `pnpm lint` y `pnpm test`; añade `pnpm build` si aplica.
4. Actualiza `docs/PLAN.md`, las guías de `docs/humano/` y `versionamiento.md` solo si el impacto lo requiere.
5. Agrega una entrada nueva arriba de `docs/bitacora.md` con estado, hecho, decisión, archivos, supuestos, siguiente paso y pendientes humanos.
6. Reporta hechos verificados, validaciones ejecutadas y riesgos. No declares éxito si un gate falló.
