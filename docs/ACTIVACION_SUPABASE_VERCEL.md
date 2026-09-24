# Activación en los servicios reales

## Estado de esta preparación

La integración está implementada. En el entorno revisado no había URL de Supabase, sesión CLI ni acceso conectado a Vercel/Supabase. La migración local no se considera aplicada en producción. No se ha concedido acceso a ningún usuario real ni se ha realizado un despliegue remoto desde esta preparación.

## 1. Conexión

Copiar `.env.example` a `.env.local` y completar `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Son las únicas variables de Supabase necesarias para ejecutar la aplicación. No usar una clave secreta en ninguna variable `NEXT_PUBLIC_*`.

La clave secreta compartida en la conversación debe rotarse en Supabase. El código de la aplicación no la necesita.

## 2. Base de datos

Aplicar `supabase/migrations/202609230001_truper_workspace.sql` al proyecto Truper mediante Supabase CLI con el proyecto enlazado o SQL Editor autenticado. Revisar primero que no existan tablas `truper_*` de otra instalación; la migración es aditiva y no modifica `kpis_ventas`.

Las pruebas locales ejecutan esta misma migración en Postgres embebido y comprueban RLS, roles, aislamiento y transacciones. Después de aplicarla en Supabase se debe repetir la validación con cuentas de prueba autorizadas. Verificar también que `truper_private` no esté en los esquemas expuestos de Data API.

## 3. Cuenta del titular

1. El titular crea su cuenta en `/registro` y confirma el correo.
2. Configurar temporalmente `SUPABASE_SECRET_KEY` (nueva, no expuesta) y `TRUPER_OWNER_EMAIL` en `.env.local`.
3. Ejecutar `npm run bootstrap:owner` desde `app`. El script busca exactamente ese correo, exige verificación y activa el perfil como `superadmin`.
4. Retirar la clave secreta del archivo local. Las operaciones normales siguen usando sesión + RLS.

Alternativa: un administrador del proyecto puede promover el UUID verificado desde SQL Editor. No usar el correo recibido desde un formulario como regla automática de privilegios.

## 4. Auth y Vercel

- En Supabase Auth, configurar Site URL con el dominio real de producción.
- Permitir redirects de `https://DOMINIO/auth/callback` y `https://DOMINIO/auth/callback?tipo=recuperar`; para desarrollo, sus equivalentes en localhost:3000. Validar con los patrones admitidos por Supabase.
- Habilitar email/password y verificación de correo. Configurar SMTP cuando se requiera envío operativo a usuarios reales.
- En Vercel, comprobar que el proyecto corresponde a `davidramirez17/Truper`. La raíz del repositorio es `app` en este checkout local, pero en GitHub sus archivos están en la raíz: no asignar un Root Directory `app` si no existe allí.
- Framework Next.js, Node compatible con dependencias, instalación `npm ci`, build `npm run build`.
- Añadir las dos variables públicas a los entornos de Vercel que correspondan y desplegar. Las variables públicas se incorporan al build; cambiarlas requiere un nuevo despliegue.
- No añadir la clave secreta del bootstrap a Vercel. No se necesita para la app.

## 5. Verificación de activación

- Sin sesión: dashboard y módulos redirigen a login, incluso con `?modo=demo` o `?modo=local`.
- Cuenta nueva: confirmación y estado pendiente; ningún proyecto visible.
- Titular: rol Superusuario y acceso a Usuarios.
- Crear un proyecto real, validar el Excel aprobado y guardar; comprobar registros, KPIs e historial tras recargar y desde una segunda sesión autorizada.
- Repetir la carga con el mismo identificador: un solo lote. Una nueva carga deliberada conserva el lote anterior y actualiza la versión activa.
- Analista/consulta: acceder únicamente a proyectos asignados; suspensión retira acceso con sesión vigente.
- Recuperación de contraseña: correo, callback y cambio completados en el dominio configurado.

Solo después de estas verificaciones se considera activada la integración en producción.
