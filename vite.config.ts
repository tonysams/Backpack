import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // loadEnv reads .env files at config time (empty prefix = load everything).
  // process.env takes priority so Netlify's injected SUPABASE_URL wins in production.
  const env = loadEnv(mode, process.cwd(), '')

  const supabaseUrl = process.env.SUPABASE_URL      ?? env.SUPABASE_URL      ?? env.VITE_SUPABASE_URL      ?? ''
  const supabaseKey = process.env.SUPABASE_ANON_KEY ?? env.SUPABASE_ANON_KEY ?? env.VITE_SUPABASE_ANON_KEY ?? ''

  return {
    plugins: [react()],
    define: {
      'import.meta.env.VITE_SUPABASE_URL':      JSON.stringify(supabaseUrl),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(supabaseKey),
    },
  }
})
