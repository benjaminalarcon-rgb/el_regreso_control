import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { RcTask, AREA_CFG, MACRO_AREAS, MacroKey } from './types'
import {
  calcAreaKpis,
  calcOTCR,
  calcSemaphoreDistribution,
  calcNetProductivity,
  calcLeadTime,
  getSemaphore,
} from './kpis'

// High-contrast palette for print
const C = {
  red:       '#C41A1A',
  yellow:    '#92600A',
  green:     '#145E2E',
  blue:      '#1A4FAD',
  gold:      '#9B7D0E',
  dark:      '#111111',
  gray:      '#5A5A5A',
  lightGray: '#F3F4F6',
  border:    '#D1D5DB',
  bg:        '#FFFFFF',
}

type RGB = [number, number, number]

function hex(h: string): RGB {
  return [
    parseInt(h.slice(1, 3), 16),
    parseInt(h.slice(3, 5), 16),
    parseInt(h.slice(5, 7), 16),
  ]
}

function formatPlazo(plazo: string): string {
  const [y, m, d] = plazo.slice(0, 10).split('-').map(Number)
  return `${d}/${m}/${y}`
}

// ── Rule-based management conclusion ─────────────────────────

function generateConclusion(
  tasks: RcTask[],
  commentCounts: Record<string, number>,
  area?: string,
): string {
  const scope = tasks.filter(t => t.area !== 'Mi Cerebro' && (!area || t.area === area))
  const dist   = calcSemaphoreDistribution(scope)
  const otcr   = calcOTCR(scope)
  const netProd = calcNetProductivity(scope)
  const totalC  = scope.reduce((s, t) => s + (commentCounts[t.id] ?? 0), 0)
  const pimp    = scope.length > 0 ? Math.round((totalC / scope.length) * 10) / 10 : 0
  const redPct  = dist.total > 0 ? Math.round((dist.red / dist.total) * 100) : 0

  const parts: string[] = []

  if (area) {
    if (otcr.total === 0) {
      parts.push(`El área de ${area} no registra tareas completadas en el período analizado.`)
    } else if (otcr.rate >= 85) {
      parts.push(`${area} mantiene un desempeño sobresaliente con un ${otcr.rate}% de efectividad de entrega, superando la meta organizacional del 85%.`)
    } else if (otcr.rate >= 60) {
      parts.push(`${area} opera con una efectividad del ${otcr.rate}%, por debajo de la meta del 85%. Se recomienda revisar las causas de retraso e implementar medidas correctivas en el ciclo siguiente.`)
    } else {
      parts.push(`${area} presenta un desempeño deficiente (${otcr.rate}% de efectividad). Se requiere intervención directa para restablecer el cumplimiento de plazos.`)
    }
    if (dist.red > 0) {
      parts.push(`Hay ${dist.red} tarea${dist.red !== 1 ? 's' : ''} en estado crítico que require${dist.red !== 1 ? 'n' : ''} atención inmediata.`)
    } else if (dist.yellow > 0) {
      parts.push(`No hay tareas vencidas, pero ${dist.yellow} están próximas a vencer en las próximas 72h.`)
    } else {
      parts.push('No se registran tareas en estado de alerta en este momento.')
    }
    if (pimp >= 3) {
      parts.push(`El índice de pimponeo elevado (${pimp} msg/t) sugiere que las instrucciones de las tareas asignadas al área requieren mayor claridad y detalle.`)
    }
  } else {
    if (otcr.total === 0) {
      parts.push('No hay tareas completadas suficientes para calcular la efectividad de entrega en este período.')
    } else if (otcr.rate >= 85) {
      parts.push(`El equipo mantiene una efectividad de entrega del ${otcr.rate}%, superando la meta organizacional del 85%. La gestión de plazos es sólida a nivel general.`)
    } else {
      parts.push(`La efectividad de entrega global es del ${otcr.rate}%, por debajo del umbral objetivo del 85%. Se identifican oportunidades de mejora en la gestión de compromisos.`)
    }
    if (redPct < 10) {
      parts.push(`El nivel de riesgo es bajo (${redPct}% de tareas críticas), indicando una gestión de plazos saludable a nivel organizacional.`)
    } else if (redPct < 20) {
      parts.push(`Se detecta un riesgo moderado: ${redPct}% de las tareas activas están en zona roja (${dist.red} tareas). Priorizar su resolución antes del cierre de semana.`)
    } else {
      parts.push(`El nivel de riesgo es alto: ${redPct}% de las tareas activas (${dist.red} en total) están en estado crítico. Se requiere revisión urgente con los responsables de área.`)
    }
    if (netProd.created > 0) {
      if (netProd.ratio >= 1.2) {
        parts.push(`La productividad semanal es muy positiva (${netProd.ratio.toFixed(1)}x): se están cerrando más compromisos de los que se abren.`)
      } else if (netProd.ratio >= 1) {
        parts.push(`La productividad semanal es equilibrada (${netProd.ratio.toFixed(1)}x), manteniendo el balance entre carga nueva y cierre.`)
      } else {
        parts.push(`La productividad semanal muestra acumulación de carga (ratio ${netProd.ratio.toFixed(1)}x). Evaluar si el volumen es sostenible o se requiere reasignación.`)
      }
    }
    if (pimp >= 3) {
      parts.push(`El índice de pimponeo general es elevado (${pimp} msg/t), lo que sugiere que las instrucciones de las tareas requieren mayor claridad y especificidad.`)
    }
  }

  return parts.join(' ')
}

// ── PDF builder ───────────────────────────────────────────────

export interface ReportInput {
  area?: string
  tasks: RcTask[]
  commentCounts: Record<string, number>
}

export function generateReportPDF({ area, tasks, commentCounts }: ReportInput): string {
  const doc  = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W    = 210
  const mg   = 15
  const cW   = W - mg * 2
  let y      = mg

  type DocEx = jsPDF & { lastAutoTable: { finalY: number } }
  const docEx = doc as DocEx

  const scope = tasks.filter(t => t.area !== 'Mi Cerebro' && (!area || t.area === area))

  const dist     = calcSemaphoreDistribution(scope)
  const otcr     = calcOTCR(scope)
  const leadTime = calcLeadTime(scope)
  const netProd  = calcNetProductivity(scope)
  const totalC   = scope.reduce((s, t) => s + (commentCounts[t.id] ?? 0), 0)
  const pimp     = scope.length > 0 ? Math.round((totalC / scope.length) * 10) / 10 : 0
  const redPct   = dist.total > 0 ? Math.round((dist.red / dist.total) * 100) : 0

  const dateStr = new Date().toLocaleDateString('es-CL', {
    day: '2-digit', month: 'long', year: 'numeric',
  })

  // ── Header ─────────────────────────────────────────────────
  doc.setFillColor(...hex(C.gold))
  doc.rect(mg, y, cW, 1.2, 'F')
  y += 5

  // Logo box
  doc.setFillColor(...hex(C.gold))
  doc.roundedRect(mg, y, 14, 14, 2, 2, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.text('RC', mg + 7, y + 9.5, { align: 'center' })

  // Brand
  doc.setTextColor(...hex(C.gold))
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9.5)
  doc.text('EL REGRESO CONTROL', mg + 18, y + 5)
  doc.setTextColor(...hex(C.gray))
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.5)
  doc.text('SISTEMA OPERATIVO EJECUTIVO', mg + 18, y + 10)

  // Date
  doc.setTextColor(...hex(C.gray))
  doc.setFontSize(7)
  doc.text(dateStr, W - mg, y + 5, { align: 'right' })
  y += 20

  // Divider
  doc.setDrawColor(...hex(C.border))
  doc.line(mg, y, W - mg, y)
  y += 8

  // Title
  doc.setTextColor(...hex(C.dark))
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(19)
  doc.text(area ? `Reporte de Área: ${area}` : 'Reporte General de Gestión', mg, y)
  y += 7

  // Subtitle
  doc.setTextColor(...hex(C.gray))
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.text(
    area
      ? `Análisis de desempeño · ${scope.length} tarea${scope.length !== 1 ? 's' : ''} registradas`
      : `Análisis consolidado · ${scope.length} tareas activas · ${new Date().toLocaleDateString('es-CL', { weekday: 'long' })}`,
    mg, y,
  )
  y += 10

  // ── KPI banner ─────────────────────────────────────────────
  const kpis = [
    {
      label: 'Efectividad',
      value: otcr.total > 0 ? `${otcr.rate}%` : '—',
      sub:   'OTCR',
      color: otcr.rate >= 85 ? C.green : otcr.rate >= 60 ? C.yellow : C.red,
    },
    {
      label: 'Tareas Rojas',
      value: dist.red.toString(),
      sub:   'críticas',
      color: dist.red > 0 ? C.red : C.green,
    },
    {
      label: 'Nivel Riesgo',
      value: dist.total > 0 ? `${redPct}%` : '—',
      sub:   'tareas en rojo',
      color: redPct < 15 ? C.green : redPct < 30 ? C.yellow : C.red,
    },
    {
      label: 'Lead Time',
      value: leadTime.avg > 0 ? `${leadTime.avg}d` : '—',
      sub:   'días promedio',
      color: C.blue,
    },
    {
      label: 'Pimponeo',
      value: pimp > 0 ? `${pimp}` : '—',
      sub:   'msg / tarea',
      color: pimp < 2 ? C.green : pimp < 3 ? C.yellow : C.red,
    },
  ]

  const boxH  = 36
  const boxW  = cW / 5

  doc.setFillColor(...hex(C.lightGray))
  doc.setDrawColor(...hex(C.border))
  doc.roundedRect(mg, y, cW, boxH, 3, 3, 'FD')

  kpis.forEach((kpi, i) => {
    const bx = mg + i * boxW

    // Accent bar
    doc.setFillColor(...hex(kpi.color))
    doc.rect(bx + 2, y + 1.5, boxW - 4, 2.5, 'F')

    // Value
    doc.setTextColor(...hex(kpi.color))
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(15)
    doc.text(kpi.value, bx + boxW / 2, y + 18, { align: 'center' })

    // Label
    doc.setTextColor(...hex(C.dark))
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6.5)
    doc.text(kpi.label.toUpperCase(), bx + boxW / 2, y + 25, { align: 'center' })

    // Sub
    doc.setTextColor(...hex(C.gray))
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(5.5)
    doc.text(kpi.sub, bx + boxW / 2, y + 30, { align: 'center' })

    // Divider between boxes
    if (i < kpis.length - 1) {
      doc.setDrawColor(...hex(C.border))
      doc.line(bx + boxW, y + 5, bx + boxW, y + boxH - 5)
    }
  })

  y += boxH + 12

  // ── Body ───────────────────────────────────────────────────

  if (area) {
    // Critical and near-deadline tasks
    const critical = scope
      .filter(t => {
        const s = getSemaphore(t.plazo, t.estado)
        return s.color === 'red' || s.color === 'yellow'
      })
      .sort((a, b) => a.plazo.localeCompare(b.plazo))

    doc.setTextColor(...hex(C.dark))
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text('Tareas Críticas y Próximas a Vencer', mg, y)
    y += 5
    doc.setTextColor(...hex(C.gray))
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.text(`${critical.length} tarea${critical.length !== 1 ? 's' : ''} en zona roja o amarilla`, mg, y)
    y += 6

    if (critical.length > 0) {
      autoTable(doc, {
        startY: y,
        margin: { left: mg, right: mg },
        head: [['Tarea', 'Responsable', 'Plazo', 'Estado', 'Retrasos']],
        body: critical.map(t => {
          const s = getSemaphore(t.plazo, t.estado)
          return [
            t.titulo.length > 42 ? t.titulo.slice(0, 39) + '…' : t.titulo,
            t.responsable?.nombre ?? '—',
            formatPlazo(t.plazo),
            s.label,
            t.contador_retrasos.toString(),
          ]
        }),
        headStyles: { fillColor: hex('#1F2937'), textColor: [255,255,255], fontSize: 7.5, fontStyle: 'bold', cellPadding: 4 },
        bodyStyles: { fontSize: 7, cellPadding: 3.5 },
        columnStyles: {
          0: { cellWidth: 68 },
          1: { cellWidth: 36 },
          2: { cellWidth: 22, halign: 'center' },
          3: { cellWidth: 26, halign: 'center' },
          4: { cellWidth: 18, halign: 'center' },
        },
        didParseCell: (data) => {
          if (data.section !== 'body') return
          const t = critical[data.row.index]
          if (!t) return
          const s = getSemaphore(t.plazo, t.estado)
          if (data.column.index === 3) {
            data.cell.styles.textColor = s.color === 'red' ? hex(C.red) : hex(C.yellow)
            data.cell.styles.fontStyle = 'bold'
          }
          if (data.column.index === 4 && t.contador_retrasos > 0) {
            data.cell.styles.textColor = hex(C.red)
            data.cell.styles.fontStyle = 'bold'
          }
        },
        alternateRowStyles: { fillColor: hex('#F9FAFB') },
      })
      y = docEx.lastAutoTable.finalY + 10
    } else {
      doc.setFillColor(...hex('#EEF9EE'))
      doc.setDrawColor(...hex('#86EFAC'))
      doc.roundedRect(mg, y, cW, 13, 3, 3, 'FD')
      doc.setTextColor(...hex(C.green))
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8.5)
      doc.text('✓  No hay tareas críticas ni próximas a vencer. Buena gestión de plazos.', mg + 6, y + 8.5)
      y += 22
    }

    // Full task list for the area
    if (scope.length > 0) {
      if (y > 235) { doc.addPage(); y = mg + 10 }
      doc.setTextColor(...hex(C.dark))
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.text('Listado Completo de Tareas', mg, y)
      y += 8

      autoTable(doc, {
        startY: y,
        margin: { left: mg, right: mg },
        head: [['Tarea', 'Responsable', 'Plazo', 'Estado']],
        body: scope
          .sort((a, b) => a.plazo.localeCompare(b.plazo))
          .map(t => [
            t.titulo.length > 48 ? t.titulo.slice(0, 45) + '…' : t.titulo,
            t.responsable?.nombre ?? '—',
            formatPlazo(t.plazo),
            t.estado,
          ]),
        headStyles: { fillColor: hex('#1F2937'), textColor: [255,255,255], fontSize: 7.5, fontStyle: 'bold', cellPadding: 4 },
        bodyStyles: { fontSize: 7, cellPadding: 3.5 },
        alternateRowStyles: { fillColor: hex('#F9FAFB') },
      })
      y = docEx.lastAutoTable.finalY + 10
    }
  } else {
    // General: area comparison table
    const allAreaNames = (Object.values(MACRO_AREAS) as typeof MACRO_AREAS[MacroKey][]).flatMap(m => [...m.areas])
    const areaKpis = calcAreaKpis(scope, allAreaNames)
      .filter(a => a.total > 0)
      .sort((a, b) => b.otcr - a.otcr || a.red - b.red)

    doc.setTextColor(...hex(C.dark))
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text('Ranking de Áreas por Cumplimiento', mg, y)
    y += 5
    doc.setTextColor(...hex(C.gray))
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.text('Ordenado por efectividad de entrega (OTCR) · mayor a menor', mg, y)
    y += 6

    if (areaKpis.length > 0) {
      autoTable(doc, {
        startY: y,
        margin: { left: mg, right: mg },
        head: [['#', 'Área', 'Total', '🔴', '🟡', '🟢', 'Complet.', 'OTCR %', 'Lead Time']],
        body: areaKpis.map((kpi, i) => [
          (i + 1).toString(),
          kpi.area,
          kpi.total.toString(),
          kpi.red.toString(),
          kpi.yellow.toString(),
          kpi.green.toString(),
          kpi.blue.toString(),
          kpi.otcr > 0 ? `${kpi.otcr}%` : '—',
          kpi.leadTime > 0 ? `${kpi.leadTime}d` : '—',
        ]),
        headStyles: { fillColor: hex('#1F2937'), textColor: [255,255,255], fontSize: 7.5, fontStyle: 'bold', cellPadding: 4 },
        bodyStyles: { fontSize: 7.5, cellPadding: 3.5 },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' },
          1: { cellWidth: 36 },
          2: { cellWidth: 14, halign: 'center' },
          3: { cellWidth: 12, halign: 'center' },
          4: { cellWidth: 14, halign: 'center' },
          5: { cellWidth: 13, halign: 'center' },
          6: { cellWidth: 18, halign: 'center' },
          7: { cellWidth: 18, halign: 'center' },
          8: { cellWidth: 18, halign: 'center' },
        },
        didParseCell: (data) => {
          if (data.section !== 'body') return
          const kpi = areaKpis[data.row.index]
          if (!kpi) return
          if (data.column.index === 3 && kpi.red > 0) {
            data.cell.styles.textColor = hex(C.red)
            data.cell.styles.fontStyle = 'bold'
          }
          if (data.column.index === 7 && kpi.otcr > 0) {
            data.cell.styles.textColor =
              kpi.otcr >= 85 ? hex(C.green) : kpi.otcr >= 60 ? hex(C.yellow) : hex(C.red)
            data.cell.styles.fontStyle = 'bold'
          }
          // Rank 1 row: subtle gold background
          if (data.row.index === 0) {
            data.cell.styles.fillColor = hex('#FDFAEE')
          }
        },
        alternateRowStyles: { fillColor: hex('#F9FAFB') },
      })
      y = docEx.lastAutoTable.finalY + 10
    } else {
      doc.setTextColor(...hex(C.gray))
      doc.setFontSize(9)
      doc.text('No hay áreas con tareas registradas.', mg, y)
      y += 14
    }

    // Macro-area summary sidebar
    if (y < 230) {
      const macroSummary = (Object.entries(MACRO_AREAS) as [MacroKey, typeof MACRO_AREAS[MacroKey]][]).map(([, m]) => {
        const mNames = m.areas as readonly string[]
        const mKpis  = areaKpis.filter(a => mNames.includes(a.area))
        const mTotal = mKpis.reduce((s, a) => s + a.total, 0)
        const mRed   = mKpis.reduce((s, a) => s + a.red, 0)
        const mOtcr  = mKpis.filter(a => a.otcr > 0).length > 0
          ? Math.round(mKpis.reduce((s, a) => s + a.otcr, 0) / mKpis.filter(a => a.otcr > 0).length)
          : 0
        return { label: m.label, total: mTotal, red: mRed, otcr: mOtcr }
      })

      if (macroSummary.some(m => m.total > 0)) {
        autoTable(doc, {
          startY: y,
          margin: { left: mg, right: mg },
          head: [['Unidad', 'Tareas', 'En Rojo', 'OTCR Grupo']],
          body: macroSummary.filter(m => m.total > 0).map(m => [
            m.label,
            m.total.toString(),
            m.red.toString(),
            m.otcr > 0 ? `${m.otcr}%` : '—',
          ]),
          headStyles: { fillColor: hex('#374151'), textColor: [255,255,255], fontSize: 7.5, fontStyle: 'bold', cellPadding: 3.5 },
          bodyStyles: { fontSize: 8, cellPadding: 3.5, fontStyle: 'bold' },
          alternateRowStyles: { fillColor: hex('#F9FAFB') },
        })
        y = docEx.lastAutoTable.finalY + 10
      }
    }
  }

  // ── Conclusion ─────────────────────────────────────────────
  if (y > 242) { doc.addPage(); y = mg + 10 }

  doc.setTextColor(...hex(C.dark))
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('Análisis de Gestión', mg, y)
  y += 7

  const text   = generateConclusion(tasks, commentCounts, area)
  const lines  = doc.splitTextToSize(text, cW - 16)
  const boxH2  = lines.length * 4.8 + 14

  doc.setFillColor(...hex(C.lightGray))
  doc.setDrawColor(...hex(C.gold))
  doc.setLineWidth(0.5)
  doc.roundedRect(mg, y, cW, boxH2, 3, 3, 'FD')

  // Gold left accent
  doc.setFillColor(...hex(C.gold))
  doc.rect(mg, y, 3, boxH2, 'F')

  doc.setTextColor(...hex('#2D3748'))
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.text(lines, mg + 9, y + 9)
  y += boxH2 + 8

  // Generated-by note
  doc.setTextColor(...hex(C.gray))
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(6.5)
  doc.text('Análisis generado automáticamente en base a datos en tiempo real del Sistema Operativo Ejecutivo.', mg + 6, y)

  // ── Footer (all pages) ────────────────────────────────────
  const pages = doc.getNumberOfPages()
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p)
    doc.setLineWidth(0.3)
    doc.setDrawColor(...hex(C.border))
    doc.line(mg, 282, W - mg, 282)
    doc.setTextColor(...hex(C.gray))
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.5)
    doc.text('Cervecería El Regreso · Sistema Operativo Ejecutivo · Confidencial', mg, 287)
    doc.text(`Página ${p} de ${pages} · ${dateStr}`, W - mg, 287, { align: 'right' })
  }

  return doc.output('datauristring').split(',')[1]
}
