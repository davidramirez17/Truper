# Truper Workspace — guía para opinar sin leer código

Esta guía explica el producto con palabras de trabajo diario. Sirve para que una persona Jr pueda revisar avances, detectar algo raro y dar opinión aunque todavía no conozca Next.js, Supabase o TypeScript.

## 1. ¿Qué es el proyecto?

Truper Workspace es un espacio interno para convertir archivos de ventas en información útil para decidir.

La idea es sencilla:

1. Una persona carga un Excel o CSV.
2. El sistema revisa que tenga las columnas y valores necesarios.
3. La información se guarda asociada a un proyecto.
4. El equipo consulta ventas, movimientos, clientes, promedio y zonas.
5. Cada archivo nuevo se vuelve la información activa, pero el historial se conserva.

No es una tienda ni una página pública. Es una herramienta de trabajo para equipos con proyectos y permisos distintos.

## 2. ¿Qué puede hacer una persona?

- Ver un resumen general de la operación.
- Separar la información por proyecto.
- Cargar un archivo y corregir sus columnas antes de guardarlo.
- Revisar reportes y descargar movimientos en CSV.
- Ver cuándo se cargó información y qué cambios ocurrieron.
- Consultar alertas y proyectos que todavía no tienen archivo.
- Cambiar tema claro/oscuro.

Una persona con más permisos puede crear proyectos o administrar usuarios. Una persona de consulta puede ver lo permitido, pero no cargar ni modificar información.

## 3. Conceptos importantes

### Proyecto

Es una caja de trabajo independiente. Cada proyecto tiene personas autorizadas y sus propios archivos.

### Fuente de datos

Es el Excel o CSV que alimenta los indicadores. El sistema espera cuatro ideas: cliente, fecha, importe y zona de ventas.

### Movimiento

Es una fila del archivo después de ser revisada. Una fila representa un movimiento; no necesariamente una factura única.

### Carga activa

Es el último archivo aceptado que alimenta los números del proyecto. La carga anterior no desaparece: queda en el historial.

### Indicador

Es un número resumido para tomar una decisión: total de ventas, movimientos, clientes distintos, promedio y distribución por zona.

## 4. Cómo se vive una carga

La persona abre **Cargar archivo**, elige un proyecto y selecciona su Excel/CSV.

Después puede elegir la hoja y relacionar las columnas. El sistema muestra una vista previa y marca errores como cliente vacío, zona vacía, fecha imposible, importe con demasiados decimales, columnas repetidas o un archivo con más de 10,000 filas.

Hasta que la revisión está correcta, el botón para guardar permanece desactivado. Al guardar, se pide confirmación porque el nuevo archivo pasa a alimentar los indicadores del proyecto.

El archivo original no se conserva dentro de la plataforma; se guardan los registros necesarios y sus datos de control.

## 5. Cómo se organiza el proyecto

| Carpeta o archivo | Explicación cotidiana |
|---|---|
| `src/app/` | direcciones de las pantallas y respuestas del sitio |
| `src/modules/workspace/` | estructura del espacio de trabajo y sus secciones |
| `src/modules/analytics/` | números y formas de compararlos |
| `src/modules/sources/` | entrada, revisión y carga de archivos |
| `src/modules/auth/` | inicio de sesión, roles y acceso |
| `src/modules/platform/` | acciones que cambian proyectos, cargas o usuarios |
| `src/components/` | piezas visuales reutilizadas |
| `supabase/migrations/` | reglas y estructura de la información guardada |
| `tests/` | comprobaciones automáticas para datos y permisos |
| `docs/humano/` | esta explicación y su versión técnica |
| `docs/bitacora.md` | memoria corta de lo que se hizo y quedó pendiente |
| `docs/MAPA.md` | mapa automático de conexiones entre archivos |

## 6. Qué revisar cuando te enseñan un avance

Pregunta:

1. ¿Se entiende dónde estoy y cuál es la siguiente acción?
2. ¿Los números tienen fecha de corte y unidad?
3. ¿Se distingue un proyecto sin datos de un proyecto con ventas en cero?
4. ¿El sistema explica qué corregir cuando un archivo falla?
5. ¿Una persona sin permiso puede ver o guardar algo que no debería?
6. ¿La pantalla funciona igual de bien en celular y computadora?
7. ¿El nuevo archivo reemplaza la vista activa sin borrar el historial?
8. ¿La decisión que propone el indicador coincide con la operación real?

Una opinión útil dice: **qué vi**, **por qué puede confundir**, **a quién afecta** y **qué esperaría ver**.

## 7. Lo que ya existe y lo que falta

Ya existe la base del workspace, el acceso, el manejo de proyectos, la carga revisada de Excel/CSV, los indicadores, el historial y las pruebas de seguridad.

Todavía falta probar el ciclo completo con el Supabase real y un archivo operativo real. También falta decidir cómo crecer cuando haya muchos más de 50,000 movimientos y qué alertas necesita realmente el equipo.

Un avance puede verse terminado en pantalla y aun así tener pendiente la comprobación con datos reales. Son dos cosas diferentes.

## 8. Cómo dar seguimiento

- Mira `docs/PLAN.md` para saber qué sigue.
- Mira las primeras entradas de `docs/bitacora.md` para saber qué acaba de cambiar.
- Abre `docs/MAPA.md` para entender conexiones.
- Si cambia una pantalla o un proceso, pide que se actualice esta guía.
- Si un comportamiento no coincide con la operación, descríbelo con un ejemplo concreto y el archivo de entrada usado.
