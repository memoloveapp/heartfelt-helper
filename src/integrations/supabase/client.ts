import { createClient } from "@supabase/supabase-js";

// Hard-coded para o Supabase EXTERNO (uvplcqmbeyyjighhzdsq).
// Não usar VITE_SUPABASE_* pois o .env é regerado pelo Lovable Cloud.
export const supabaseUrl = "https://uvplcqmbeyyjighhzdsq.supabase.co";
const supabaseAnonKey = "sb_publishable__6fPWpZZFM1_joQV0IUyjA_smLAMJlO";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
