import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { mockSupabase } from './mockClient';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Detect if we should use Mock Mode (missing keys, placeholder text, or explicit local storage override)
const IS_MOCK_MODE =
  !SUPABASE_URL ||
  !SUPABASE_ANON_KEY ||
  SUPABASE_URL.includes("placeholder") ||
  SUPABASE_URL.includes("your-project") ||
  localStorage.getItem("use_mock_supabase") === "true";

if (IS_MOCK_MODE) {
  console.warn("⚠️ Running in Supabase Mock Mode. Database and AI Edge Functions are simulated locally.");
}

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = IS_MOCK_MODE
  ? (mockSupabase as any)
  : createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);

