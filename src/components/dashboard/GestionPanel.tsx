'use client'

import { useState, useEffect } from 'react'
import { RcTask, AREA_CFG, MACRO_AREAS, MacroKey } from '@/lib/types'
import {
  calcAreaKpis,
  calcSemaphoreDistribution,
  calcNetProductivity,
  SEMAPHORE_HEX,
  AreaKpi,
} from '@/lib/kpis'

const ALL_AREAS = (Object.values(MACRO_AREAS) as typeof MACRO_AREAS[MacroKey][])
  .flatMap(m => [...m.areas])

interface Props {
  tasks: RcTask[]
}

function SemCell({ value, color }: { value: number; color: string }) {
  if (value === 0) return <span style={{ color: 'rgba(128,128,128,0.3)', fontSize: 13 }}>—</span>
  return (
    <span style={{
      fontSize: 13, fontWeight: 700, color,
      background: `${color}15`, borderRadius: 8,
      padding: '2px 8px', display: 'inline-block',
    }}>{value}</span>
  )
}

function RiskBar({ red, yellow, green, blue, total }: { red: number; yellow: number; green: number; blue: number; total: number }) {
  if (total === 0) return <div style={{ height: 4, background: 'rgba(128,128,128,0.1)', borderRadius: 4 }} />
  return (
    <div style={{ display: 'flex', height: 4, borderRadius: 4, overflow: 'hidden', gap: 1 }}>
      {red > 0    && <div style={{ flex: red,    background: SEMAPHORE_HEX.red    }} />}
      {yellow > 0 && <div style={{ flex: yellow, background: SEMAPHORE_HEX.yellow }} />}
      {green > 0  && <div style={{ flex: green,  background: SEMAPHORE_HEX.green  }} />}
      {blue > 0   && <div style={{ flex: blue,   background: SEMAPHORE_HEX.blue   }} />}
    </div>
  )
}

function KpiCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div style={{
      background: 'var(--surface2)', border: '1px solid var(--border)',
      borderRadius: 14, padding: '14px 16px', flex: 1, minWidth: 0,
    }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--muted)', letterSpacing: 1.6, textTransform: 'uppercase', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 900, lineHeight: 1, color: color ?? 'var(--cream)', letterSpacing: -1 }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 5 }}>{sub}</div>}
    </div>
  )
}

export default function GestionPanel({ tasks }: Props) {
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({})
  const [loadingCounts, setLoadingCounts] = useState(true)

  useEffect(() => {
    fetch('/api/analytics')
      .then(r => r.json())
      .then(d => { setCommentCounts(d ?? {}); setLoadingCounts(false) })
      .catch(() => setLoadingCounts(false))
  }, [])

  const dist     = calcSemaphoreDistribution(tasks.filter(t => t.area !== 'Mi Cerebro'))
  const netProd  = calcNetProductivity(tasks)
  const areaKpis = calcAreaKpis(tasks, ALL_AREAS).map(kpi => ({
    ...kpi,
    pimponeo: tasks
      .filter(t => t.area === kpi.area)
      .reduce((sum, t) => sum + (commentCounts[t.id] ?? 0), 0) /
      Math.max(tasks.filter(t => t.area === kpi.area).length, 1),
  }))

  // Sort by risk: red first, then yellow
  const sorted = [...areaKpis].sort((a, b) =>
    b.red - a.red || b.yellow - a.yellow
  )

  const totalActive = dist.red + dist.yellow + dist.green
  const semItems = [
    { color: SEMAPHORE_HEX.red,    label: 'Vencidas / Urgentes', count: dist.red,    key: 'red' },
    { color: SEMAPHORE_HEX.yellow, label: 'Próximas (1-3 días)',  count: dist.yellow, key: 'yellow' },
    { color: SEMAPHORE_HEX.green,  label: 'En tiempo (> 3 días)', count: dist.green,  key: 'green' },
    { color: SEMAPHORE_HEX.blue,   label: 'Completadas',          count: dist.blue,   key: 'blue' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Header */}
      <div>
        <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--gold)', letterSpacing: 2.2, textTransform: 'uppercase', marginBottom: 6 }}>
          Panel de Control
        </div>
        <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--cream)', letterSpacing: -0.8, lineHeight: 1 }}>
          Reporte de Gestión
        </div>
        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 5 }}>
          {dist.total} tareas totales · {totalActive} activas
        </div>
      </div>

      {/* Semaphore distribution */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: '20px 20px 18px' }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--muted)', letterSpacing: 1.8, textTransform: 'uppercase', marginBottom: 14 }}>
          Distribución Semáforo
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
          {semItems.map(s => (
            <div key={s.key} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: `${s.color}10`, border: `1px solid ${s.color}25`,
              borderRadius: 12, padding: '12px 14px',
            }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.color, flexShrink: 0, boxShadow: `0 0 8px ${s.color}60` }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 9, color: 'var(--muted)', letterSpacing: 0.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.label}</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: s.color, lineHeight: 1.1, letterSpacing: -0.8 }}>
                  {s.count}
                </div>
              </div>
              {totalActive > 0 && s.key !== 'blue' && (
                <div style={{ fontSize: 11, fontWeight: 700, color: s.color, opacity: 0.7 }}>
                  {Math.round((s.count / dist.total) * 100)}%
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Weekly productivity */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: '20px 20px 18px' }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--muted)', letterSpacing: 1.8, textTransform: 'uppercase', marginBottom: 14 }}>
          Productividad Semanal
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <KpiCard
            label="Creadas"
            value={netProd.created}
            sub="esta semana"
            color="var(--cream)"
          />
          <KpiCard
            label="Cerradas"
            value={netProd.closed}
            sub="esta semana"
            color={netProd.closed >= netProd.created ? '#4A7A3A' : '#E67E22'}
          />
          <KpiCard
            label="Balance"
            value={netProd.balance >= 0 ? `+${netProd.balance}` : `${netProd.balance}`}
            sub={netProd.ratio > 0 ? `ratio ${netProd.ratio}x` : 'sin cierres'}
            color={netProd.balance >= 0 ? '#4A7A3A' : '#DC2626'}
          />
        </div>
      </div>

      {/* Area ranking */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: '20px 20px 18px' }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--muted)', letterSpacing: 1.8, textTransform: 'uppercase', marginBottom: 4 }}>
          Ranking de Áreas · Riesgo
        </div>
        <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 16 }}>
          Ordenado por tareas vencidas o urgentes
        </div>

        {/* Column headers */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 36px 36px 36px 36px 52px 52px',
          gap: 6, padding: '0 4px 8px',
          borderBottom: '1px solid rgba(128,128,128,0.1)',
          marginBottom: 8,
        }}>
          {['Área', '🔴', '🟡', '🟢', '🔵', 'OTCR', 'Desv.'].map((h, i) => (
            <div key={i} style={{
              fontSize: 8, fontWeight: 700, color: 'var(--muted)',
              letterSpacing: 0.8, textAlign: i > 0 ? 'center' : 'left',
            }}>{h}</div>
          ))}
        </div>

        {sorted.filter(a => a.total > 0).map((kpi, idx) => {
          const cfg = AREA_CFG[kpi.area]
          const otcrColor = kpi.otcr >= 80 ? '#4A7A3A' : kpi.otcr >= 60 ? '#D97706' : '#DC2626'
          return (
            <div key={kpi.area} style={{
              display: 'flex', flexDirection: 'column', gap: 5,
              padding: '10px 4px',
              borderBottom: idx < sorted.filter(a => a.total > 0).length - 1 ? '1px solid rgba(128,128,128,0.06)' : 'none',
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 36px 36px 36px 36px 52px 52px',
                gap: 6, alignItems: 'center',
              }}>
                {/* Area name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                    background: `${cfg?.color ?? '#888'}18`, border: `1px solid ${cfg?.color ?? '#888'}30`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 7, fontWeight: 800, color: cfg?.color ?? '#888',
                  }}>
                    {cfg?.code ?? '?'}
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 700, color: 'var(--cream)',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>{kpi.area}</span>
                </div>
                {/* Semaphore cells */}
                <div style={{ textAlign: 'center' }}><SemCell value={kpi.red}    color={SEMAPHORE_HEX.red}    /></div>
                <div style={{ textAlign: 'center' }}><SemCell value={kpi.yellow} color={SEMAPHORE_HEX.yellow} /></div>
                <div style={{ textAlign: 'center' }}><SemCell value={kpi.green}  color={SEMAPHORE_HEX.green}  /></div>
                <div style={{ textAlign: 'center' }}><SemCell value={kpi.blue}   color={SEMAPHORE_HEX.blue}   /></div>
                {/* OTCR */}
                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: otcrColor }}>
                    {kpi.otcr > 0 ? `${kpi.otcr}%` : '—'}
                  </span>
                </div>
                {/* Deviation */}
                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: 12, color: kpi.deviationAvg > 0 ? '#E67E22' : 'rgba(128,128,128,0.3)' }}>
                    {kpi.deviationAvg > 0 ? `${kpi.deviationAvg}R` : '—'}
                  </span>
                </div>
              </div>
              {/* Risk mini-bar */}
              <RiskBar red={kpi.red} yellow={kpi.yellow} green={kpi.green} blue={kpi.blue} total={kpi.total} />
            </div>
          )
        })}

        {sorted.filter(a => a.total > 0).length === 0 && (
          <div style={{ textAlign: 'center', padding: '24px 0', fontSize: 12, color: 'var(--muted)' }}>
            Sin datos disponibles
          </div>
        )}
      </div>

      {/* Pimponeo ranking */}
      {!loadingCounts && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: '20px 20px 18px' }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--muted)', letterSpacing: 1.8, textTransform: 'uppercase', marginBottom: 4 }}>
            Ratio de Pimponeo
          </div>
          <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 16 }}>
            Comentarios promedio por tarea por área
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[...areaKpis]
              .filter(a => a.total > 0)
              .sort((a, b) => b.pimponeo - a.pimponeo)
              .slice(0, 8)
              .map(kpi => {
                const cfg = AREA_CFG[kpi.area]
                const maxPimponeo = Math.max(...areaKpis.map(a => a.pimponeo), 1)
                const barWidth = Math.round((kpi.pimponeo / maxPimponeo) * 100)
                const color = kpi.pimponeo >= 3 ? '#DC2626' : kpi.pimponeo >= 1.5 ? '#D97706' : '#4A7A3A'
                return (
                  <div key={kpi.area} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 20, height: 20, borderRadius: 6, flexShrink: 0, background: `${cfg?.color ?? '#888'}18`, border: `1px solid ${cfg?.color ?? '#888'}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, fontWeight: 800, color: cfg?.color ?? '#888' }}>
                      {cfg?.code ?? '?'}
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--muted)', width: 90, flexShrink: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{kpi.area}</span>
                    <div style={{ flex: 1, height: 6, background: 'rgba(128,128,128,0.1)', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${barWidth}%`, background: color, borderRadius: 4, transition: 'width 0.4s ease' }} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color, width: 32, textAlign: 'right', flexShrink: 0 }}>
                      {kpi.pimponeo.toFixed(1)}
                    </span>
                  </div>
                )
              })
            }
          </div>
        </div>
      )}

    </div>
  )
}
