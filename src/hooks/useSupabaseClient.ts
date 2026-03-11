"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";

export function useSupabaseClient(): {
  supabase: SupabaseClient | null;
  error: string | null;
} {
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      setSupabase(createClient());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Supabase não configurado.");
    }
  }, []);

  return { supabase, error };
}
