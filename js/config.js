/**
 * WhiteBin — Supabase configuration
 *
 * 1. Create a project at https://supabase.com
 * 2. Run supabase/schema.sql in the SQL Editor
 * 3. Paste your Project URL and anon (public) key below
 */
window.WHITEBIN_CONFIG = {
  supabaseUrl: "",
  supabaseAnonKey: "",
};

window.isSupabaseConfigured = function () {
  const { supabaseUrl, supabaseAnonKey } = window.WHITEBIN_CONFIG;
  return Boolean(supabaseUrl && supabaseAnonKey);
};
