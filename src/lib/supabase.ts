import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: { 
    schema: 'public' // Use public schema (default)
  },
  auth: {
    persistSession: false // We don't need user authentication for analytics
  },
  realtime: {
    params: {
      eventsPerSecond: 10 // Limit real-time events for free tier
    }
  }
});

// Test connection utility
export async function testSupabaseConnection(): Promise<boolean> {
  try {
    // Simple test query
    const { count, error } = await supabase
      .from('visitors')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error('Supabase connection test failed:', error);
      return false;
    }
    
    console.log('✅ Supabase connection successful, visitor count:', count);
    return true;
  } catch (err) {
    console.error('❌ Supabase connection failed:', err);
    return false;
  }
}