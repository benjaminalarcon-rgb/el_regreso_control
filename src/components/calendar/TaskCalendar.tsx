'use client'

import { useState } from 'react'
import { RcTask, AREA_CFG, STATUS_CFG } from '@/lib/types'

interface Props {
  tasks: RcTask[]
  onTaskClick: (task: RcTask) => void
}

const DAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']
const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

export default function TaskCalendar({ tasks, onTaskClick }: Props) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selectedDay, setSelectedDay] = useState<number | null>(null)

  // First day of month (adjusted: Mon=0 … Sun=6)
  const firstDate = new Date(year, month, 1)
  const firstWeekday = (firstDate.getDay() + 6) % 7 // Mon-based
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  // Group tasks by day of month (plazo within current month/year)
  const tasksByDay: Record<number, RcTask[]> = {}
  tasks.forEach(t => {
    const d = new Date(t.plazo)
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate()
      if (!tasksByDay[day]) tasksByDay[day] = []
      tasksByDay[day].push(t)
    }
  })

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
    setSelectedDay(null)
  }
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
    setSelectedDay(null)
  }

  const selectedTasks = selectedDay ? (tasksByDay[selectedDay] ?? []) : []
  const isToday = (d: number) =>
    d === today.getDate() && month === today.getMonth() && year === today.getFullYear()

  // Dot color priority: Atrasada > En Proceso > Por Aprobar > Asignada > Completada
  function dotColor(dayTasks: RcTask[]): string {
    if (dayTasks.some(t => t.estado === 'Atrasada')) return '#FF4444'
    if (dayTasks.some(t => t.estado === 'Por Aprobar')) return '#D4AF37'
    if (dayTasks.some(t => t.estado === 'En Proceso')) return '#E67E22'
    if (dayTasks.some(t => t.estado === 'Completada' && dayTasks.every(tt => tt.estado === 'Completada'))) return '#4A7A3A'
    return '#5B8AA8'
  }

  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  // pad to full weeks
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Month navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={prevMonth} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#F4EEDF', fontSize: 16, width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#F4EEDF' }}>{MONTHS[month]}</div>
          <div style={{ fontSize: 10, color: '#3A3530' }}>{year}</div>
        </div>
        <button onClick={nextMonth} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#F4EEDF', fontSize: 16, width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>
      </div>

      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {DAYS.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, color: '#3A3530', letterSpacing: 1, padding: '4px 0' }}>{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {cells.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} />
          const dayTasks = tasksByDay[day] ?? []
          const selected = selectedDay === day
          const todayCell = isToday(day)
          const hasTasks = dayTasks.length > 0
          const color = hasTasks ? dotColor(dayTasks) : null

          return (
            <div
              key={day}
              onClick={() => setSelectedDay(selected ? null : day)}
              style={{
                borderRadius: 10,
                padding: '6px 4px',
                cursor: hasTasks ? 'pointer' : 'default',
                background: selected
                  ? `${color}20`
                  : todayCell
                  ? 'rgba(212,175,55,0.1)'
                  : 'transparent',
                border: todayCell
                  ? '1px solid rgba(212,175,55,0.4)'
                  : selected
                  ? `1px solid ${color}50`
                  : '1px solid transparent',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                minHeight: 44,
                transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: 12, fontWeight: todayCell ? 800 : 500, color: todayCell ? '#D4AF37' : '#8A8076' }}>
                {day}
              </span>

              {/* Task dots */}
              {hasTasks && (
                <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
                  {dayTasks.slice(0, 3).map((t, idx) => (
                    <div key={idx} style={{ width: 5, height: 5, borderRadius: '50%', background: STATUS_CFG[t.estado].color }} />
                  ))}
                  {dayTasks.length > 3 && (
                    <span style={{ fontSize: 7, color: '#6B6460' }}>+{dayTasks.length - 3}</span>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Selected day tasks */}
      {selectedDay && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#D4AF37', letterSpacing: 1.4, marginBottom: 10 }}>
            {selectedDay} {MONTHS[month].toUpperCase()} — {selectedTasks.length} tarea{selectedTasks.length !== 1 ? 's' : ''}
          </div>
          {selectedTasks.length === 0 ? (
            <div style={{ fontSize: 12, color: '#3A3530', textAlign: 'center', padding: 16 }}>Sin tareas este día</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {selectedTasks.map(t => {
                const sCfg = STATUS_CFG[t.estado]
                const aCfg = AREA_CFG[t.area] ?? { color: '#D4AF37' }
                return (
                  <div key={t.id} onClick={() => onTaskClick(t)}
                    style={{ padding: '12px 14px', borderRadius: 12, cursor: 'pointer', background: '#161616', border: `1px solid ${sCfg.color}25`, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: sCfg.color, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#F4EEDF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.titulo}</div>
                      <div style={{ fontSize: 10, color: aCfg.color, marginTop: 2 }}>{t.area}</div>
                    </div>
                    <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 8, background: sCfg.bg, color: sCfg.color, fontWeight: 600, whiteSpace: 'nowrap' }}>{t.estado}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, paddingTop: 4, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        {[
          { color: '#FF4444', label: 'Atrasada' },
          { color: '#D4AF37', label: 'Por Aprobar' },
          { color: '#E67E22', label: 'En Proceso' },
          { color: '#5B8AA8', label: 'Asignada' },
          { color: '#4A7A3A', label: 'Completada' },
        ].map(l => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: l.color }} />
            <span style={{ fontSize: 9, color: '#6B6460' }}>{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
