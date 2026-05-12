'use client'

import { RcTask, AREA_CFG, STATUS_CFG, TaskStatus } from '@/lib/types'
import ProgressStrip from '@/components/ui/ProgressStrip'

const STATUS_DOTS: TaskStatus[] = ['Asignada', 'En Proceso', 'Por Aprobar', 'Atrasada', 'Completada']

export default function AreaCard({ area, tasks, onClick }: { area: string; tasks: RcTask[]; onClick: () => void }) {
  const cfg = AREA_CFG[area] ?? { color: '#D4AF37', dim: '#141007', code: '??' }
  const atrasadas = tasks.filter(t => t.estado === 'Atrasada').length
  const activas = tasks.filter(t => t.estado !== 'Completada' && t.estado !== 'Rechazada').length
  const completadas = tasks.filter(t => t.estado === 'Completada').length
  const pct = tasks.length > 0 ? Math.round((completadas / tasks.length) * 100) : 0

  return (
    <div
      onClick={onClick}
      className="touch-active cursor-pointer rounded-xl"
      style={{
        background: 'var(--surface)',
        border: `1px solid ${cfg.color}20`,
        padding: '16px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Accent line */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${cfg.color}60, transparent)` }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{
          width: 34, height: 34, borderRadius: 8,
          background: cfg.dim, border: `1px solid ${cfg.color}22`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 700, color: cfg.color, flexShrink: 0,
        }}>
          {cfg.code}
        </div>
        {atrasadas > 0 && (
          <div className="pulse" style={{
            fontSize: 9, fontWeight: 700, color: '#FF4444',
            background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.25)',
            borderRadius: 10, padding: '3px 8px',
          }}>
            {atrasadas} ⚠
          </div>
        )}
        {atrasadas === 0 && pct === 100 && tasks.length > 0 && (
          <span style={{ fontSize: 14 }}>✅</span>
        )}
      </div>

      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--cream)', marginBottom: 2, letterSpacing: -0.2 }}>
        {area}
      </div>
      <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 12 }}>
        {activas} activa{activas !== 1 ? 's' : ''} · {completadas} lista{completadas !== 1 ? 's' : ''}
      </div>

      {/* Progress */}
      <ProgressStrip tasks={tasks} />

      {/* % completado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {STATUS_DOTS.map(s => {
            const count = tasks.filter(t => t.estado === s).length
            if (count === 0) return null
            return (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: STATUS_CFG[s].color }} />
                <span style={{ fontSize: 9, color: 'var(--muted)' }}>{count}</span>
              </div>
            )
          })}
        </div>
        <span style={{ fontSize: 10, fontWeight: 700, color: pct > 0 ? cfg.color : '#2A2522' }}>{pct}%</span>
      </div>
    </div>
  )
}
