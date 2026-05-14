'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Logo from '@/components/ui/Logo'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Login siempre en modo oscuro
  useEffect(() => {
    document.documentElement.removeAttribute('data-theme')
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) {
      setError('Credenciales incorrectas. Verifica tu email y contraseña.')
      setLoading(false)
      return
    }
    window.location.href = '/'
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 10, fontWeight: 700, color: '#6B6460',
    letterSpacing: 1.6, textTransform: 'uppercase', display: 'block', marginBottom: 8,
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-5" style={{ background: '#080808' }}>
      <div className="w-full max-w-sm fade-in">

        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <Logo size={140} />
          </div>
          <h1 style={{ fontFamily: 'system-ui', fontWeight: 900, fontSize: 20, color: '#D4AF37', letterSpacing: 1.5 }}>
            EL REGRESO CONTROL
          </h1>
          <p style={{ fontSize: 10, color: '#4A4540', letterSpacing: 2.5, marginTop: 5 }}>
            SISTEMA OPERATIVO EJECUTIVO
          </p>
        </div>

        <div style={{ background: '#111', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 18, padding: '28px 24px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            <div>
              <label style={labelStyle}>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tu@elregresobeer.com"
                required
                autoComplete="email"
                style={{ fontSize: 15, padding: '13px 16px', borderRadius: 12, color: '#F0EAD6' }}
              />
            </div>

            <div>
              <label style={labelStyle}>Contraseña</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  style={{ fontSize: 15, padding: '13px 48px 13px 16px', borderRadius: 12, color: '#F0EAD6', width: '100%' }}
                />
                <button type="button" onClick={() => setShowPassword(v => !v)} tabIndex={-1}
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: showPassword ? '#D4AF37' : '#4A4540', transition: 'color 0.15s' }}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                  {showPassword ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            {error && (
              <p style={{ fontSize: 12, color: '#FF7070', padding: '10px 14px', background: 'rgba(255,68,68,0.08)', borderRadius: 10, border: '1px solid rgba(255,68,68,0.2)', lineHeight: 1.5 }}>
                {error}
              </p>
            )}

            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '14px', borderRadius: 12, cursor: loading ? 'default' : 'pointer',
              background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.4)',
              color: '#D4AF37', fontSize: 13, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase',
              opacity: loading ? 0.5 : 1, transition: 'opacity 0.15s',
            }}>
              {loading ? 'Verificando...' : 'Ingresar al Sistema'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: 10, color: '#2A2520', marginTop: 20, letterSpacing: 1 }}>
          Acceso restringido — Cervecería El Regreso
        </p>
      </div>
    </div>
  )
}
