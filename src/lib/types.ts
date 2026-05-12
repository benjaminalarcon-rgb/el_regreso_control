export type TaskStatus = 'Asignada' | 'En Proceso' | 'Por Aprobar' | 'Atrasada' | 'Completada' | 'Rechazada'

export interface RcUser {
  id: string
  nombre: string
  iniciales: string
  rol: string
  area: string
  email: string
  is_admin?: boolean
}

export interface RcTask {
  id: string
  titulo: string
  descripcion: string
  area: string
  sub_area?: string
  responsable_id: string
  responsable?: RcUser
  responsable_ids?: string[]
  responsables?: RcUser[]
  plazo: string
  estado: TaskStatus
  prioridad_maxima: boolean
  evidencia_url?: string
  contador_retrasos: number
  created_at?: string
  creado_por?: string
  nota_rechazo?: string
  nota_admin?: string
  foto_antes_url?: string
  foto_despues_url?: string
  resumen_cierre?: string
}

export const AREAS = ['Ventas', 'Marketing', 'Logística', 'Control de Gestión'] as const
export const CEREBRO_AREA = 'Mi Cerebro'
export const ALL_AREAS = [...AREAS, CEREBRO_AREA] as const

export const STATUS_LIST: TaskStatus[] = [
  'Asignada', 'En Proceso', 'Por Aprobar', 'Atrasada', 'Completada', 'Rechazada'
]

export const AREA_CFG: Record<string, { color: string; dim: string; code: string }> = {
  'Ventas':               { color: '#E67E22', dim: '#1A110A', code: 'VT' },
  'Marketing':            { color: '#5B8AA8', dim: '#0A0F14', code: 'MK' },
  'Logística':            { color: '#C8542A', dim: '#180D0A', code: 'LG' },
  'Control de Gestión':   { color: '#D4AF37', dim: '#141007', code: 'CG' },
  'Mi Cerebro':           { color: '#9B59B6', dim: '#100A14', code: 'MC' },
}

export const STATUS_CFG: Record<TaskStatus, { color: string; bg: string; label: string }> = {
  'Asignada':    { color: '#5B8AA8', bg: '#0A0F14', label: 'Asignada' },
  'En Proceso':  { color: '#E67E22', bg: '#1A110A', label: 'En Proceso' },
  'Por Aprobar': { color: '#D4AF37', bg: '#141007', label: 'Por Aprobar' },
  'Atrasada':    { color: '#FF4444', bg: '#1A0A0A', label: 'Atrasada' },
  'Completada':  { color: '#4A7A3A', bg: '#0A140A', label: 'Completada' },
  'Rechazada':   { color: '#A8341F', bg: '#140A0A', label: 'Rechazada' },
}
