---
name: truper-data
description: Usa esta skill al cambiar Excel/CSV, indicadores, contratos Zod, Supabase, RPC, RLS, migraciones, roles, permisos o persistencia en Truper Workspace.
---

# truper-data

## Fuente de verdad

- Contratos de entrada: `src/modules/platform/contracts.ts`.
- Normalización de archivo: `src/modules/sources/validation.ts` y `validation.worker.ts`.
- Mutaciones server: `src/modules/platform/actions.ts`.
- Lectura server: `src/modules/analytics/service.ts`.
- Tablas, RPC, constraints y RLS: `supabase/migrations/202609230001_truper_workspace.sql`.
- Pruebas: `tests/data.test.ts` y `tests/security.test.ts`.

## Reglas no negociables

1. Validar con Zod antes de llamar una acción o RPC.
2. No insertar directamente desde el navegador en tablas protegidas.
3. La autorización real vive en la base: sesión + RPC + RLS; una condición en React no basta.
4. Mantener `amountCents`/`amount_cents` como enteros. Convertir a MXN solo al mostrar.
5. Una importación debe ser atómica, limitada a 10,000 filas y reintentable mediante `requestId`.
6. Conservar cargas anteriores y activar solo una carga por proyecto.
7. No aceptar fechas imposibles, importes con más de dos decimales, campos vacíos o columnas ambiguas.
8. Una migración nueva debe ser aditiva, explícita, revisada contra RLS y acompañada por prueba.

## Antes de cambiar un contrato

Documenta quién produce el dato, quién lo consume, qué pasa con históricos, cómo se revierte y qué prueba lo cubre. No cambies nombres de columnas o roles “para que compile”.

## Definición de terminado

- [ ] Zod, acción, RPC/migración y tipos coinciden.
- [ ] Se cubren permisos, reintento, vacío, límite y dato inválido.
- [ ] La prueba de seguridad sigue demostrando aislamiento.
- [ ] `pnpm typecheck`, `pnpm lint` y `pnpm test` pasan.
- [ ] Se actualizan mapa técnico, plan y bitácora cuando corresponda.
