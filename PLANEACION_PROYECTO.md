# Planeación del producto — Truper Workspace

## Objetivo

Dar a un equipo una forma confiable de transformar archivos operativos de ventas en indicadores consultables por proyecto, con permisos, historial y una experiencia clara en móvil y escritorio.

## Producto actual

- Un workspace autenticado con resumen, proyectos, fuentes, reportes, alertas, cargas, actividad y configuración.
- Un primer módulo funcional: `ventas`.
- Entrada por Excel/CSV con cuatro campos de negocio: cliente, fecha, importe y zona de ventas.
- Carga activa por proyecto, historial de cargas y auditoría.
- Roles: superusuario, administrador, analista y consulta.

## Principios

1. Los datos se validan antes de persistirse.
2. El navegador no es la autoridad de permisos; la base aplica RPC y RLS.
3. Una carga nueva reemplaza la vista activa, pero no borra la anterior.
4. Los indicadores deben declarar fecha de corte, unidad y definición.
5. Un proyecto nuevo necesita contrato de datos, validación, persistencia, vista y pruebas; un botón en navegación no basta.

## Fases

### Fase 1 — Base confiable

Autenticación, esquema aislado, RLS, workspace, primer módulo, carga validada y pruebas locales.

### Fase 2 — Validación operativa

Migración aplicada en Supabase real, primer superusuario activo, archivo real probado y smoke test completo.

### Fase 3 — Crecimiento

Agregación server-side, alertas de negocio, metas, más módulos y pruebas de navegador en un entorno controlado.

## No hacer todavía

- No construir un segundo módulo sin un proceso operativo y un archivo de ejemplo.
- No ampliar límites de filas sin medir memoria, tiempo y consulta server-side.
- No introducir una API paralela ni cambiar a Vite: el proyecto actual es Next.js App Router.
- No activar automatizaciones de correo o cron como sustituto de reglas de negocio todavía no definidas.

El estado ejecutable y los pendientes vivos están en `docs/PLAN.md`.
