const readEnv = (key: string): string | undefined => {
  const value = import.meta.env[key];
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
};

export const env = {
  apiBaseUrl: readEnv('VITE_API_BASE_URL') || '/api/v1',
  supabaseUrl: readEnv('VITE_SUPABASE_URL'),
  supabaseAnonKey: readEnv('VITE_SUPABASE_ANON_KEY'),
};

export const hasSupabaseConfig = Boolean(env.supabaseUrl && env.supabaseAnonKey);