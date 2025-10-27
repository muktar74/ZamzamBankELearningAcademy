import { createClient } from '@supabase/supabase-js';

// The Supabase URL and anonymous key are configured here.
// In a production environment, these should be moved to environment variables.
const supabaseUrl = 'https://fpffhshknnjfukxljryv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwZmZoc2hrbm5qZnVreGxqcnl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1NDIyMjcsImV4cCI6MjA3NzExODIyN30.t7XeZXxGjErP2w-JYLeSzfpmLqQLj0sriFgwp0V-bVI';

/**
 * A flag to check if the Supabase configuration is present.
 */
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

/**
 * The Supabase client instance.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
