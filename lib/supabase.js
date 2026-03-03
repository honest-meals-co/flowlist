import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    '❌ SUPABASE ENV VARS MISSING!\n' +
    'NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓ set' : '✗ MISSING', '\n' +
    'NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? '✓ set' : '✗ MISSING', '\n' +
    'Make sure your .env.local file exists and has both values.\n' +
    'Then RESTART the dev server (Ctrl+C, then npm run dev).'
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder'
);
