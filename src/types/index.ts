// ─── Enums ───────────────────────────────────────────────────────────────────

export type MachineType =
  | 'tractor'
  | 'motosierra'
  | 'desbrozadora'
  | 'electrica'
  | 'otro'

export type WorkOrderStatus =
  | 'recibida'
  | 'presupuestada'
  | 'aceptada'
  | 'esperando_piezas'
  | 'en_reparacion'
  | 'lista'
  | 'entregada'

export type QuoteStatus = 'borrador' | 'enviado' | 'aceptado' | 'rechazado'

export type PaymentMethod = 'efectivo' | 'transferencia' | 'tarjeta' | 'otro'

export type IvaRate = 0 | 3 | 7  // IGIC Canarias

// ─── Domain models ───────────────────────────────────────────────────────────

export interface Settings {
  id: string
  user_id: string
  business_name: string
  owner_name: string
  phone: string
  address: string
  logo_url: string | null
  tax_id: string
  default_iva_rate: IvaRate
}

export interface Client {
  id: string
  user_id: string
  name: string
  phone: string | null
  email: string | null
  address: string | null
  notes: string | null
  created_at: string
}

export interface Machine {
  id: string
  user_id: string
  client_id: string
  brand: string | null
  model: string | null
  serial_number: string | null
  type: MachineType
  notes: string | null
  created_at: string
  // joined
  client?: Client
}

export interface LaborType {
  id: string
  user_id: string
  name: string
  hourly_rate: number
}

export interface PartsCatalogItem {
  id: string
  user_id: string
  code: string | null
  brand: string | null
  description: string
  sell_price: number
  notes: string | null
  url: string | null
  created_at: string
}

export interface WorkOrder {
  id: string
  user_id: string
  client_id: string
  machine_id: string | null
  order_number: string
  status: WorkOrderStatus
  problem_description: string | null
  diagnosis: string | null
  internal_notes: string | null
  estimated_delivery: string | null
  created_at: string
  updated_at: string
  // joined
  client?: Client
  machine?: Machine
}

export interface WorkOrderStatusLog {
  id: string
  work_order_id: string
  from_status: WorkOrderStatus | null
  to_status: WorkOrderStatus
  changed_at: string
}

export interface WorkOrderPart {
  id: string
  work_order_id: string
  catalog_part_id: string | null
  code: string | null
  description: string
  brand: string | null
  quantity: number
  unit_price: number
}

export interface WorkOrderLabor {
  id: string
  work_order_id: string
  labor_type_id: string | null
  description: string | null
  hours: number
  unit_rate: number
  // joined
  labor_type?: LaborType
}

export interface Quote {
  id: string
  user_id: string
  work_order_id: string
  quote_number: string
  include_iva: boolean
  iva_rate: IvaRate
  status: QuoteStatus
  valid_until: string | null
  notes: string | null
  created_at: string
  // joined
  work_order?: WorkOrder
}

export interface Payment {
  id: string
  work_order_id: string
  amount: number
  date: string
  method: PaymentMethod
  notes: string | null
}

export interface Expense {
  id: string
  user_id: string
  date: string
  description: string
  category: string
  amount: number
}

// ─── UI helpers ──────────────────────────────────────────────────────────────

export const MACHINE_TYPE_LABELS: Record<MachineType, string> = {
  tractor: 'Tractor',
  motosierra: 'Motosierra',
  desbrozadora: 'Desbrozadora',
  electrica: 'Eléctrica',
  otro: 'Otro',
}

export const ORDER_STATUS_LABELS: Record<WorkOrderStatus, string> = {
  recibida: 'Recibida',
  presupuestada: 'Presupuestada',
  aceptada: 'Aceptada',
  esperando_piezas: 'Esperando piezas',
  en_reparacion: 'En reparación',
  lista: 'Lista para recoger',
  entregada: 'Entregada',
}

export const ORDER_STATUS_COLORS: Record<WorkOrderStatus, string> = {
  recibida:         'bg-sky-100 text-sky-700',
  presupuestada:    'bg-yellow-100 text-yellow-800',
  aceptada:         'bg-blue-100 text-blue-800',
  esperando_piezas: 'bg-orange-100 text-orange-800',
  en_reparacion:    'bg-violet-100 text-violet-800',
  lista:            'bg-green-100 text-green-800',
  entregada:        'bg-slate-100 text-slate-500',
}

export const ORDER_STATUS_FLOW: WorkOrderStatus[] = [
  'recibida',
  'presupuestada',
  'aceptada',
  'esperando_piezas',
  'en_reparacion',
  'lista',
  'entregada',
]

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  tarjeta: 'Tarjeta',
  otro: 'Otro',
}
