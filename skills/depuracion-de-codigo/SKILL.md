---
name: depuracion-de-codigo
description: Usa esta skill cuando exista un fallo real, regresión, error de datos, problema de permisos o diferencia entre local y Supabase que deba investigarse con evidencia.
---

# depuracion-de-codigo

## Principio

No arregles el síntoma a ciegas. Primero reproduce, registra la evidencia, formula una hipótesis falsable y modifica la causa mínima.

## Ciclo

1. **Definir:** qué debía ocurrir, qué ocurrió, con qué usuario, ruta, archivo y datos.
2. **Reproducir:** ejecutar el caso mínimo sin exponer secretos ni pegar logs completos.
3. **Localizar:** seguir la cadena ruta → módulo → acción/servicio → RPC/RLS → respuesta.
4. **Aislar:** separar bug de UI, contrato, sesión, permisos, migración, datos o entorno.
5. **Corregir:** cambio pequeño y reversible; no desactivar validaciones para hacer pasar la prueba.
6. **Verificar:** caso feliz, caso fallido y regresión relacionada.

## Pistas del proyecto

- Si falla al entrar: revisar `src/lib/supabase/config.ts`, `src/modules/auth/session.ts`, middleware y estado de `truper_profiles`.
- Si faltan datos: revisar `getWorkspaceData()`, RLS, lote activo y errores de Supabase.
- Si falla una carga: revisar worker, `validation.ts`, Zod, `requestId`, RPC y constraints de la migración.
- Si los números no cuadran: revisar `asOf`, periodo, centavos, `selectAnalytics()` y el archivo fuente.
- Si solo falla en navegador: revisar frontera `'use client'`, worker, tamaño del archivo y tiempo límite.

## Cierre

Registra en `docs/bitacora.md` síntoma, causa, prueba que lo demuestra y riesgo residual. Ejecuta `pnpm typecheck`, `pnpm lint`, `pnpm test` y `pnpm build` si el fallo toca rutas o configuración.
