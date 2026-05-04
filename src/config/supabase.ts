/**
 * Supabase Configuration
 *
 * This file creates the Supabase client. SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY
 * are read from the root config.ts (single source of truth).
 *
 * Note: The publishable key is safe to expose in the frontend as it's public.
 * Row Level Security (RLS) policies should be configured in Supabase to control access.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from '../../config';

/**
 * Validates that Supabase configuration is set
 * 
 * @returns True if configuration is valid, false otherwise
 */
function validateConfig(): boolean {
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    console.warn(
      'Supabase configuration is missing. Please set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY in config.ts'
    );
    return false;
  }
  return true;
}

/**
 * Creates and returns a Supabase client instance
 * 
 * @returns Supabase client instance, or null if configuration is invalid
 */
function createSupabaseClient(): SupabaseClient | null {
  if (!validateConfig()) {
    return null;
  }

  return createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  });
}

/**
 * Singleton Supabase client instance
 * Created once and reused throughout the application
 */
export const supabase: SupabaseClient | null = createSupabaseClient();

/**
 * Checks if Supabase is properly configured and available
 * 
 * @returns True if Supabase client is available, false otherwise
 */
export function isSupabaseConfigured(): boolean {
  return supabase !== null;
}
