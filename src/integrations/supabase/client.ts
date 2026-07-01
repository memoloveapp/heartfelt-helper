import { createClient } from "@supabase/supabase-js";

export const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ?? "https://uvplcqmbeyyjighhzdsq.supabase.co";
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  "sb_publishable__6fPWpZZFM1_joQV0IUyjA_smLAMJlO";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
