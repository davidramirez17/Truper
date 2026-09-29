# Activación de Supabase y Vercel

Este documento es un checklist operativo. La IA prepara evidencia y comandos; una persona con acceso a los proyectos confirma y ejecuta cambios en servicios compartidos.

## Supabase

- [x] Confirmar que el proyecto configurado en `.env.local` responde.
- [x] Comprobar por REST que existen `truper_profiles`, `truper_projects`, `truper_project_members`, `truper_imports`, `truper_sales_rows` y `truper_audit`.
- [x] Comprobar que `truper_create_project` existe y queda bloqueado para el rol anónimo.
- [ ] Consultar el historial de migraciones o ejecutar `supabase db push` con una cuenta administrativa enlazada. La comprobación pública no expone ese historial; no se debe volver a ejecutar la migración a ciegas.
- [ ] Crear/verificar el usuario inicial sin asignar privilegios desde el navegador.
- [ ] Confirmar el correo y elevar el perfil mediante el procedimiento autorizado.
- [ ] Probar RLS con superusuario, analista, consulta y cuenta ajena.
- [ ] Probar importación válida, archivo inválido, reintento e importación que falla a mitad.

**Evidencia local 2026-09-28:** la API respondió `permission denied` para las seis tablas al usar la clave pública. Ese resultado confirma que las relaciones existen y que no están abiertas al rol anónimo. El RPC de creación también respondió con bloqueo de autorización. Para afirmar que la migración exacta está registrada en el historial de Supabase todavía se necesita una sesión administrativa o el enlace de la CLI.

## Variables

En `.env.local`/Vercel:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY   # solo scripts server-side autorizados
SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASSWORD / ALERT_API_TOKEN
```

Nunca exponer `SUPABASE_SERVICE_ROLE_KEY` en cliente ni commitear secretos.

## Vercel

- [ ] Conectar el repositorio y la rama de despliegue acordada.
- [ ] Cargar variables por entorno.
- [ ] Ejecutar build de producción.
- [ ] Probar callback de Auth, cookies, rutas protegidas y endpoint de alertas.
- [ ] Registrar URL, commit y resultado en `docs/bitacora.md`.
