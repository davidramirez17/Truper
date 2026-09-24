import { AuthShell } from '@/modules/auth/AuthShell';
import { supabaseConfig } from '@/lib/supabase/config';
export default function Recover() { return <AuthShell mode="recover" configured={!!supabaseConfig()} />; }
