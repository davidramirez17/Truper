# Plan vivo — Truper Workspace

Estado de trabajo al 2026-09-28. Este archivo responde qué sigue; el detalle del sistema está en `docs/humano/01-MAPA-TECNICO.md` y `docs/humano/02-GUIA-NO-TECNICA.md`.

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
- [x] Pruebas unitarias de datos y prueba de seguridad con PGlite.

## Fase 2 — Activación real

- [x] Comprobar que el proyecto configurado expone las seis tablas de la migración y bloquea el acceso anónimo según RLS.
- [ ] Confirmar el historial de `202609230001_truper_workspace.sql` con una sesión administrativa de Supabase; no repetir la migración sin esa confirmación.
- [ ] Confirmar el correo del primer superusuario y activar su cuenta.
- [ ] Cargar un Excel operativo real, confirmar encabezados, unidades, fechas, duplicados y tamaño.
- [ ] Ejecutar smoke test de login → proyecto → carga → indicadores → exportación.
- [ ] Verificar la experiencia en 390, 768 y 1280 px con datos reales no sensibles.

## Fase 3 — Endurecimiento antes de producción

- [ ] Resolver la lectura limitada a 50,000 movimientos mediante agregación server-side o paginación de indicadores.
- [ ] Definir las reglas de alertas de negocio; hoy el workspace solo crea alertas informativas para proyectos sin carga.
- [ ] Decidir si `src/lib/excelReader.ts` y componentes sueltos no conectados al workspace se eliminan o se incorporan formalmente.
- [ ] Añadir pruebas de flujo de navegador cuando exista un entorno Supabase de prueba estable.
- [ ] Configurar despliegue y variables en Vercel sin exponer claves server-only.

## Herramientas de contexto

- RTK está instalado como `C:\Users\zemog\.local\bin\rtk.exe` y añadido al PATH de usuario.
- RTK quedó configurado por proyecto para Claude (`CLAUDE.md`), Codex (`.codex/hooks.json`) y Copilot (`.github/hooks/rtk-rewrite.json`); sus filtros editables viven en `.rtk/filters.toml`.
- CodeBurn está instalado globalmente como `codeburn 0.9.25`.
- No se instalaron Context Mode ni Tokensave: agregan integración global MCP/hooks y no son necesarios para el contrato común del repositorio. Se pueden evaluar después, por separado.

## Decisiones abiertas

1. **Fuente operativa:** Excel/CSV es la entrada actual; no se debe modelar una segunda fuente hasta probar un archivo real.
2. **Escalabilidad:** el dashboard carga hasta 50,000 movimientos; superar ese límite debe cambiar el contrato de lectura, no ocultar registros.
3. **Módulos:** `moduleRegistry` tiene hoy solo `ventas`; agregar navegación sin contrato, validación, métricas y persistencia no cuenta como módulo terminado.
