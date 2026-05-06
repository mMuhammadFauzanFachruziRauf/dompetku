import { createClient } from "@supabase/supabase-js";

// Ambil dari file .env.local
const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "❌ VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY belum diisi di file .env.local"
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey);