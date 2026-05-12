import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://oceptenxyaktitmszcms.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jZXB0ZW54eWFrdGl0bXN6Y21zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyNTI5OTYsImV4cCI6MjA5MzgyODk5Nn0.gD1JhoV8i3GcWWKfgoup2Mg6WF23V7ERFL_1pFEsS8A'
)

const { data, error } = await supabase.auth.signInWithPassword({
  email: 'benjamin.alarcon@elregresobeer.com',
  password: 'ElRegreso2026!'
})

if (error) {
  console.error('ERROR:', error.message, '| Status:', error.status, '| Code:', error.code)
} else {
  console.log('LOGIN OK — user:', data.user.email)
}
