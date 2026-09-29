---
name: truper-frontend
description: Usa esta skill al cambiar pantallas, rutas visuales, componentes React, estilos, responsive, accesibilidad o estados de interfaz en Truper Workspace.
---

# truper-frontend

## Stack real

- Next.js 15 App Router, React 19 y TypeScript estricto.
- Tailwind está disponible, pero la dirección visual actual vive principalmente en `src/app/globals.css` y `src/app/platform.css`.
- `next-themes` controla el tema y `motion` respeta reduced motion.

## Reglas

1. Antes de tocar UI, ubica la ruta en `src/app/[[...slug]]/page.tsx`, la vista en `src/modules/workspace/views.tsx` y el texto/navegación en `navigation.ts`.
2. Mantén server components/server actions separados de componentes `'use client'`.
3. No uses un color, espaciado o tipografía aislado si ya existe un token o clase del sistema.
4. Cada estado importante debe tener carga, vacío, error y éxito legibles; no esconder un fallo detrás de un spinner infinito.
5. Mantén foco visible, etiquetas para controles, navegación por teclado, contraste AA y usable en 390/768/1280 px.
6. Los permisos visibles mejoran la UX, pero nunca sustituyen `requireSession`, RPC o RLS.
7. No agregues una pantalla ficticia: conéctala a `WorkspaceData` o declara el estado como prototipo.

## Flujo de cambio

```text
ruta → vista → datos/acción → estados → responsive → pruebas
```

Revisa impacto en `Workspace.tsx`, `views.tsx`, `types.ts`, navegación, componentes compartidos y pruebas. Si cambia el flujo visible, actualiza `docs/humano/02-GUIA-NO-TECNICA.md`.

## Definición de terminado

- [ ] El componente usa datos y contratos reales.
- [ ] Se revisaron estados de carga, vacío, error y éxito.
- [ ] Se revisó teclado, foco y responsive.
- [ ] `pnpm typecheck`, `pnpm lint` y `pnpm test` pasan.
- [ ] `pnpm build` pasa si cambió ruta, configuración o renderizado server.
