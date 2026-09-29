# Arquitectura y diseño — Truper Workspace

## Producto

Truper Workspace convierte Excel/CSV operativos en movimientos normalizados e indicadores por proyecto. El diseño prioriza legibilidad de datos, siguiente acción clara, permisos visibles y responsive móvil/escritorio.

## Flujo principal

```text
Excel/CSV → worker SheetJS → mapeo y validación → Zod → Server Action
→ RPC Supabase + RLS → carga activa e historial → indicadores → exportación CSV
```

## Capas

- `src/app`: rutas, layout y handlers.
- `src/modules/auth`: sesión, perfil y roles.
- `src/modules/sources`: archivo, worker y validación.
- `src/modules/platform`: contratos y mutaciones.
- `src/modules/analytics`: lectura, tipos y cálculos.
- `src/modules/workspace`: navegación y composición de vistas.
- `src/components`: piezas reutilizables.
- `supabase/migrations`: modelo, RPC, RLS y auditoría.

## Decisiones

- Un importe se guarda como centavos enteros para evitar errores de redondeo.
- Una nueva carga conserva el historial y reemplaza solo la versión activa.
- Las consultas con error no muestran totales parciales.
- La UI puede esconder acciones, pero la autoridad de permisos está en Supabase.

## Diseño visual

- Inter/Manrope, tokens CSS y tema claro/oscuro.
- Densidad de información antes que decoración.
- Estados explícitos de carga, vacío, error y éxito.
- Foco visible, labels, navegación por teclado y contraste AA.

## Fuente ampliada

- Mapa técnico: `docs/humano/01-MAPA-TECNICO.md`.
- Explicación no técnica: `docs/humano/02-GUIA-NO-TECNICA.md`.
- Grafo de imports: `docs/MAPA.md` y `docs/graph.json`.
- Plan operativo: `docs/PLAN.md`.
