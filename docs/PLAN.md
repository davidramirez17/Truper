# Plan vivo — Truper Workspace

Estado de trabajo al 2026-09-29. Este archivo responde qué sigue; el detalle del sistema está en `docs/humano/01-MAPA-TECNICO.md` y `docs/humano/02-GUIA-NO-TECNICA.md`.

## Fase 0 — Base de trabajo y contexto

- [x] Unificar instrucciones para Codex, Claude Code y GitHub Copilot en `AGENTS.md` y adaptadores.
- [x] Crear grafo reproducible con `pnpm graph`, `docs/graph.json` y `docs/MAPA.md`.
- [x] Crear guía técnica y guía no técnica para una persona Jr.
- [x] Instalar/verificar RTK y CodeBurn en Windows.
- [x] Limpiar skills y documentación heredadas de otros proyectos.

## Fase 1 — Base funcional actual

- [x] Workspace autenticado con rutas de resumen, proyectos, fuentes, reportes, alertas, configuración, cargas, actividad y diseño.
- [x] Lectura server-side de proyectos, cargas, movimientos, miembros, auditoría y usuarios de superusuario.
- [x] Carga de Excel/CSV con worker, mapeo de columnas, validación, vista previa y límite de 10,000 filas.
- [x] Contratos Zod, Server Actions y RPCs idempotentes para crear proyectos, importar ventas y administrar accesos.
- [x] Migración aislada `202609230001_truper_workspace.sql` con RLS, roles y auditoría.
- [x] Vista de salud `/sistema` para superusuarios con tamaño de base, tablas, estadísticas y recomendaciones no destructivas.
- [x] Migración local `202609290001_truper_system_health.sql` con RPC protegido; validada de forma aislada con PGlite.
- [x] Directorio de personas con área, puesto, foto, responsable directo, organigrama, filtros y matriz de permisos.
- [x] Perfil propio para usuarios normales y bucket/políticas de avatares en `202609290002_truper_people_and_permissions.sql`.
- [x] Carga de Excel centralizada en `/fuentes`; dashboard, proyectos y detalle enlazan a esa pantalla en vez de repetir el selector de archivos.
- [x] Botón común para guardar la vista como PDF mediante impresión del navegador; se ocultan controles al imprimir.
- [x] Corrección de la hidratación del tema: el toggle espera a montar antes de leer `next-themes`.
- [x] Pruebas unitarias de datos y prueba de seguridad con PGlite.
- [x] Reducir recorridos repetidos en tendencias y metadatos de proyectos para preparar la primera carga grande.

## Fase 2 — Activación real

- [x] Comprobar que el proyecto configurado expone las seis tablas de la migración y bloquea el acceso anónimo según RLS.
- [ ] Confirmar el historial de `202609230001_truper_workspace.sql` con una sesión administrativa de Supabase; no repetir la migración sin esa confirmación.
- [ ] Aplicar `202609290001_truper_system_health.sql` en Supabase remoto y configurar `SUPABASE_DATABASE_LIMIT_BYTES` si se desea porcentaje de uso.
- [ ] Aplicar `202609290002_truper_people_and_permissions.sql`, verificar el bucket `truper-avatars` y probar subida de foto con superusuario y usuario normal.
- [ ] Confirmar el correo del primer superusuario y activar su cuenta.
- [ ] Cargar un Excel operativo real, confirmar encabezados, unidades, fechas, duplicados y tamaño.
- [ ] Ejecutar smoke test de login → proyecto → carga → indicadores → exportación.
- [ ] Verificar la experiencia en 390, 768 y 1280 px con datos reales no sensibles.

## Fase 3 — Endurecimiento antes de producción

- [ ] Resolver la lectura limitada a 50,000 movimientos mediante agregación server-side o paginación de indicadores.
- [ ] Definir las reglas de alertas de negocio; hoy el workspace solo crea alertas informativas para proyectos sin carga.
- [x] Retirar `src/lib/excelReader.ts` y los componentes visuales antiguos sin referencias; el worker de `sources` y la UI de `workspace` son ahora las rutas activas.
- [ ] Añadir pruebas de flujo de navegador cuando exista un entorno Supabase de prueba estable.
- [ ] Configurar despliegue y variables en Vercel sin exponer claves server-only.
- [ ] Incorporar APM o medición de rendimiento de aplicación después de probar el primer Excel real; la vista actual cubre PostgreSQL y la latencia de su RPC de salud.

## Herramientas de contexto

- RTK está instalado como `C:\Users\zemog\.local\bin\rtk.exe` y añadido al PATH de usuario.
- RTK quedó configurado por proyecto para Claude (`CLAUDE.md`), Codex (`.codex/hooks.json`) y Copilot (`.github/hooks/rtk-rewrite.json`); sus filtros editables viven en `.rtk/filters.toml`.
- CodeBurn está instalado globalmente como `codeburn 0.9.25`.
- CodeGraph `2.3.31` está instalado globalmente, inicializado en `.codegraph/` y configurado para Codex, Claude y el skill genérico de agentes. Su índice local no se versiona.
- No se instalaron Context Mode ni Tokensave: agregan integración global MCP/hooks y no son necesarios para el contrato común del repositorio. Se pueden evaluar después, por separado.

## Decisiones abiertas

1. **Fuente operativa:** Excel/CSV es la entrada actual; no se debe modelar una segunda fuente hasta probar un archivo real.
2. **Escalabilidad:** el dashboard carga hasta 50,000 movimientos; superar ese límite debe cambiar el contrato de lectura, no ocultar registros.
3. **Módulos:** `moduleRegistry` tiene hoy solo `ventas`; agregar navegación sin contrato, validación, métricas y persistencia no cuenta como módulo terminado.
