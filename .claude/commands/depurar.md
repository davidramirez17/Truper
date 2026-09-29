---
description: Investiga un fallo real siguiendo la cadena completa del proyecto.
---

# Depurar Truper Workspace

1. Describe síntoma, usuario, ruta, archivo y resultado esperado.
2. Reproduce el caso mínimo sin mostrar secretos ni logs completos.
3. Sigue `src/app` → sesión → módulo → acción/servicio → RPC/RLS → respuesta.
4. Separa UI, contrato, datos, permisos, migración y entorno.
5. Corrige la causa mínima y prueba el caso feliz, el caso fallido y la regresión.
6. Actualiza `docs/bitacora.md` con evidencia y riesgo residual.
