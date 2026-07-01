import { createClient } from "@supabase/supabase-js";

export const supabaseUrl = "https://uvplcqmbeyyjighhzdsq.supabase.co";
const supabaseAnonKey = "sb_publishable__6fPWpZZFM1_joQV0IUyjA_smLAMJlO";

console.log("SUPABASE_URL_ATIVA =", supabaseUrl);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
