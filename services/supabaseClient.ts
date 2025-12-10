
import { createClient } from '@supabase/supabase-js';

// Konfiguracja Supabase
// Używamy zmiennych przekazanych przez użytkownika jako domyślnych wartości.
// W środowisku produkcyjnym (np. Vercel/Netlify) powinny one być wczytywane z .env.

// Adres URL Twojej bazy danych Supabase
const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || 
                     (import.meta as any).env?.NEXT_PUBLIC_SUPABASE_URL || 
                     'https://beaxanpegzxkwqsxovcn.supabase.co';

// Klucz publiczny (anon) - bezpieczny do użycia w przeglądarce
const SUPABASE_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 
                     (import.meta as any).env?.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || 
                     'sb_publishable_bYFus6YWrbBsDFhGEFPpFQ_Xog_WVgx';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export const isSupabaseConfigured = () => {
  return SUPABASE_URL !== '' && SUPABASE_KEY !== '';
};
