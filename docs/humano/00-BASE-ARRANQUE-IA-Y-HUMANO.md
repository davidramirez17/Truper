# Base reutilizable para iniciar proyectos con IA

Este documento resume lo que se construyó en la sesión de preparación de Truper Workspace. Su objetivo es servir como plantilla para otro proyecto: una persona puede entenderla y una IA puede usarla como punto de partida para trabajar con orden.

## 1. ¿Para qué sirve esta planificación?

La IA no debe comenzar programando a ciegas. Primero necesita entender:

- qué producto existe;
- cuál es el archivo o módulo principal;
- cómo se conectan las partes;
- qué permisos, datos y contratos no puede romper;
- qué se hizo en tareas anteriores;
- qué sigue y cómo se comprobará.

Por eso se separaron tres cosas:

1. **Código:** hace funcionar el producto.
2. **Contexto para la IA:** explica estructura, reglas, grafo, decisiones y validaciones.
3. **Explicación para humanos:** permite que una persona Jr entienda el producto y opine sin conocer toda la tecnología.

La documentación no sustituye al código. Si existe una contradicción, la IA debe revisar el código, los contratos, la base de datos y las pruebas, y marcar la contradicción.

## 2. Qué se pidió y qué se mejoró en esta sesión

Las peticiones principales fueron:

- crear una guía técnica y otra no técnica para una persona Jr;
- ordenar documentación, bitácora, versionamiento, skills y reglas de trabajo;
- permitir que Codex, Claude Code y GitHub Copilot reciban el mismo contexto;
- reducir ruido de terminal y consumo de contexto;
- crear un grafo para localizar módulos y dependencias;
- limpiar archivos heredados, respaldos y artefactos temporales;
- revisar si había dos aplicaciones o una estructura incorrecta;
- comprobar la migración y la seguridad de Supabase;
- dejar un proceso repetible para cerrar cada tarea.

El resultado fue:

- `AGENTS.md` como contrato principal para cualquier agente;
- `CLAUDE.md` y `.github/copilot-instructions.md` como adaptadores;
- `docs/humano/` con explicación técnica y explicación no técnica;
- `docs/PLAN.md` para siguientes pasos;
- `docs/bitacora.md` como historial breve y acumulativo;
- `docs/MAPA.md` y `docs/graph.json` generados por `pnpm graph`;
- `scripts/generate-graph.mjs` para reconstruir el mapa;
- skills reducidas al dominio real del proyecto;
- RTK para comprimir salidas de terminal;
- CodeBurn para observar consumo de sesiones;
- CodeGraph para construir un índice semántico local de archivos, símbolos, referencias, dependencias y posibles pruebas relacionadas;
- limpieza de `.bak`, previews, auditorías locales y archivos generados versionados;
- un flujo central de actualización de datos en `/fuentes`, sin repetir “Agregar archivo” en cada sección;
- un módulo de personas con roles, permisos, área, puesto, foto, responsable directo y organigrama;
- perfil propio para usuarios normales y una acción común para guardar cualquier vista como PDF;
- corrección de la hidratación del selector de tema de `next-themes`;
- comprobaciones de TypeScript, lint, pruebas y build.

## 3. Qué puede copiarse a otro proyecto

Copiar estas piezas como base, revisando sus rutas y nombres:

| Pieza | Para qué sirve | ¿Copiar? |
|---|---|---|
| `AGENTS.md` | Reglas comunes, seguridad, validación y cierre | Sí, adaptando el stack |
| `CLAUDE.md` | Entrada corta para Claude Code | Sí, adaptando comandos |
| `.github/copilot-instructions.md` | Entrada para GitHub Copilot | Sí, adaptando comandos |
| `docs/humano/00-BASE-ARRANQUE-IA-Y-HUMANO.md` | Esta plantilla de arranque | Sí |
| `docs/humano/01-MAPA-TECNICO.md` | Arquitectura entendible para Jr | Copiar como plantilla y reescribir |
| `docs/humano/02-GUIA-NO-TECNICA.md` | Producto explicado sin jerga | Copiar como plantilla y reescribir |
| `docs/bitacora.md` | Continuidad entre chats | Sí, empezando una nueva bitácora |
| `docs/PLAN.md` | Estado y siguientes pasos | Sí, reemplazando el plan |
| `scripts/generate-graph.mjs` | Grafo de imports locales | Sí, si el proyecto usa una estructura compatible |
| `skills/depuracion-de-codigo` | Método para investigar fallos | Sí |
| `skills/documentacion-y-contexto` | Método para mantener documentación | Sí |
| `skills/truper-frontend` | Criterios de UI de este producto | Solo después de adaptarla |
| `skills/truper-data` | Reglas de Excel, Supabase y RLS | Solo si el nuevo proyecto usa esos contratos |
| `.codex/hooks.json`, `.rtk/`, `.github/hooks/` | Integración local de RTK | Opcional, revisar rutas y agente |
| `RTK.md` | Cómo usar RTK en el repositorio | Sí, adaptando comandos |
| `CodeGraph` | Índice semántico local para explorar conexiones y alcance de cambios | Instalar en cada máquina; no copiar el binario |
| `versionamiento.md` | Reglas de cambios y releases | Sí, adaptando el flujo Git |

Para Truper, las piezas nuevas que acompañan esta base son `src/components/ui/Avatar.tsx`, `src/components/ui/PdfButton.tsx`, `src/modules/platform/PlatformViews.tsx` y la migración `202609290002_truper_people_and_permissions.sql`. En otro proyecto no se copian a ciegas: se copia la idea, se revisan sus permisos y se cambia el modelo de personas.

No se deben copiar como si fueran universales las migraciones, los nombres de tablas, los roles, las rutas de Truper, los contratos de Excel ni las reglas específicas de negocio.

## 4. Qué no debe copiarse

No copiar a otro proyecto:

- `.env.local`, claves, tokens, contraseñas ni archivos con datos reales;
- `node_modules/`, `.next/`, `out/` o carpetas de compilación;
- `.codegraph/` y su caché local;
- `tsconfig.tsbuildinfo`, logs, `.bak`, previews o auditorías locales;
- migraciones y seeds de otro producto sin revisarlas;
- `docs/graph.json` y `docs/MAPA.md` sin regenerarlos;
- una bitácora vieja como si describiera el proyecto nuevo;
- binarios instalados en el equipo.

El botón PDF es local al navegador: no implica que el nuevo proyecto tenga un generador PDF en servidor. Las fotos y el modelo de roles tampoco deben trasladarse sin revisar privacidad, almacenamiento y autorización.

RTK, CodeBurn y CodeGraph se instalan en la máquina, no se guardan dentro del repositorio. En esta sesión quedaron verificados RTK `0.50.0`, CodeBurn `0.9.25` y CodeGraph `2.3.31`. Context Mode y Tokensave no se instalaron porque no eran necesarios para el contrato actual; pueden evaluarse después, por separado y con una justificación clara.

### CodeGraph

Instalación global en Windows:

```powershell
npm install --global @lzehrung/codegraph
codegraph doctor
```

Después de una instalación global en Windows, abre una terminal nueva para que se actualice el `PATH`. Si la terminal actual todavía no encuentra el comando, usa temporalmente `%APPDATA%\npm\codegraph.ps1` o reinicia el agente.

Preparación de un repositorio:

```powershell
codegraph init --root .
codegraph status --root .
codegraph sync --root .
```

Consultas útiles para una IA:

```powershell
codegraph orient --root .
codegraph explore "¿cómo funciona la autenticación?" --root . --pretty
codegraph refs src/modules/auth --root .
codegraph callers src/app/[[...slug]]/page.tsx --root .
```

CodeGraph crea `.codegraph/`, que contiene el índice y la caché local. Esa carpeta debe permanecer en `.gitignore`; no contiene el código fuente que la IA necesita compartir por Git. La configuración global de agentes se instala con:

```powershell
codegraph install codex --yes
codegraph install claude --yes
codegraph install agents --yes
```

Después hay que reiniciar o recargar el agente. La integración genérica para Copilot se mantiene en `.github/copilot-instructions.md`; si una versión de CodeGraph no ofrece destino Copilot, Copilot puede usar los comandos de terminal documentados y el grafo del repositorio.

CodeGraph y `pnpm graph` tienen funciones distintas:

- `pnpm graph` genera `docs/graph.json` y `docs/MAPA.md`, resultados pequeños, reproducibles y versionables.
- CodeGraph mantiene `.codegraph/` local y permite preguntas semánticas, símbolos, callers, referencias, impacto y contexto acotado.

Usar ambos: el primero conserva continuidad para todo el equipo; el segundo acelera la exploración de la máquina actual.

## 5. Cómo preparar un proyecto nuevo

### Paso 1: copiar la base

Copiar los documentos y skills reutilizables al nuevo repositorio. Después cambiar:

- nombre del producto;
- stack y gestor (`pnpm`, `npm`, `bun` u otro);
- comandos de validación;
- entrada principal;
- módulos y carpetas reales;
- reglas de seguridad y permisos;
- ubicación de migraciones, pruebas y variables.

### Paso 2: describir el proyecto para una persona Jr

Completar:

- `docs/humano/01-MAPA-TECNICO.md`: archivos principales, conexiones, contratos, datos, decisiones y mejoras posibles;
- `docs/humano/02-GUIA-NO-TECNICA.md`: qué problema resuelve el producto, qué puede hacer cada persona y qué contiene cada carpeta.

### Paso 3: construir el contexto de la IA

Crear o actualizar:

- `AGENTS.md` con reglas cortas y obligatorias;
- `docs/PLAN.md` con trabajo terminado, trabajo pendiente y bloqueos;
- `docs/bitacora.md` con las decisiones recientes;
- `docs/MAPA.md` y `docs/graph.json` con el comando del proyecto.

### Paso 4: iniciar la primera conversación

Usar un mensaje parecido a este:

> Lee `AGENTS.md`, `docs/bitacora.md`, `docs/PLAN.md`, `docs/humano/01-MAPA-TECNICO.md`, `docs/humano/02-GUIA-NO-TECNICA.md` y el mapa generado. No programes todavía. Inspecciona la estructura real, identifica el archivo principal, módulos conectados, contratos, permisos, pruebas y riesgos. Separa hechos comprobados de hipótesis y propón el siguiente bloque pequeño de trabajo.

La IA debe inspeccionar primero el repositorio real. No debe asumir que una guía antigua sigue siendo correcta.

## 6. Cómo debe trabajar la IA en cada tarea

1. Leer las reglas y las tres entradas superiores de la bitácora.
2. Leer el plan y ubicar la tarea.
3. Revisar el grafo si la tarea toca arquitectura o imports.
4. Buscar símbolos con `rg` y abrir solo los archivos conectados.
5. Identificar entrada, datos, salida, permisos, contrato, pruebas y reversión.
6. Implementar el cambio más pequeño que resuelva la tarea.
7. Ejecutar las validaciones proporcionales al riesgo.
8. Actualizar documentación solo donde cambió la realidad.
9. Limpiar temporales creados durante la tarea.
10. Reportar hechos verificados, comandos ejecutados, pendientes y riesgos.

No debe afirmar que algo está conectado a producción solo porque existe código local. Debe distinguir entre:

- **verificado:** observado en código, prueba, API o navegador;
- **inferido:** parece cierto, pero falta comprobarlo;
- **bloqueado:** requiere credenciales, decisión humana o un entorno externo.

## 7. Qué actualizar al terminar

| Si cambió... | Actualizar... |
|---|---|
| arquitectura, rutas, contratos o datos | `docs/humano/01-MAPA-TECNICO.md` |
| comportamiento visible para usuarios | `docs/humano/02-GUIA-NO-TECNICA.md` |
| siguiente paso o bloqueo | `docs/PLAN.md` |
| decisión y evidencia de la sesión | parte superior de `docs/bitacora.md` |
| imports o estructura | `docs/MAPA.md` y `docs/graph.json` mediante el comando del proyecto |
| reglas de agentes o proceso | `AGENTS.md`, adaptadores y `versionamiento.md` |
| solo un detalle interno sin impacto | normalmente solo código y pruebas |

La bitácora debe ser breve. No se pegan logs completos ni archivos enteros; se registra el resultado y dónde encontrar la evidencia.

## 8. Cómo puede participar la persona humana

La persona no necesita conocer toda la tecnología para dirigir el proyecto. Puede pedir:

- “Explícame qué cambió en palabras simples”.
- “Enséñame qué archivo es la fuente principal”.
- “Dime qué está comprobado y qué falta comprobar”.
- “Actualiza solo la documentación; no implementes la idea”.
- “Propón mejoras y sepáralas de lo ya hecho”.
- “Cierra la tarea y deja la bitácora lista para el siguiente chat”.

La persona debe decidir cuando exista una acción externa o sensible: producción, migraciones, permisos, secretos, despliegue, eliminación de datos o instalación de una herramienta que afecte otros proyectos.

## 9. Regla de continuidad

Un chat nuevo no debe depender de la memoria del chat anterior. La continuidad debe quedar en el repositorio:

```text
AGENTS.md
  → reglas y límites
docs/humano/
  → explicación para IA y personas
docs/PLAN.md
  → qué sigue
docs/bitacora.md
  → qué pasó y por qué
docs/MAPA.md + docs/graph.json
  → cómo se conecta el código
skills/
  → métodos especializados de trabajo
```

Si estos archivos están actualizados, Codex, Claude Code y GitHub Copilot pueden comenzar con el mismo contexto, aunque sea una conversación nueva.
