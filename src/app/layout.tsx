import type { Metadata, Viewport } from 'next'
import './globals.css'
import SwRegister from '@/components/ui/SwRegister'

export const metadata: Metadata = {
  title: 'El Regreso Control',
  description: 'Sistema Operativo Ejecutivo — Cervecería El Regreso',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'RC Control' },
}

export const viewport: Viewport = {
  themeColor: '#D4AF37',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full">
      <head>
        <link rel="apple-touch-icon" href="/logo.png" />
        {/* Leer preferencia de tema antes del primer paint para evitar flash */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function(){
            try {
              if (window.location.pathname === '/login') return;
              var t = localStorage.getItem('rc-theme');
              if (t === 'light') document.documentElement.setAttribute('data-theme', 'light');
            } catch(e) {}
          })();
        `}} />
      </head>
      <body className="h-full bg-[#080808] text-[#F0EAD6]">
        {children}
        <SwRegister />
      </body>
    </html>
  )
}
