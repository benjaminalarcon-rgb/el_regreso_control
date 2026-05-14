'use client'

import { useState } from 'react'
import { RcTask, AREA_CFG, STATUS_CFG } from '@/lib/types'
import { useIsDesktop } from '@/lib/useIsDesktop'

interface Props {
  tasks: RcTask[]
  onTaskClick: (task: RcTask) => void
}

const DAYS_SHORT  = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const DAYS_LETTER = ['L', 'M', 'X', 'J', 'V', 'S', 'D']
const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

function taskPriority(t: RcTask) {
  if (t.estado === 'Atrasada')   return 0
  if (t.estado === 'Por Aprobar') return 1
  if (t.estado === 'En Proceso') return 2
  if (t.estado === 'Asignada')   return 3
  return 4
}

export default function TaskCalendar({ tasks, onTaskClick }: Props) {
  const today = new Date()
  const isDesktop = useIsDesktop()
  const [year, setYear]       = useState(today.getFullYear())
  const [month, setMonth]     = useState(today.getMonth())
  const [selectedDay, setSelectedDay] = useState<number | null>(today.getDate())

  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7
  const daysInMonth  = new Date(year, month + 1, 0).getDate()

  const tasksByDay: Record<number, RcTask[]> = {}
  for (const t of tasks) {
    // Slice to YYYY-MM-DD to avoid any timezone shift from timestamptz
    const parts = t.plazo.slice(0, 10).split('-').map(Number)
    const [py, pm, pd] = parts
    if (py === year && pm - 1 === month) {
      if (!tasksByDay[pd]) tasksByDay[pd] = []
      tasksByDay[pd].push(t)
    }
  }
  for (const day of Object.keys(tasksByDay)) {
    tasksByDay[+day].sort((a, b) => taskPriority(a) - taskPriority(b))
  }

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) } else setMonth(m => m - 1)
    setSelectedDay(null)
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) } else setMonth(m => m + 1)
    setSelectedDay(null)
  }

  const isToday    = (d: number) => d === today.getDate() && month === today.getMonth() && year === today.getFullYear()
  const isPast     = (d: number) => new Date(year, month, d) < new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const isWeekend  = (offset: number) => offset % 7 >= 5

  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const monthTaskCount = Object.values(tasksByDay).flat().length
  const selectedTasks  = selectedDay ? (tasksByDay[selectedDay] ?? []) : []
  const PILLS_PER_CELL = isDesktop ? 3 : 2
  const CELL_H = isDesktop ? 100 : 68

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* ── Header ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: isDesktop ? '0 0 24px' : '0 0 18px',
        borderBottom: '1px solid var(--border)',
        marginBottom: isDesktop ? 0 : 0,
      }}>
        <button
          onClick={prevMonth}
          style={{ width: 38, height: 38, borderRadius: 12, background: 'var(--surface2)', border: '1px solid var(--border)', cursor: 'pointer', fontSize: 18, color: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
        >‹</button>

        <div style={{ flex: 1 }}>
          <div style={{ fontSize: isDesktop ? 28 : 20, fontWeight: 900, color: 'var(--cream)', letterSpacing: -1, lineHeight: 1 }}>
            {MONTHS[month]} <span style={{ color: 'var(--muted)', fontWeight: 400, fontSize: isDesktop ? 20 : 15 }}>{year}</span>
          </div>
          {monthTaskCount > 0 && (
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
              {monthTaskCount} tarea{monthTaskCount !== 1 ? 's' : ''} este mes
            </div>
          )}
        </div>

        <button
          onClick={nextMonth}
          style={{ width: 38, height: 38, borderRadius: 12, background: 'var(--surface2)', border: '1px solid var(--border)', cursor: 'pointer', fontSize: 18, color: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
        >›</button>
      </div>

      {/* ── Grid ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginTop: isDesktop ? 0 : 0 }}>

        {/* Day headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid var(--border)' }}>
          {(isDesktop ? DAYS_SHORT : DAYS_LETTER).map((d, i) => (
            <div key={d} style={{
              padding: isDesktop ? '10px 14px' : '8px 0',
              fontSize: isDesktop ? 11 : 9, fontWeight: 700, letterSpacing: 1.2,
              color: i >= 5 ? 'rgba(212,175,55,0.5)' : 'var(--muted)',
              textAlign: isDesktop ? 'left' : 'center',
              textTransform: 'uppercase',
            }}>{d}</div>
          ))}
        </div>

        {/* Weeks */}
        {Array.from({ length: cells.length / 7 }, (_, week) => (
          <div key={week} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid var(--border)' }}>
            {cells.slice(week * 7, week * 7 + 7).map((day, col) => {
              if (!day) return (
                <div key={`e-${week}-${col}`} style={{
                  minHeight: CELL_H,
                  background: isWeekend(week * 7 + col) ? 'rgba(255,255,255,0.01)' : 'transparent',
                  borderRight: col < 6 ? '1px solid var(--border)' : 'none',
                }} />
              )

              const dayTasks  = tasksByDay[day] ?? []
              const today_    = isToday(day)
              const selected  = selectedDay === day
              const past      = isPast(day) && !today_
              const weekend   = isWeekend(week * 7 + col)
              const overflow  = dayTasks.length - PILLS_PER_CELL
              const visible   = dayTasks.slice(0, PILLS_PER_CELL)

              return (
                <div
                  key={day}
                  onClick={() => setSelectedDay(selected ? null : day)}
                  style={{
                    minHeight: CELL_H,
                    borderRight: col < 6 ? '1px solid var(--border)' : 'none',
                    padding: isDesktop ? '10px 10px 8px' : '6px 4px 4px',
                    cursor: 'pointer',
                    background: today_ ? 'rgba(212,175,55,0.06)' : selected ? 'rgba(255,255,255,0.03)' : weekend ? 'rgba(255,255,255,0.01)' : 'transparent',
                    transition: 'background 0.1s',
                    display: 'flex', flexDirection: 'column', gap: 4,
                    position: 'relative',
                  }}
                >
                  {/* Day number */}
                  <div style={{
                    width: isDesktop ? 26 : 20, height: isDesktop ? 26 : 20,
                    borderRadius: '50%', flexShrink: 0,
                    background: today_ ? 'var(--gold)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    alignSelf: isDesktop ? 'flex-start' : 'center',
                    fontSize: isDesktop ? 12 : 10,
                    fontWeight: today_ ? 900 : selected ? 700 : 500,
                    color: today_ ? '#0A0A0A' : past ? 'rgba(128,128,128,0.3)' : 'var(--cream)',
                  }}>{day}</div>

                  {/* Task pills — desktop */}
                  {isDesktop && visible.map(t => {
                    const s = STATUS_CFG[t.estado]
                    return (
                      <div
                        key={t.id}
                        onClick={e => { e.stopPropagation(); onTaskClick(t) }}
                        title={t.titulo}
                        style={{
                          fontSize: 9, fontWeight: 700, lineHeight: 1,
                          padding: '3px 7px', borderRadius: 6,
                          background: `${s.color}20`, color: s.color,
                          border: `1px solid ${s.color}35`,
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          cursor: 'pointer',
                        }}
                      >{t.titulo}</div>
                    )
                  })}

                  {/* Dots — mobile */}
                  {!isDesktop && dayTasks.length > 0 && (
                    <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
                      {dayTasks.slice(0, 4).map((t, i) => (
                        <div key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: STATUS_CFG[t.estado].color }} />
                      ))}
                    </div>
                  )}

                  {/* Overflow */}
                  {isDesktop && overflow > 0 && (
                    <div style={{ fontSize: 8, color: 'var(--muted)', fontWeight: 600, paddingLeft: 4 }}>
                      +{overflow} más
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* ── Selected day panel ── */}
      {selectedDay && (
        <div style={{
          marginTop: 20,
          background: 'var(--surface2)', border: '1px solid var(--border)',
          borderRadius: 18, padding: '18px 20px', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: selectedTasks.length > 0 ? 14 : 0 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900, color: '#0A0A0A', flexShrink: 0 }}>
              {selectedDay}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--cream)' }}>
                {selectedDay} de {MONTHS[month]}
              </div>
              <div style={{ fontSize: 10, color: 'var(--muted)' }}>
                {selectedTasks.length > 0 ? `${selectedTasks.length} tarea${selectedTasks.length !== 1 ? 's' : ''}` : 'Sin tareas este día'}
              </div>
            </div>
          </div>

          {selectedTasks.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {selectedTasks.map(t => {
                const s = STATUS_CFG[t.estado]
                const a = AREA_CFG[t.area]
                return (
                  <div
                    key={t.id}
                    onClick={() => onTaskClick(t)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 14px', borderRadius: 13,
                      background: 'var(--surface)', border: `1px solid ${s.color}25`,
                      borderLeft: `3px solid ${s.color}`,
                      cursor: 'pointer', transition: 'opacity 0.12s',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--cream)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.titulo}</div>
                      <div style={{ fontSize: 10, color: a?.color ?? 'var(--muted)', marginTop: 2 }}>{t.area}</div>
                    </div>
                    <span style={{ fontSize: 9, padding: '3px 9px', borderRadius: 8, background: s.bg, color: s.color, fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0 }}>
                      {t.estado}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, paddingTop: 16, marginTop: 8 }}>
        {[
          { color: '#FF4444', label: 'Atrasada' },
          { color: '#D4AF37', label: 'Por Aprobar' },
          { color: '#E67E22', label: 'En Proceso' },
          { color: '#5B8AA8', label: 'Asignada' },
          { color: '#4A7A3A', label: 'Completada' },
        ].map(l => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 8, height: 8, borderRadius: 3, background: l.color }} />
            <span style={{ fontSize: 10, color: 'var(--muted)' }}>{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
