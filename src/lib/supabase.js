import { createClient } from "@supabase/supabase-js";

// Ambil dari file .env.local
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey || supabaseUrl.includes("undefined")) {
  console.error("Missing Supabase Env Vars. Build-time values:", { url: supabaseUrl, key: supabaseKey ? "***" : undefined });
  throw new Error(
    "❌ VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY belum diisi. Jika deploy ke Cloud Run, pastikan variabel ini di-pass sebagai Build Args (--build-arg) di Dockerfile atau cloudbuild.yaml saat proses build."
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey);
