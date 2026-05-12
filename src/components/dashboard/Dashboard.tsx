'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { RcTask, RcUser, AREAS, CEREBRO_AREA, AREA_CFG } from '@/lib/types'
import AreaCard from './AreaCard'
import TaskDetailModal from '@/components/modals/TaskDetailModal'
import TaskCalendar from '@/components/calendar/TaskCalendar'
import Logo from '@/components/ui/Logo'
import SettingsPanel from '@/components/ui/SettingsPanel'

interface Props {
  initialTasks: RcTask[]
  users: RcUser[]
  userName: string
  userEmail: string
  isAdmin: boolean
  currentUserId: string
}

function toLocalDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getWeekRange() {
  const now = new Date()
  const day = now.getDay()
  const diffToMon = (day === 0 ? -6 : 1 - day)
  const mon = new Date(now)
  mon.setDate(now.getDate() + diffToMon)
  const sun = new Date(mon)
  sun.setDate(mon.getDate() + 6)
  return { mon, sun, monStr: toLocalDateStr(mon), sunStr: toLocalDateStr(sun) }
}

function WeeklyProgressBar({ tasks }: { tasks: RcTask[] }) {
  const { mon, sun, monStr, sunStr } = getWeekRange()
  // Compare date strings directly to avoid UTC vs local timezone issues
  const weekTasks = tasks.filter(t =>
    t.plazo >= monStr && t.plazo <= sunStr && t.area !== CEREBRO_AREA
  )
  const completed = weekTasks.filter(t => t.estado === 'Completada').length
  const total = weekTasks.length
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100)
  const MONTHS = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']
  const monLabel = `${mon.getDate()} ${MONTHS[mon.getMonth()]}`
  const sunLabel = `${sun.getDate()} ${MONTHS[sun.getMonth()]}`
  const barColor = pct >= 80 ? '#4A7A3A' : pct >= 50 ? '#D4AF37' : '#E67E22'

  return (
    <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 18px', marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--gold)', letterSpacing: 1.8, textTransform: 'uppercase' }}>Progreso Semanal</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{monLabel} — {sunLabel}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 26, fontWeight: 900, color: barColor, lineHeight: 1 }}>{pct}%</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{completed}/{total} tareas</div>
        </div>
      </div>
      <div style={{ height: 8, background: 'rgba(128,128,128,0.15)', borderRadius: 8, overflow: 'hidden', marginBottom: 10 }}>
        <div className="progress-bar-fill" style={{ '--pct': `${pct}%`, height: '100%', background: `linear-gradient(90deg, ${barColor}80, ${barColor})`, borderRadius: 8, width: `${pct}%` } as React.CSSProperties} />
      </div>
      {total > 0 && (
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          {[
            { label: 'Completadas', count: completed, color: '#4A7A3A' },
            { label: 'Pendientes', count: weekTasks.filter(t => t.estado !== 'Completada' && t.estado !== 'Atrasada').length, color: '#7BA8C4' },
            { label: 'Atrasadas', count: weekTasks.filter(t => t.estado === 'Atrasada').length, color: '#FF6B6B' },
          ].filter(s => s.count > 0).map(s => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: s.color }} />
              <span style={{ fontSize: 11, color: 'var(--muted)' }}>{s.count} {s.label.toLowerCase()}</span>
            </div>
          ))}
        </div>
      )}
      {total === 0 && <div style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center', paddingTop: 4 }}>Sin tareas con plazo esta semana</div>}
    </div>
  )
}

type View = 'home' | 'mis-tareas' | 'calendar'

export default function Dashboard({ initialTasks, users, userName, userEmail, isAdmin, currentUserId }: Props) {
  const router = useRouter()
  const [tasks, setTasks] = useState(initialTasks)
  const [selectedTask, setSelectedTask] = useState<RcTask | null>(null)
  const [view, setView] = useState<View>('home')
  const [showSettings, setShowSettings] = useState(false)

  const activeTasks = tasks.filter(t => t.area !== CEREBRO_AREA)
  const cerebroTasks = tasks.filter(t => t.area === CEREBRO_AREA)
  const atrasadas = activeTasks.filter(t => t.estado === 'Atrasada').length
  const porAprobar = activeTasks.filter(t => t.estado === 'Por Aprobar').length
  const activas = activeTasks.filter(t => t.estado !== 'Completada').length
  const enProceso = activeTasks.filter(t => t.estado === 'En Proceso').length
  const today = new Date()
  const todayStr = toLocalDateStr(today)

  const handleUpdate = useCallback((updated: RcTask) => {
    setTasks(prev => prev.map(t => t.id === updated.id ? updated : t))
  }, [])
  const handleDelete = useCallback((id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id))
    setSelectedTask(null)
  }, [])

  // Refrescar tareas desde el servidor al volver a la pestaña
  const refreshTasks = useCallback(async () => {
    try {
      const res = await fetch('/api/tasks', { cache: 'no-store' })
      if (res.ok) {
        const fresh = await res.json()
        setTasks(fresh)
      }
    } catch { /* silencioso */ }
  }, [])

  useEffect(() => {
    // Refrescar al enfocar la ventana (volver de otra pestaña/app)
    const onFocus = () => refreshTasks()
    window.addEventListener('focus', onFocus)
    // Refrescar también al volver visible la pestaña
    const onVisible = () => { if (document.visibilityState === 'visible') refreshTasks() }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [refreshTasks])

  const dayName = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'][today.getDay()]
  const monthName = ['enero','feb','marzo','abril','mayo','junio','julio','agosto','sep','octubre','nov','dic'][today.getMonth()]
  const initials = userName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg)' }}>

      {/* Topbar */}
      <div className="safe-top" style={{ display: 'flex', alignItems: 'center', padding: '12px 20px', gap: 12, background: 'var(--surface)', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <Logo size={68} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 900, color: 'var(--gold)', letterSpacing: 0.5 }}>El Regreso Control</div>
          <div style={{ fontSize: 9, color: 'var(--muted)', letterSpacing: 1.4 }}>SISTEMA OPERATIVO EJECUTIVO</div>
        </div>
        <button
          onClick={refreshTasks}
          className="touch-active"
          title="Actualizar"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, color: 'var(--muted)', fontSize: 16, lineHeight: 1, flexShrink: 0 }}
        >
          ↻
        </button>
        {(atrasadas + porAprobar) > 0 && (
          <div className="pulse" style={{ flexShrink: 0, padding: '4px 10px', background: 'rgba(255,68,68,0.12)', border: '1px solid rgba(255,68,68,0.35)', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#FF4444' }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: '#FF7070' }}>{atrasadas + porAprobar}</span>
          </div>
        )}
        <button
          onClick={() => setShowSettings(true)}
          className="touch-active"
          title="Configuración"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, color: 'var(--muted)', fontSize: 18, lineHeight: 1, flexShrink: 0 }}
        >
          ⚙
        </button>
        <div style={{ width: 34, height: 34, borderRadius: '50%', background: isAdmin ? 'var(--gold)' : '#C06A1A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#0A0A0A', flexShrink: 0, position: 'relative' }}>
          {initials}
          {isAdmin && <div style={{ position: 'absolute', bottom: -2, right: -2, width: 12, height: 12, borderRadius: '50%', background: 'var(--surface)', border: '1px solid var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7 }}>★</div>}
        </div>
      </div>

      {showSettings && (
        <SettingsPanel
          onClose={() => setShowSettings(false)}
          userName={userName}
          userEmail={userEmail}
        />
      )}

      {/* Nav tabs */}
      <div style={{ display: 'flex', background: 'var(--surface)', borderBottom: '1px solid rgba(128,128,128,0.1)', flexShrink: 0 }}>
        {([['home', '⊞ Inicio'], ['mis-tareas', '👤 Mis Tareas'], ['calendar', '📅 Calendario']] as [View, string][]).map(([v, label]) => (
          <button key={v} onClick={() => setView(v)} style={{ flex: 1, padding: '11px 4px', border: 'none', background: 'transparent', cursor: 'pointer', borderBottom: `2px solid ${view === v ? 'var(--gold)' : 'transparent'}`, fontSize: 10, fontWeight: 600, color: view === v ? 'var(--gold)' : 'var(--muted)', letterSpacing: 0.3, transition: 'all 0.15s' }}>
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
        <div style={{ padding: '22px 20px 80px', maxWidth: 600, margin: '0 auto' }}>

          {/* ── HOME VIEW ── */}
          {view === 'home' && (
            <>
              {/* Greeting */}
              <div style={{ marginBottom: 22 }}>
                <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: 1.8, marginBottom: 5 }}>
                  {dayName.toUpperCase()} {today.getDate()} DE {monthName.toUpperCase()}
                </div>
                <div style={{ fontSize: 26, fontWeight: 900, color: 'var(--cream)', letterSpacing: -0.5, lineHeight: 1.1 }}>
                  Hola, {userName.split(' ')[0]}.
                </div>
                {isAdmin && (
                  <div style={{ marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)', borderRadius: 20 }}>
                    <span style={{ fontSize: 9, color: '#D4AF37', letterSpacing: 1.2 }}>★ ADMINISTRADOR</span>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 20 }}>
                {[
                  { label: 'Activas', value: activas, color: 'var(--cream)' },
                  { label: 'En Proceso', value: enProceso, color: enProceso > 0 ? '#E67E22' : 'var(--muted)' },
                  { label: 'Aprobar', value: porAprobar, color: porAprobar > 0 ? 'var(--gold)' : 'var(--muted)' },
                  { label: 'Atraso', value: atrasadas, color: atrasadas > 0 ? '#FF6B6B' : 'var(--muted)' },
                ].map(s => (
                  <div key={s.label} style={{ background: 'var(--surface2)', border: '1px solid rgba(128,128,128,0.1)', borderRadius: 12, padding: '14px 8px', textAlign: 'center' }}>
                    <div style={{ fontSize: 22, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
                    <div style={{ fontSize: 9, color: 'var(--muted)', letterSpacing: 1.2, marginTop: 4, textTransform: 'uppercase' }}>{s.label}</div>
                  </div>
                ))}
              </div>

              <WeeklyProgressBar tasks={tasks} />

              {/* Áreas */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--gold)', letterSpacing: 2 }}>ÁREAS OPERATIVAS</span>
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 28 }}>
                {AREAS.map(area => (
                  <AreaCard key={area} area={area} tasks={tasks.filter(t => t.area === area)} onClick={() => router.push(`/area/${encodeURIComponent(area)}`)} />
                ))}
              </div>

              {/* Mi Cerebro */}
              {cerebroTasks.length > 0 && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: AREA_CFG[CEREBRO_AREA].color, letterSpacing: 2 }}>MI CEREBRO</span>
                    <div style={{ flex: 1, height: 1, background: `${AREA_CFG[CEREBRO_AREA].color}18` }} />
                  </div>
                  <div style={{ border: `1px solid ${AREA_CFG[CEREBRO_AREA].color}18`, borderRadius: 12, overflow: 'hidden' }}>
                    {cerebroTasks.map(t => (
                      <div key={t.id} onClick={() => setSelectedTask(t)} className="touch-active cursor-pointer"
                        style={{ padding: '14px 16px', borderBottom: '1px solid rgba(128,128,128,0.08)', display: 'flex', gap: 10, alignItems: 'center' }}>
                        {t.sub_area && <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 10, background: 'rgba(155,89,182,0.15)', color: '#B07FD4', letterSpacing: 0.8 }}>{t.sub_area}</span>}
                        <span style={{ flex: 1, fontSize: 14, color: 'var(--cream)' }}>{t.titulo}</span>
                        {t.prioridad_maxima && <span>⚡</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── MIS TAREAS VIEW ── */}
          {view === 'mis-tareas' && (() => {
            const misTareas = tasks.filter(t =>
              t.responsable_id === currentUserId ||
              (t.responsable_ids ?? []).includes(currentUserId)
            )
            const pendientes = misTareas.filter(t => !['Completada', 'Rechazada'].includes(t.estado))
            const completadas = misTareas.filter(t => t.estado === 'Completada')
            const grupos: { label: string; color: string; items: typeof misTareas }[] = [
              { label: 'Atrasadas', color: '#FF6B6B', items: misTareas.filter(t => t.estado === 'Atrasada') },
              { label: 'Por Aprobar', color: '#D4AF37', items: misTareas.filter(t => t.estado === 'Por Aprobar') },
              { label: 'En Proceso', color: '#E67E22', items: misTareas.filter(t => t.estado === 'En Proceso') },
              { label: 'Asignadas', color: '#5B8AA8', items: misTareas.filter(t => t.estado === 'Asignada') },
              { label: 'Completadas', color: '#4A7A3A', items: completadas },
            ].filter(g => g.items.length > 0)

            return (
              <>
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--cream)', marginBottom: 4 }}>Mis Tareas</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>{pendientes.length} pendiente{pendientes.length !== 1 ? 's' : ''} · {completadas.length} completada{completadas.length !== 1 ? 's' : ''}</div>
                </div>

                {misTareas.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '48px 20px' }}>
                    <div style={{ fontSize: 36, marginBottom: 12 }}>✅</div>
                    <div style={{ fontSize: 14, color: 'var(--muted)' }}>No tienes tareas asignadas</div>
                  </div>
                )}

                {grupos.map(grupo => (
                  <div key={grupo.label} style={{ marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: grupo.color }} />
                      <span style={{ fontSize: 10, fontWeight: 700, color: grupo.color, letterSpacing: 1.5 }}>{grupo.label.toUpperCase()} ({grupo.items.length})</span>
                    </div>
                    <div style={{ background: 'var(--surface2)', border: '1px solid rgba(128,128,128,0.1)', borderRadius: 14, overflow: 'hidden' }}>
                      {grupo.items.map(t => {
                        const plazo = new Date(t.plazo)
                        const hoy = new Date()
                        const diff = Math.ceil((plazo.getTime() - hoy.getTime()) / 86400000)
                        const plazoStr = diff < 0 ? `${Math.abs(diff)}d atrás` : diff === 0 ? 'Hoy' : `${diff}d`
                        const urgent = diff <= 0
                        return (
                          <div key={t.id} onClick={() => setSelectedTask(t)} className="touch-active cursor-pointer"
                            style={{ padding: '14px 16px', borderBottom: '1px solid rgba(128,128,128,0.08)', display: 'flex', alignItems: 'center', gap: 12, borderLeft: t.prioridad_maxima ? `3px solid ${grupo.color}` : '3px solid transparent' }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cream)', marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {t.prioridad_maxima && '⚡ '}{t.titulo}
                              </div>
                              <div style={{ fontSize: 10, color: 'var(--muted)' }}>{t.area}{t.nota_admin ? ' · ★ Nota admin' : ''}</div>
                            </div>
                            <div style={{ fontSize: 11, color: urgent ? '#FF6B6B' : 'var(--muted)', fontWeight: urgent ? 700 : 400, whiteSpace: 'nowrap' }}>{plazoStr}</div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </>
            )
          })()}

          {/* ── CALENDAR VIEW ── */}
          {view === 'calendar' && (
            <>
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--cream)', marginBottom: 4 }}>Calendario de Tareas</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>Seguimiento visual de plazos y estados</div>
              </div>
              <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 16, padding: '20px 16px' }}>
                <TaskCalendar tasks={tasks} onTaskClick={setSelectedTask} />
              </div>
            </>
          )}

        </div>
      </div>

      {selectedTask && (
        <TaskDetailModal task={selectedTask} onClose={() => setSelectedTask(null)} onUpdate={handleUpdate} onDelete={handleDelete} isAdmin={isAdmin} currentUserId={currentUserId} />
      )}
    </div>
  )
}
