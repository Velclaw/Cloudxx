import { createClient } from '@supabase/supabase-js';

// Supabase publishable keys are designed for browser use. Database access is
// protected by the RLS policies in supabase/migrations/202610300001_profiles.sql.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mupyxggommsmijvdjdkm.supabase.co';
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_Ny3tyIkE_Fs-5Yxm3oyktA_VzQfChiy';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey);

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
