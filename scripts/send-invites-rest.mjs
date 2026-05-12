import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://oceptenxyaktitmszcms.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jZXB0ZW54eWFrdGl0bXN6Y21zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyNTI5OTYsImV4cCI6MjA5MzgyODk5Nn0.gD1JhoV8i3GcWWKfgoup2Mg6WF23V7ERFL_1pFEsS8A'
)

const restantes = [
  { email: 'carlos.urrejola@elregresobeer.com', nombre: 'Carlos U.' },
  { email: 'javier@elregresobeer.com',           nombre: 'Javier B.' },
  { email: 'logistica@elregresobeer.com',        nombre: 'Jorge A.' },
  { email: 'elizabeth@elregresobeer.com',        nombre: 'Ely A.' },
]

for (const u of restantes) {
  process.stdout.write(`Enviando a ${u.nombre}... `)
  const { error } = await supabase.auth.signInWithOtp({
    email: u.email,
    options: { emailRedirectTo: 'https://el-regreso-web.vercel.app', shouldCreateUser: false },
  })
  if (error) {
    console.log(`✗ ${error.message}`)
  } else {
    console.log('✓ enviado')
  }
  await new Promise(r => setTimeout(r, 3000))
}
