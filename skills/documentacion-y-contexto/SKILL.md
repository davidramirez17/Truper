---
name: documentacion-y-contexto
description: Usa esta skill al cambiar AGENTS/CLAUDE/Copilot, skills, README, PLAN, bitácora, versionamiento, guías Jr o el grafo del proyecto.
---

# documentacion-y-contexto

## Principio

La documentación debe ayudar a encontrar el código y tomar decisiones; no debe inventar una arquitectura futura ni duplicar todo el repositorio.

## Archivos y responsabilidad

- `AGENTS.md`: contrato común de trabajo para agentes.
- `CLAUDE.md`: adaptador corto para Claude Code.
- `.github/copilot-instructions.md`: adaptador corto para Copilot.
- `docs/PLAN.md`: siguientes fases y decisiones abiertas.
- `docs/humano/01-MAPA-TECNICO.md`: rutas, módulos, datos, permisos y conexiones.
- `docs/humano/02-GUIA-NO-TECNICA.md`: explicación para opinar sin jerga.
- `docs/MAPA.md` y `docs/graph.json`: derivados de `pnpm graph`.
- `docs/bitacora.md`: append-only, entrada nueva arriba.
- `versionamiento.md`: cambios de proceso, arquitectura, tooling o documentación base.

## Grafo

`pnpm graph` analiza imports locales de `src/`. Si se mueve un módulo, una ruta o un contrato, regenera el grafo y comprueba que la documentación no apunte a nombres obsoletos.

## Cierre documental

1. Distingue hecho verificado, decisión y pendiente.
2. Elimina nombres, rutas y comandos de otro proyecto.
3. No copies código grande: explica propósito y ruta.
4. No borres historia de bitácora salvo que el propietario pida reiniciarla; si la plantilla era de otro proyecto, deja constancia del reinicio.
5. Verifica enlaces relativos y comandos desde la raíz de `app/`.

## Definición de terminado

- [ ] Un Jr puede localizar la pantalla, el dato y el permiso.
- [ ] Un agente puede saber qué leer al iniciar y qué actualizar al terminar.
- [ ] El grafo y los enlaces pasan una revisión rápida.
- [ ] La bitácora registra estado, decisión, supuestos y siguiente paso.
