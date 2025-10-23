
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

/**
 * A flag to check if the Supabase environment variables are properly configured.
 * The app will render an error message if this is false.
 */
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

/**
 * The Supabase client.
 * Note: It is initialized with placeholder values if the environment variables are missing.
 * This allows the application to load and display a configuration error message
 * instead of crashing outright. The `isSupabaseConfigured` flag should be checked first.
 */
export const supabase = createClient(
    supabaseUrl || 'https://satxmyglviontwnidipp.supabase.co',
    supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhdHhteWdsdmlvbnR3bmlkaXBwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyMDM0MjEsImV4cCI6MjA3Njc3OTQyMX0.sUg7p-R3y95RNxpFHEz2w31eF9OkgJDg2bNlKQQZXGE'
);
