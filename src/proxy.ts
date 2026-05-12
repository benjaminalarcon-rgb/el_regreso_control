import { NextResponse, type NextRequest } from 'next/server'

const PROJECT_REF = 'oceptenxyaktitmszcms'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Rutas públicas que no requieren auth
  if (pathname.startsWith('/api/')) return NextResponse.next()
  if (pathname === '/login') return NextResponse.next()

  // Detectar sesión activa por cookie de Supabase
  const cookies = request.cookies.getAll()
  const hasSession = cookies.some(c => c.name.startsWith(`sb-${PROJECT_REF}-auth-token`))

  // Solo redirigir al login si definitivamente no hay cookie
  // El login → / lo maneja el cliente después de autenticarse exitosamente
  // (evita loop infinito cuando la cookie existe pero la sesión expiró)
  if (!hasSession && pathname !== '/login') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
