import { createClient } from "@supabase/supabase-js";

export const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ?? "https://raktquxbmnhesrizurcx.supabase.co";
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  "sb_publishable_1c0PQOzDSBfOo09HRpX6zg_bHoA_QQb";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
