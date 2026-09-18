# Planeación del proyecto de análisis de ventas

## 1. Objetivo general

Crear una plataforma móvil-first para centralizar procesos de ventas, indicadores clave, carga de información desde Excel y revisión operacional por proyecto. La idea es que cada proceso o flujo manual quede documentado, ordenado y sea escalable para proyectos futuros.

## 2. Filosofía del sistema

- Cada proceso manual debe vivir como un módulo independiente.
- La estructura debe permitir crecer sin romper la base actual.
- La vista principal debe priorizar móvil y velocidad de lectura.
- La autenticación debe estar presente desde el inicio para separar acceso operativo y administrativo.
- Los datos de origen pueden ser diferentes entre proyectos, pero el sistema debe estandarizar su almacenamiento y visualización.

## 3. Estructura propuesta

```text
src/
  app/
    (auth)/
      login/
      reset-password/
    dashboard/
      page.tsx
      [projectId]/page.tsx
    api/
      alertas/
      excel/
      sync/
  components/
    ui/
    cards/
    charts/
    modules/
    navbar/
  lib/
    supabase.ts
    auth.ts
    excelReader.ts
    formatters.ts
    projectRegistry.ts
  modules/
    facturacion/
      service.ts
      parser.ts
      types.ts
    ventas/
      service.ts
      parser.ts
      types.ts
    inventario/
      service.ts
      parser.ts
      types.ts
  types/
    project.ts
    kpis.ts
```

## 4. Diseño visual y flujo de usuario

### Pantalla principal

- Header con nombre del proyecto y fecha.
- Tarjetas KPI grandes y legibles en móvil.
- Botones rápidos: dashboard, proyectos, fuentes, alertas.
- Últimos cambios y estado de sincronización.

### Login

- Pantalla de acceso con email + contraseña.
- Soporte futuro para magic link o autenticación institucional.
- RLS en Supabase para restringir acceso por usuario o rol.
- Roles sugeridos:
  - admin
  - analista
  - consultor
  - viewer

### Dashboard

- KPI global por proyecto o por consolidado.
- Gráficos sencillos y legibles.
- Indicadores de salud:
  - datos cargados hoy
  - errores de archivo
  - alertas activas
  - volumen de ventas
  - proyección semanal

## 5. Modelado de proyectos y Excel

La clave es separar claramente lo siguiente:

1. Fuente de datos original (Excel, CSV, export de sistema)
2. Parser / limpieza del archivo
3. Transformación a formato interno
4. Carga a Supabase
5. KPI y dashboard

### Regla recomendada

Cada proyecto debe tener un "registro" con:

- nombre
- tipo de archivo
- fecha de última carga
- estado
- responsable
- tabla destino
- columnas requeridas
- variables calculadas

Esto ayuda a evitar que todos los archivos se vuelvan un conjunto amorfo de hojas distintas.

## 6. Estructura de datos sugerida en Supabase

### Tabla: projects

Campos sugeridos:
- id
- name
- slug
- description
- status
- created_at
- updated_at

### Tabla: project_sources

- id
- project_id
- name
- file_type
- source_path
- last_uploaded_at
- is_active

### Tabla: kpis

- id
- project_id
- metric_name
- metric_value
- metric_date
- period_type
- created_at

### Tabla: alerts

- id
- project_id
- severity
- title
- message
- resolved
- created_at

## 7. Recomendaciones de arquitectura

### A. Orden por módulo

En lugar de poner todo junto, conviene crear módulos por proceso. Ejemplo:

- facturacion/
- ventas/
- pedidos/
- cobranzas/
- inventario/

Cada módulo debe tener:
- tipos
- parser
- service
- validaciones
- KPI desglosado

### B. Un solo source of truth

Todo lo que venga del Excel debe transformarse a un formato interno antes de mostrarse. Esto te permite mantener diferencias de estructura entre archivos sin romper el dashboard.

### C. Dashboard central + detalle por proyecto

La pantalla de inicio debe mostrar overview general, pero cada proyecto debe tener su vista detallada con:
- métricas
- tendencia
- archivos cargados
- observaciones
- alertas

## 8. Mejoras concretas para este proyecto

### Mejoras de UX

- Mobile-first con botones grandes y legibilidad alta.
- Modo oscuro opcional.
- Skeleton loading para KPIs y gráficos.
- Breadcrumbs para navegación entre proyectos.
- Botón de recarga manual de datos.

### Mejoras de análisis

- Comparativo mes vs. mes.
- Variación semanal y mensual.
- Top 5 por zona, cliente o producto.
- Indicadores de desviación contra meta.
- Alertas automáticas por umbral.

### Mejoras de operación

- Historial de carga de archivos.
- Modo de prueba para validar Excel antes de guardar.
- Logs por proceso.
- Panel de errores por proyecto.
- Tabla de auditoría de cambios.

## 9. Fase de desarrollo recomendada

### Fase 1: base sólida

- conectar Supabase correctamente
- crear login base
- preparar estructura por módulos
- definir dashboard móvil

### Fase 2: carga y validación

- cargar Excel de cada proceso
- identificar columnas obligatorias
- normalizar y limpiar datos
- guardar en Supabase

### Fase 3: KPI y reportes

- métricas globales
- métricas por proyecto
- comparativos por fecha
- alertas por umbral

### Fase 4: automatización

- sincronización de archivos
- cron jobs o tareas programadas
- notificaciones por correo / dashboard

## 10. Recomendación sobre la autenticación

Con Supabase, la forma más limpia de empezar es:

- usar Auth con email/password
- crear roles por tipo de acceso
- aplicar políticas por tabla
- usar RLS para restringir lectura y escritura

Las credenciales públicas como la anon key se usan en navegador; la secret key no debe quedar expuesta en el frontend.

## 11. Variables de entorno que sí deben quedar protegidas

Archivo .env.local:

```env
NEXT_PUBLIC_SUPABASE_URL=URL_REAL_DEL_PROYECTO
NEXT_PUBLIC_SUPABASE_ANON_KEY=KEY_PUBLICA
SUPABASE_SERVICE_ROLE_KEY=KEY_SECRET
```

Importante:
- la anon key puede ir al frontend
- la service role key solo debe usarse en servidor o backend
- nunca se debe exponer en un componente cliente

## 12. Comandos para conectarlo con GitHub

### Inicializar repo y empujar lo actual

```bash
echo "# Truper" >> README.md
git init
git add README.md
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/davidramirez17/Truper.git
git push -u origin main
```

### Si el repositorio ya existe localmente

```bash
git remote add origin https://github.com/davidramirez17/Truper.git
git branch -M main
git push -u origin main
```

### Si ya está conectado y solo quieres subir cambios

```bash
git add .
git commit -m "ajustes de base y planeación"
git push origin main
```

## 13. Siguiente paso recomendado

1. Conectar el repo a GitHub.
2. Conectar Vercel a ese repositorio.
3. Añadir las variables reales de Supabase en Vercel.
4. Configurar el login y el dashboard base.
5. Definir el primer módulo: facturación o ventas.

## 14. Decisión clave del proyecto

La clave no es cargar Excel bonito desde el primer día; la clave es construir un sistema confiable y ordenado para que cada proyecto pueda entrar después sin romper el producto. Por eso la prioridad debe ser:

- organización por proceso
- autenticación real
- dashboard móvil
- datos normalizados
- KPI consistentes

A partir de ahí, cada excel entra como una fuente más, no como caos.
