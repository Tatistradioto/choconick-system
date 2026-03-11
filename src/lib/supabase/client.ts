import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim();
  const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '').trim();
  if (!url || url.includes('seu-projeto')) {
    throw new Error(
      'Supabase não configurado. Edite o arquivo .env.local e preencha NEXT_PUBLIC_SUPABASE_URL (ex.: https://seu-projeto.supabase.co).'
    );
  }
  if (!key || key.includes('sua-anon-key')) {
    throw new Error(
      'Supabase não configurado. Edite o arquivo .env.local e preencha NEXT_PUBLIC_SUPABASE_ANON_KEY com a chave do projeto (Settings > API).'
    );
  }
  return createBrowserClient(url, key);
}
