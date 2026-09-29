# Bitácora — Truper Workspace

Registro append-only del proyecto. La entrada más reciente va arriba. No reemplaza la evidencia de pruebas ni el `git diff`.

## 2026-09-29 — Cierre del avance y publicación

- **Estado:** 🟢 avance cerrado y enviado a `origin/main`.
- **Hecho:** quedaron documentados el directorio/organigrama, roles y permisos, fotos, perfil propio, carga central en `/fuentes`, PDF, corrección de hidratación, salud del sistema, CodeGraph y limpieza estructural.
- **Validación final:** `pnpm graph` (46 nodos/80 conexiones), CodeGraph sincronizado (88 archivos), `pnpm typecheck`, `pnpm lint`, `pnpm test` (20/20) y `pnpm build` pasan; `git diff --check` pasa.
- **Commit:** se publicará con el cambio completo de esta sesión en la rama `main`.
- **Pendiente externo:** aplicar y confirmar en Supabase remoto `202609290001_truper_system_health.sql` y `202609290002_truper_people_and_permissions.sql`, incluido el bucket `truper-avatars`; también falta el smoke test con el Excel real.

## 2026-09-29 — Directorio, perfiles, permisos y carga centralizada

- **Estado:** 🟡 implementado localmente; migración remota pendiente.
- **Hecho:** se reemplazó la vista compacta de usuarios por directorio con búsqueda/filtros, foto, área, puesto, responsable directo, organigrama y matriz de permisos. El superusuario administra roles/estado/perfil; cada usuario puede editar su propio nombre y foto.
- **Datos:** se agregó `supabase/migrations/202609290002_truper_people_and_permissions.sql` con columnas organizacionales, RPCs de perfil y bucket `truper-avatars` con políticas para superusuario y foto propia.
- **UX:** `/fuentes` queda como único módulo para actualizar Excel/CSV; dashboard, proyectos y detalle enlazan ahí. `PdfButton` permite guardar la vista actual mediante impresión y el CSS elimina menús/controles al imprimir.
- **Hidratación:** el tema usa un valor estable durante SSR y cambia después del montaje; corrige el error pegado de `next-themes` sin ocultar el problema con `suppressHydrationWarning`.
- **Validación:** typecheck, lint, build y 20 pruebas pasan; el directorio, organigrama, perfil y Fuentes se revisaron en el harness visual aislado. Falta verificación con Supabase real.
- **Pendiente humano:** aplicar la migración nueva en Supabase remoto y probar fotos con cuenta superusuario y usuario normal. El bucket no debe darse por creado solo por existir en el código.

## 2026-09-29 — Limpieza de piezas heredadas

- **Estado:** 🟢 completo en el árbol local.
- **Hecho:** se retiraron `GraficoVentas.tsx`, `KpiCard.tsx`, `Navbar.tsx`, `ModuloError.tsx` y `src/lib/excelReader.ts`; no tenían imports desde rutas, módulos ni pruebas.
- **Decisión:** se conserva `/api/alertas` y `alertService.ts` porque sí existe una ruta activa y podría tener consumidores externos, aunque no forme parte del flujo principal del workspace.
- **Validación:** grafo regenerado a 46 nodos/80 conexiones; typecheck, lint, 20 pruebas y build pasan después de la limpieza.

## 2026-09-29 — Cálculos preparados para el primer Excel grande

- **Hecho:** `selectors.ts` ahora agrupa la tendencia por fecha en una sola pasada; `service.ts` usa mapas para proyectos, miembros, propietarios y última fecha.
- **Motivo:** evitar recorridos repetidos de todos los movimientos cuando llegue el Excel real, sin cambiar los resultados ni la fuente de verdad.
- **Validación:** typecheck, lint, 18 pruebas y build de producción pasan.

## 2026-09-29 — Observabilidad para superusuario y salud de Supabase

- **Estado:** 🟡 implementado localmente; activación remota pendiente.
- **Hecho:** se agregó `/sistema`, visible únicamente para `superadmin`, con tamaño de base, tamaños por tabla, índices, filas estimadas, tuplas muertas, lecturas, caché, conexiones, transacciones y latencia del RPC.
- **Base:** se creó `supabase/migrations/202609290001_truper_system_health.sql` con un RPC `security definer` que devuelve estadísticas agregadas y rechaza roles que no sean superusuario.
- **Seguridad:** la pantalla no borra datos ni ejecuta `VACUUM`; solo muestra recomendaciones y permite copiar un checklist para revisarlo en Supabase SQL Editor.
- **Validación:** migración probada de forma aislada con PGlite; typecheck, lint, 18 pruebas y build de producción pasan. `pnpm graph` quedó en 49 nodos/73 conexiones y CodeGraph en 91 archivos.
- **Pendiente humano:** aplicar la nueva migración en Supabase remoto y, si se conoce el límite del plan, configurar `SUPABASE_DATABASE_LIMIT_BYTES`.

## 2026-09-28 — Instalación e integración de CodeGraph

- **Estado:** 🟢 completo en la máquina y documentado en el proyecto.
- **Hecho:** se instaló `@lzehrung/codegraph` `2.3.31`, el motor nativo de Windows quedó disponible, se inicializó el índice local de 85 archivos y se verificó una consulta de exploración con relaciones entre módulos y pruebas.
- **Integración:** CodeGraph quedó configurado para Codex, Claude y el skill genérico de agentes; `.codegraph/` se agregó a `.gitignore`.
- **Decisión:** conservar también `pnpm graph`: `docs/graph.json` y `docs/MAPA.md` son el grafo pequeño y reproducible del repositorio; CodeGraph es el índice semántico local para explorar contexto e impacto.
- **Siguiente paso:** reiniciar los agentes para que carguen la configuración y ejecutar `codegraph sync --root .` después de cambios estructurales.

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
