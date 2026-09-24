import { AuthShell } from '@/modules/auth/AuthShell';
import { supabaseConfig } from '@/lib/supabase/config';
export default function Register() { return <AuthShell mode="register" configured={!!supabaseConfig()} />; }
