# Mapa de dependencias de Truper Workspace

> Generado por `pnpm graph` desde los imports locales de `src/`. No editar a mano.

## Lectura rápida

- Nodos: **47** archivos TypeScript/TSX.
- Conexiones locales: **68** imports entre archivos del proyecto.
- Entrada principal autenticada: `src/app/[[...slug]]/page.tsx`.
- Orquestador visual: `src/modules/workspace/Workspace.tsx`.
- Datos protegidos: `src/modules/analytics/service.ts` y `src/modules/platform/actions.ts`.

## Capas observadas

| Carpeta | Archivos |
|---|---:|
| `src/` | 1 |
| `src/app/` | 13 |
| `src/components/` | 9 |
| `src/lib/` | 5 |
| `src/modules/` | 19 |

## Archivos más conectados

| Archivo | Entradas | Salidas |
|---|---:|---:|
| `src/modules/analytics/types.ts` | 9 | 1 |
| `src/lib/supabase/config.ts` | 7 | 0 |
| `src/modules/analytics/selectors.ts` | 6 | 1 |
| `src/modules/auth/types.ts` | 6 | 0 |
| `src/modules/auth/session.ts` | 5 | 3 |
| `src/components/ui/Dialog.tsx` | 4 | 0 |
| `src/modules/auth/AuthShell.tsx` | 4 | 2 |
| `src/components/ui/Brand.tsx` | 3 | 0 |
| `src/lib/supabase/server.ts` | 3 | 1 |
| `src/modules/platform/actions.ts` | 3 | 3 |
| `src/components/ui/MetricCard.tsx` | 2 | 0 |
| `src/components/MobileDock.tsx` | 1 | 1 |

## Cómo usarlo

1. Ejecuta `pnpm graph` después de mover módulos o cambiar imports importantes.
2. Abre `docs/graph.json` si necesitas buscar una conexión exacta.
3. Para entender una pantalla, sigue la ruta: página → servicio/acción → módulo → componente.
4. El grafo no reemplaza revisar contratos, migraciones, permisos ni pruebas.
