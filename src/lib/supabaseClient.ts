import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env, hasSupabaseConfig } from '../config/env';

export const supabase: SupabaseClient | null = hasSupabaseConfig
  ? createClient(env.supabaseUrl!, env.supabaseAnonKey!)
  : null;