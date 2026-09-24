import { createClient } from '@supabase/supabase-js';

// Run once, after migration and after the owner has registered and confirmed email.
// Credentials are read only from the local environment and never printed.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;
const email = process.env.TRUPER_OWNER_EMAIL?.trim().toLowerCase();
if (!url || !secret || !email) {
  console.error('Configura NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY y TRUPER_OWNER_EMAIL en .env.local.');
  process.exit(1);
}
const client = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
let owner;
for (let page=1;page<=100;page++) {
  const {data,error}=await client.auth.admin.listUsers({page,perPage:100});
  if(error){console.error('No fue posible consultar las cuentas. Revisa la conexión y la clave de servidor.');process.exit(1);}
  owner=data.users.find(user=>user.email?.toLowerCase()===email);
  if(owner||data.users.length<100)break;
}
if(!owner?.email_confirmed_at){console.error('El titular debe registrarse y confirmar ese correo antes de recibir acceso.');process.exit(1);}
const {data,error}=await client.from('truper_profiles').update({role:'superadmin',status:'active'}).eq('id',owner.id).select('id,role,status').single();
if(error||data?.role!=='superadmin'){console.error('No se pudo activar al titular. Comprueba que la migración esté aplicada.');process.exit(1);}
console.log('Cuenta verificada y habilitada como superusuario. Retira SUPABASE_SECRET_KEY del entorno local cuando termines.');
