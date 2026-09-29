# Guía de trabajo para agentes y personas

`AGENTS.md` es la regla principal. Esta página indica dónde mirar y qué actualizar sin leer todo el repositorio.

## 1. Antes de una tarea

1. Lee las tres entradas superiores de `docs/bitacora.md`.
2. Lee `docs/PLAN.md`.
3. Ejecuta `pnpm graph` si el grafo falta o el cambio toca imports, rutas, módulos, contratos o migraciones.
4. Usa `rg -n "símbolo|tabla|ruta" src supabase tests` para ubicar el código real.

## 2. Skill correcta

| Tarea | Skill |
|---|---|
| Pantallas, componentes, estilos, responsive o accesibilidad | `truper-frontend` |
| Excel, indicadores, Supabase, RPC, RLS, migraciones o roles | `truper-data` |
| Fallo reproducible o regresión | `depuracion-de-codigo` |
| Documentación, grafo, bitácora o reglas para agentes | `documentacion-y-contexto` |

Carga solo lo que aplique. La documentación del proyecto tiene prioridad sobre una regla genérica de una skill.

## 3. Flujo de una tarea

```text
contexto → impacto → cambio mínimo → prueba → documentación → cierre
```

- **Contexto:** identifica entrada, salida, consumidores, permisos y contrato.
- **Impacto:** revisa UI, acciones, RPC/RLS, datos históricos y pruebas.
- **Cambio:** no refactorices código ajeno ni mezcles limpieza estética.
- **Prueba:** ejecuta el gate proporcional y reporta el resultado real.
- **Documentación:** actualiza solo los documentos afectados.

## 4. Gate estándar

```powershell
pnpm graph
pnpm typecheck
pnpm lint
pnpm test
```

Añade `pnpm build` al tocar rutas, server actions, configuración, dependencias o renderizado.

## 5. Qué actualizar al terminar

| Si cambió… | Actualiza… |
|---|---|
| siguiente paso o fase | `docs/PLAN.md` |
| rutas, módulos, contratos, datos o flujo | `docs/humano/01-MAPA-TECNICO.md` |
| comportamiento visible para usuarios | `docs/humano/02-GUIA-NO-TECNICA.md` |
| imports | `docs/MAPA.md` y `docs/graph.json` vía `pnpm graph` |
| proceso de agentes o dependencias | `AGENTS.md`, `CLAUDE.md`, `.github/copilot-instructions.md` y `versionamiento.md` |
| cualquier tarea cerrada | entrada nueva arriba de `docs/bitacora.md` |

## 6. Formato de reporte

```text
ESTADO: COMPLETADO | COMPLETADO CON RIESGO | PARCIAL | BLOQUEADO

Hecho:
Validación ejecutada:
Pendiente:
Riesgo o supuesto:
Archivos principales:
```

No reportes una validación que solo recomendaste. No pegues archivos completos ni logs ruidosos.
