import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://uvplcqmbeyyjighhzdsq.supabase.co";
const supabaseAnonKey = sb_publishable__6fPWpZZFM1_joQV0IUyjA_smLAMJlO;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
