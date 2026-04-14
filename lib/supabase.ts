
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Define a type for your database schema if you have one, or use a generic 'any'
// For example, if you generated types from your database:
// import { Database } from './database.types';
// const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

let supabase: any;

if (supabaseUrl && supabaseAnonKey) {
  // If you have a specific Database type, use it here:
  // supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
  console.warn("Supabase URL or Anon Key is missing. The app will use a dummy client. Please check your .env.local file.");
  
  // Dummy client to prevent crashing
  supabase = {
    from: () => ({
      select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: new Error('Dummy client') }) }), in: () => Promise.resolve({ data: [], error: new Error('Dummy client') }), ilike: () => ({ limit: () => Promise.resolve({ data: [], error: new Error('Dummy client') }) }), contains: () => Promise.resolve({ data: [], error: new Error('Dummy client') }) }),
      insert: () => Promise.resolve({ data: null, error: new Error('Dummy client') }),
      update: () => ({ eq: () => Promise.resolve({ data: null, error: new Error('Dummy client') }) }),
      delete: () => ({ eq: () => Promise.resolve({ error: new Error('Dummy client') }) }),
      upsert: () => Promise.resolve({ data: null, error: new Error('Dummy client') }),
    }),
    auth: {
      signInWithPassword: () => Promise.resolve({ data: { user: null, session: null }, error: new Error('Dummy client') }),
      signUp: () => Promise.resolve({ data: { user: null, session: null }, error: new Error('Dummy client') }),
      signOut: () => Promise.resolve({ error: null }),
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      resetPasswordForEmail: () => Promise.resolve({ data: null, error: new Error('Dummy client') }),
      updateUser: () => Promise.resolve({ data: { user: null }, error: new Error('Dummy client') }),
    },
    storage: {
        from: () => ({
            upload: () => Promise.resolve({ data: null, error: new Error('Dummy client') }),
            getPublicUrl: () => ({ data: { publicUrl: '' } }),
        })
    }
  };
}

export { supabase };
