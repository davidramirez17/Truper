# Bitácora — Truper Workspace

Registro append-only del proyecto. La entrada más reciente va arriba. No reemplaza la evidencia de pruebas ni el `git diff`.

## 2026-09-28 — Plantilla reutilizable para nuevos proyectos

- **Estado:** 🟢 completo.
- **Hecho:** se agregó `docs/humano/00-BASE-ARRANQUE-IA-Y-HUMANO.md` con el resumen de esta sesión, piezas copiables, piezas que no deben copiarse, instalación de herramientas, prompt inicial y protocolo de trabajo/cierre para futuras IAs y personas.
- **Decisión:** la guía distingue qué es genérico y qué pertenece únicamente a Truper para evitar trasladar contratos, secretos o migraciones por accidente.
- **Siguiente paso:** al iniciar otro repositorio, copiar la base, cambiar el stack y regenerar su mapa antes de programar.

## 2026-09-28 — Limpieza estructural y comprobación de Supabase

- **Estado:** 🟢 limpieza completa; activación autenticada en seguimiento.
- **Hecho:** se movieron `PLAN.md`, `MAPA.md`, `graph.json`, `ARQUITECTURA_Y_DISENO.md` y `ACTIVACION_SUPABASE_VERCEL.md` a `docs/`; se conservaron las dos guías Jr en `docs/humano/`.
- **Limpieza:** se eliminaron `preview.html`, los dos respaldos `.bak` de `src/app/globals.css` y el artefacto local `audit-local.json`.
- **Supabase:** la API confirmó la existencia de las seis tablas de Truper y del RPC principal; el rol anónimo recibió bloqueo de permisos, como espera RLS. No se reejecutó SQL remoto sin historial administrativo.
- **Validación:** `pnpm graph`, `pnpm typecheck`, `pnpm lint`, `pnpm test` (17 pruebas) y `pnpm build` terminaron correctamente.
- **Siguiente paso:** entrar con una cuenta administrativa, confirmar el historial de la migración y ejecutar el smoke test autenticado.

## 2026-09-28 — Integración local de RTK por agente

- **Estado:** 🟢 completo.
- **Hecho:** se configuró RTK por proyecto para Claude, Codex y Copilot; se agregaron `RTK.md`, `.codex/hooks.json`, `.github/hooks/rtk-rewrite.json` y `.rtk/filters.toml`.
- **Decisión:** no activar hooks globales; cada repositorio decide su propio filtro y puede revertirlo con la configuración local.
- **Supuestos:** las sesiones nuevas deben reiniciarse para que Claude/Codex/Copilot reconozcan la integración.
- **Siguiente paso:** medir ahorro real con `rtk gain` y `codeburn status` después de varias tareas.

## 2026-09-28 — Base común para agentes, documentación Jr y toolbelt

- **Estado:** 🟢 completo con pendientes operativos.
- **Hecho:** se creó el contrato común `AGENTS.md`, adaptadores para Claude/Copilot, dos guías en `docs/humano/`, `docs/PLAN.md` y el grafo reproducible `pnpm graph`.
- **Decisiones:** conservar Next.js/Supabase/RPC/RLS/Excel como arquitectura real; retirar reglas heredadas de VM, scraping, Oracle, MCP, Python y ZelogiG.
- **Toolbelt:** RTK `0.50.0` y CodeBurn `0.9.25` instalados y verificados en Windows; no se activaron hooks globales adicionales.
- **Archivos tocados:** reglas, README, guía, plan, versionamiento, skills, documentación y script de grafo.
- **Supuestos:** el repositorio operativo es `app/`; la activación contra Supabase real y un Excel real siguen pendientes de evidencia.
- **Siguiente paso:** aplicar/verificar migración real y ejecutar smoke test con un archivo operativo no sensible.
- **Pendientes humanos:** confirmar proyecto Supabase, primer superusuario, archivo de prueba y ownership Git de la carpeta `app`.

## Plantilla

## AAAA-MM-DD — título

- **Estado:** 🟢 completo · 🟡 en seguimiento · 🔴 bloqueado.
- **Hecho:** …
- **Decisiones:** …
- **Archivos tocados:** …
- **Supuestos:** …
- **Siguiente paso:** …
- **Pendientes humanos:** …
