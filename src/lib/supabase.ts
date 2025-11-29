import { createClient } from '@supabase/supabase-js';

export function getSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string | undefined;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase environment variables are not set. Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
  }
  return createClient(supabaseUrl, supabaseAnonKey);
}

/**
 * Get Supabase client with service role key for admin operations
 * This bypasses RLS policies and should only be used in admin API routes
 */
export function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string | undefined;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    // Fallback to anon key if service role key is not set (for development)
    console.warn('SUPABASE_SERVICE_ROLE_KEY not set, falling back to anon key. Admin operations may fail due to RLS.');
    return getSupabase();
  }
  
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}


