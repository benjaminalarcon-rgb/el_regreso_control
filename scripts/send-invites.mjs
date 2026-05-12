import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://oceptenxyaktitmszcms.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jZXB0ZW54eWFrdGl0bXN6Y21zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyNTI5OTYsImV4cCI6MjA5MzgyODk5Nn0.gD1JhoV8i3GcWWKfgoup2Mg6WF23V7ERFL_1pFEsS8A'
const APP_URL = 'https://el-regreso-web.vercel.app'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

const usuarios = [
  { email: 'claudio.heufemann@elregresobeer.com', nombre: 'Claudio H.' },
  { email: 'benjamin.alarcon@elregresobeer.com',  nombre: 'Benjamin A.' },
  { email: 'carlos.urrejola@elregresobeer.com',   nombre: 'Carlos U.' },
  { email: 'javier@elregresobeer.com',             nombre: 'Javier B.' },
  { email: 'logistica@elregresobeer.com',          nombre: 'Jorge A.' },
  { email: 'elizabeth@elregresobeer.com',          nombre: 'Ely A.' },
]

for (const u of usuarios) {
  const { error } = await supabase.auth.signInWithOtp({
    email: u.email,
    options: {
      emailRedirectTo: APP_URL,
      shouldCreateUser: false,
    },
  })

  if (error) {
    console.error(`✗ ${u.nombre} (${u.email}): ${error.message}`)
  } else {
    console.log(`✓ Link enviado → ${u.nombre} (${u.email})`)
  }

  // Pausa para respetar rate limit de Supabase
  await new Promise(r => setTimeout(r, 1500))
}

console.log('\nListo. Cada usuario recibe un email con su link de acceso directo.')
