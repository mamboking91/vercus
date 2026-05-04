import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Pencil, Plus, Trash2, ChevronRight, ChevronLeft, FileText, User, Wrench } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { PartDialog } from '@/components/ordenes/PartDialog'
import { LaborDialog } from '@/components/ordenes/LaborDialog'
import { PaymentsTab } from '@/components/ordenes/PaymentsTab'
import { MachineTypeBadge } from '@/components/maquinas/MachineTypeBadge'
import { useWorkOrders } from '@/hooks/useWorkOrders'
import { useWorkOrderParts } from '@/hooks/useWorkOrderParts'
import { useWorkOrderLabor } from '@/hooks/useWorkOrderLabor'
import { useWorkOrderExtras } from '@/hooks/useWorkOrderExtras'
import { usePayments } from '@/hooks/usePayments'
import { useQuotes } from '@/hooks/useQuotes'
import { supabase } from '@/lib/supabase'
import { toast } from '@/hooks/use-toast'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils'
import {
  type WorkOrder, type WorkOrderPart, type WorkOrderLabor, type WorkOrderExtra, type WorkOrderStatusLog, type QuoteStatus,
  ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, ORDER_STATUS_FLOW,
} from '@/types'

const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  borrador: 'Borrador', enviado: 'Enviado', aceptado: 'Aceptado', rechazado: 'Rechazado',
}
const QUOTE_STATUS_COLORS: Record<QuoteStatus, string> = {
  borrador: 'bg-gray-100 text-gray-700',
  enviado: 'bg-blue-100 text-blue-800',
  aceptado: 'bg-green-100 text-green-800',
  rechazado: 'bg-red-100 text-red-800',
}

function getNextStatus(current: WorkOrder['status']) {
  const idx = ORDER_STATUS_FLOW.indexOf(current)
  return idx < ORDER_STATUS_FLOW.length - 1 ? ORDER_STATUS_FLOW[idx + 1] : null
}
function getPrevStatus(current: WorkOrder['status']) {
  const idx = ORDER_STATUS_FLOW.indexOf(current)
  return idx > 0 ? ORDER_STATUS_FLOW[idx - 1] : null
}

// ─── Tab: Piezas ──────────────────────────────────────────────────────────────

function PiezasTab({ workOrderId }: { workOrderId: string }) {
  const { parts, loading, addPart, updatePart, deletePart } = useWorkOrderParts(workOrderId)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<WorkOrderPart | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<WorkOrderPart | null>(null)

  async function handleSave(values: Omit<WorkOrderPart, 'id'>) {
    if (editing) {
      const { error } = await updatePart(editing.id, values)
      if (error) toast({ title: 'Error al guardar', description: error, variant: 'destructive' })
    } else {
      const { error } = await addPart(values)
      if (error) toast({ title: 'Error al añadir', description: error, variant: 'destructive' })
    }
    setEditing(null)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    const { error } = await deletePart(deleteTarget.id)
    if (error) toast({ title: 'Error al eliminar', description: error, variant: 'destructive' })
    setDeleteTarget(null)
  }

  if (loading) return <div className="py-8 text-center text-sm text-muted-foreground">Cargando…</div>

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => { setEditing(null); setDialogOpen(true) }}>
          <Plus className="h-4 w-4 mr-1" />Añadir pieza
        </Button>
      </div>
      {parts.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Sin piezas añadidas.</p>
      ) : (
        <div className="space-y-2">
          {parts.map(part => (
            <div key={part.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{part.description}</p>
                <p className="text-xs text-muted-foreground">
                  {[part.code, part.brand].filter(Boolean).join(' · ')}
                  {' · '}{part.quantity} ud × {formatCurrency(part.unit_price)}
                </p>
              </div>
              <div className="flex items-center gap-2 ml-3 shrink-0">
                <span className="text-sm font-semibold">{formatCurrency(part.quantity * part.unit_price)}</span>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditing(part); setDialogOpen(true) }}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(part)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
          <div className="text-right text-sm font-semibold pt-1 pr-1">
            Subtotal: {formatCurrency(parts.reduce((s, p) => s + p.quantity * p.unit_price, 0))}
          </div>
        </div>
      )}
      <PartDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditing(null) }}
        onSave={handleSave}
        workOrderId={workOrderId}
        initial={editing}
      />
      <AlertDialog open={!!deleteTarget} onOpenChange={v => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar pieza?</AlertDialogTitle>
            <AlertDialogDescription>Se eliminará <strong>{deleteTarget?.description}</strong> de la orden.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleDelete}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ─── Tab: Mano de obra ────────────────────────────────────────────────────────

function ManoObraTab({ workOrderId }: { workOrderId: string }) {
  const { laborEntries, loading, addLabor, updateLabor, deleteLabor } = useWorkOrderLabor(workOrderId)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<WorkOrderLabor | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<WorkOrderLabor | null>(null)

  async function handleSave(values: Omit<WorkOrderLabor, 'id' | 'labor_type'>) {
    if (editing) {
      const { error } = await updateLabor(editing.id, values)
      if (error) toast({ title: 'Error al guardar', description: error, variant: 'destructive' })
    } else {
      const { error } = await addLabor(values)
      if (error) toast({ title: 'Error al añadir', description: error, variant: 'destructive' })
    }
    setEditing(null)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    const { error } = await deleteLabor(deleteTarget.id)
    if (error) toast({ title: 'Error al eliminar', description: error, variant: 'destructive' })
    setDeleteTarget(null)
  }

  if (loading) return <div className="py-8 text-center text-sm text-muted-foreground">Cargando…</div>

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => { setEditing(null); setDialogOpen(true) }}>
          <Plus className="h-4 w-4 mr-1" />Añadir mano de obra
        </Button>
      </div>
      {laborEntries.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Sin mano de obra registrada.</p>
      ) : (
        <div className="space-y-2">
          {laborEntries.map(entry => (
            <div key={entry.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{entry.labor_type?.name ?? 'Mano de obra'}</p>
                <p className="text-xs text-muted-foreground">
                  {entry.hours}h × {formatCurrency(entry.unit_rate)}/h
                  {entry.description ? ` · ${entry.description}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2 ml-3 shrink-0">
                <span className="text-sm font-semibold">{formatCurrency(entry.hours * entry.unit_rate)}</span>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditing(entry); setDialogOpen(true) }}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(entry)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
          <div className="text-right text-sm font-semibold pt-1 pr-1">
            Subtotal: {formatCurrency(laborEntries.reduce((s, l) => s + l.hours * l.unit_rate, 0))}
          </div>
        </div>
      )}
      <LaborDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditing(null) }}
        onSave={handleSave}
        workOrderId={workOrderId}
        initial={editing}
      />
      <AlertDialog open={!!deleteTarget} onOpenChange={v => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar entrada de mano de obra?</AlertDialogTitle>
            <AlertDialogDescription>Se eliminará este registro de la orden.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleDelete}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ─── Tab: Extras ─────────────────────────────────────────────────────────────

function ExtrasTab({ workOrderId }: { workOrderId: string }) {
  const { extras, loading, addExtra, updateExtra, deleteExtra } = useWorkOrderExtras(workOrderId)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<WorkOrderExtra | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<WorkOrderExtra | null>(null)
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [saving, setSaving] = useState(false)

  function openNew() { setEditing(null); setDescription(''); setAmount(''); setDialogOpen(true) }
  function openEdit(e: WorkOrderExtra) { setEditing(e); setDescription(e.description); setAmount(String(e.amount)); setDialogOpen(true) }
  function closeDialog() { setDialogOpen(false); setEditing(null) }

  async function handleSave(ev: React.FormEvent) {
    ev.preventDefault()
    const amt = parseFloat(amount)
    if (!description.trim() || isNaN(amt)) return
    setSaving(true)
    const values = { description: description.trim(), amount: amt, work_order_id: workOrderId }
    if (editing) {
      const { error } = await updateExtra(editing.id, { description: values.description, amount: values.amount })
      if (error) toast({ title: 'Error al guardar', description: error, variant: 'destructive' })
    } else {
      const { error } = await addExtra(values)
      if (error) toast({ title: 'Error al añadir', description: error, variant: 'destructive' })
    }
    setSaving(false)
    closeDialog()
  }

  async function handleDelete() {
    if (!deleteTarget) return
    const { error } = await deleteExtra(deleteTarget.id)
    if (error) toast({ title: 'Error al eliminar', description: error, variant: 'destructive' })
    setDeleteTarget(null)
  }

  if (loading) return <div className="py-8 text-center text-sm text-muted-foreground">Cargando…</div>

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={openNew}>
          <Plus className="h-4 w-4 mr-1" />Añadir gasto
        </Button>
      </div>
      {extras.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Sin gastos adicionales.</p>
      ) : (
        <div className="space-y-2">
          {extras.map(extra => (
            <div key={extra.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{extra.description}</p>
              </div>
              <div className="flex items-center gap-2 ml-3 shrink-0">
                <span className="text-sm font-semibold">{formatCurrency(extra.amount)}</span>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(extra)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(extra)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
          <div className="text-right text-sm font-semibold pt-1 pr-1">
            Subtotal: {formatCurrency(extras.reduce((s, e) => s + e.amount, 0))}
          </div>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={v => !v && closeDialog()}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar gasto' : 'Añadir gasto'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="extra-desc">Concepto <span className="text-destructive">*</span></Label>
              <Input
                id="extra-desc"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Ej: Envío, DUA, Aranceles…"
                required
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="extra-amount">Importe (€) <span className="text-destructive">*</span></Label>
              <Input
                id="extra-amount"
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>Cancelar</Button>
              <Button type="submit" disabled={saving || !description.trim() || !amount}>
                {saving ? 'Guardando…' : editing ? 'Guardar' : 'Añadir'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={v => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar gasto?</AlertDialogTitle>
            <AlertDialogDescription>Se eliminará <strong>{deleteTarget?.description}</strong> de la orden.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleDelete}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ─── Dialog: Editar datos de la orden ────────────────────────────────────────

function EditOrderDialog({ order, open, onClose, onSave }: {
  order: WorkOrder; open: boolean; onClose: () => void
  onSave: (values: Partial<WorkOrder>) => Promise<void>
}) {
  const [problemDescription, setProblemDescription] = useState('')
  const [diagnosis, setDiagnosis] = useState('')
  const [internalNotes, setInternalNotes] = useState('')
  const [estimatedDelivery, setEstimatedDelivery] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setProblemDescription(order.problem_description ?? '')
      setDiagnosis(order.diagnosis ?? '')
      setInternalNotes(order.internal_notes ?? '')
      setEstimatedDelivery(order.estimated_delivery ?? '')
    }
  }, [open, order])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await onSave({ problem_description: problemDescription, diagnosis, internal_notes: internalNotes, estimated_delivery: estimatedDelivery || null })
    setSaving(false)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Editar orden {order.order_number}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Descripción del problema</Label>
            <Textarea value={problemDescription} onChange={e => setProblemDescription(e.target.value)} rows={3} />
          </div>
          <div className="space-y-2">
            <Label>Diagnóstico</Label>
            <Textarea value={diagnosis} onChange={e => setDiagnosis(e.target.value)} rows={2} />
          </div>
          <div className="space-y-2">
            <Label>Notas internas</Label>
            <Textarea value={internalNotes} onChange={e => setInternalNotes(e.target.value)} rows={2} />
          </div>
          <div className="space-y-2">
            <Label>Fecha estimada de entrega</Label>
            <Input type="date" value={estimatedDelivery} onChange={e => setEstimatedDelivery(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function OrdenDetallePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { getOrder, updateOrder, updateOrderStatus } = useWorkOrders()
  const { totalParts } = useWorkOrderParts(id!)
  const { totalLabor } = useWorkOrderLabor(id!)
  const { totalExtras } = useWorkOrderExtras(id!)
  const { totalPaid } = usePayments(id!)
  const { quotes } = useQuotes(id!)

  const [order, setOrder] = useState<WorkOrder | null>(null)
  const [statusLog, setStatusLog] = useState<WorkOrderStatusLog[]>([])
  const [loading, setLoading] = useState(true)
  const [editOpen, setEditOpen] = useState(false)
  const [confirmStatus, setConfirmStatus] = useState<WorkOrder['status'] | null>(null)

  useEffect(() => {
    if (!id) return
    getOrder(id).then(o => { setOrder(o); setLoading(false) })
    fetchStatusLog()
  }, [id])

  async function fetchStatusLog() {
    const { data } = await supabase
      .from('work_order_status_log')
      .select('*')
      .eq('work_order_id', id)
      .order('changed_at', { ascending: false })
    setStatusLog((data as WorkOrderStatusLog[]) ?? [])
  }

  async function handleStatusChange(toStatus: WorkOrder['status']) {
    if (!order) return
    const { error } = await updateOrderStatus(order.id, order.status, toStatus)
    if (error) {
      toast({ title: 'Error al cambiar estado', description: error, variant: 'destructive' })
    } else {
      setOrder(prev => prev ? { ...prev, status: toStatus } : prev)
      fetchStatusLog()
      toast({ title: `Estado: ${ORDER_STATUS_LABELS[toStatus]}` })
    }
    setConfirmStatus(null)
  }

  async function handleUpdateOrder(values: Partial<WorkOrder>) {
    if (!order) return
    const { error } = await updateOrder(order.id, values)
    if (error) {
      toast({ title: 'Error al guardar', description: error, variant: 'destructive' })
    } else {
      setOrder(prev => prev ? { ...prev, ...values } : prev)
      toast({ title: 'Orden actualizada' })
    }
  }

  if (loading) return (
    <div className="space-y-4">
      <div className="h-8 w-48 bg-muted rounded animate-pulse" />
      <div className="h-32 bg-muted rounded-xl animate-pulse" />
    </div>
  )

  if (!order) return (
    <div className="text-center py-16">
      <p className="text-muted-foreground">Orden no encontrada.</p>
      <Button variant="link" onClick={() => navigate('/ordenes')}>Volver a órdenes</Button>
    </div>
  )

  const nextStatus = getNextStatus(order.status)
  const prevStatus = getPrevStatus(order.status)
  const total = totalParts + totalLabor + totalExtras
  const pending = Math.max(0, total - totalPaid)

  return (
    <div>
      {/* Cabecera */}
      <Button variant="ghost" size="sm" className="mb-3 -ml-2 text-muted-foreground" onClick={() => navigate('/ordenes')}>
        <ArrowLeft className="h-4 w-4 mr-1" />Órdenes
      </Button>

      <div className="flex items-center justify-between gap-3 mb-6">
        <h1 className="text-xl md:text-2xl font-bold tracking-tight">{order.order_number}</h1>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="h-3.5 w-3.5 mr-1.5" />
            <span className="hidden sm:inline">Editar</span>
          </Button>
          <Button size="sm" onClick={() => navigate(`/presupuestos/nuevo?orden=${id}`)}>
            <FileText className="h-3.5 w-3.5 mr-1.5" />
            <span className="hidden sm:inline">Presupuesto</span>
          </Button>
        </div>
      </div>

      {/* Layout dos columnas */}
      <div className="flex flex-col lg:grid lg:grid-cols-[1fr_300px] lg:items-start gap-5">

        {/* ── LEFT: Trabajo + Presupuestos ── */}
        <div className="space-y-5 min-w-0">

          {/* Tabs: Piezas / Mano de obra / Pagos */}
          <Card>
            <CardHeader className="pb-0">
              <CardTitle className="text-base">Detalle del trabajo</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <Tabs defaultValue="piezas">
                <TabsList className="mb-4 w-full">
                  <TabsTrigger value="piezas" className="flex-1">Piezas</TabsTrigger>
                  <TabsTrigger value="labor" className="flex-1">Mano de obra</TabsTrigger>
                  <TabsTrigger value="extras" className="flex-1">Extras</TabsTrigger>
                  <TabsTrigger value="pagos" className="flex-1">Pagos</TabsTrigger>
                </TabsList>
                <TabsContent value="piezas"><PiezasTab workOrderId={id!} /></TabsContent>
                <TabsContent value="labor"><ManoObraTab workOrderId={id!} /></TabsContent>
                <TabsContent value="extras"><ExtrasTab workOrderId={id!} /></TabsContent>
                <TabsContent value="pagos"><PaymentsTab workOrderId={id!} totalAmount={total} /></TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Presupuestos */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />Presupuestos
                </CardTitle>
                <Button size="sm" variant="outline" onClick={() => navigate(`/presupuestos/nuevo?orden=${id}`)}>
                  <Plus className="h-4 w-4 mr-1" />Nuevo
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {quotes.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Sin presupuestos generados.</p>
              ) : (
                <div className="space-y-2">
                  {quotes.map(q => (
                    <button
                      key={q.id}
                      onClick={() => navigate(`/presupuestos/${q.id}`)}
                      className="w-full text-left flex items-center justify-between rounded-lg border px-4 py-2.5 hover:bg-muted/40 transition-colors"
                    >
                      <div>
                        <span className="text-sm font-medium mr-2">{q.quote_number}</span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${QUOTE_STATUS_COLORS[q.status]}`}>
                          {QUOTE_STATUS_LABELS[q.status]}
                        </span>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatDate(q.created_at)}
                          {q.include_iva ? ` · IGIC ${q.iva_rate}%` : ' · Sin IGIC'}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

        </div>

        {/* ── RIGHT: Cliente + Máquina + Estado + Resumen + Detalles + Historial ── */}
        <div className="space-y-4">

          {/* Cliente */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-muted-foreground" />Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-0.5">
              {order.client ? (
                <>
                  <Link to={`/clientes/${order.client_id}`} className="text-sm font-medium hover:underline text-primary">
                    {order.client.name}
                  </Link>
                  {order.client.phone && <p className="text-xs text-muted-foreground">{order.client.phone}</p>}
                  {order.client.email && <p className="text-xs text-muted-foreground">{order.client.email}</p>}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">—</p>
              )}
            </CardContent>
          </Card>

          {/* Máquina */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-1.5">
                <Wrench className="h-3.5 w-3.5 text-muted-foreground" />Máquina
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {order.machine ? (
                <div className="space-y-1.5">
                  <MachineTypeBadge type={order.machine.type} />
                  {(order.machine.brand || order.machine.model) && (
                    <Link to={`/maquinas/${order.machine_id}`} className="block text-sm font-medium hover:underline text-primary">
                      {[order.machine.brand, order.machine.model].filter(Boolean).join(' ')}
                    </Link>
                  )}
                  {order.machine.serial_number && (
                    <p className="text-xs text-muted-foreground font-mono">S/N: {order.machine.serial_number}</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Sin máquina asignada</p>
              )}
            </CardContent>
          </Card>

          {/* Estado */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Estado</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <Badge className={`${ORDER_STATUS_COLORS[order.status]} text-sm px-3 py-1`}>
                {ORDER_STATUS_LABELS[order.status]}
              </Badge>
              {(prevStatus || nextStatus) && (
                <div className="flex gap-2 flex-wrap">
                  {prevStatus && (
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => setConfirmStatus(prevStatus)}>
                      <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                      {ORDER_STATUS_LABELS[prevStatus]}
                    </Button>
                  )}
                  {nextStatus && (
                    <Button size="sm" className="flex-1" onClick={() => setConfirmStatus(nextStatus)}>
                      {ORDER_STATUS_LABELS[nextStatus]}
                      <ChevronRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Resumen económico */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Resumen económico</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Piezas</span>
                <span>{formatCurrency(totalParts)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Mano de obra</span>
                <span>{formatCurrency(totalLabor)}</span>
              </div>
              {totalExtras > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Extras</span>
                  <span>{formatCurrency(totalExtras)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-sm border-t pt-2">
                <span>Total bruto</span>
                <span>{formatCurrency(total)}</span>
              </div>
              {totalPaid > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Cobrado</span>
                  <span className="text-green-600 font-medium">{formatCurrency(totalPaid)}</span>
                </div>
              )}
              {pending > 0 && (
                <div className="flex justify-between text-sm font-semibold">
                  <span>Pendiente</span>
                  <span className="text-destructive">{formatCurrency(pending)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Detalles de la orden */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Detalles</CardTitle>
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1" onClick={() => setEditOpen(true)}>
                  <Pencil className="h-3 w-3" />Editar
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-3 text-sm">
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground shrink-0">Entrada</span>
                <span className="font-medium text-right">{formatDate(order.created_at)}</span>
              </div>
              {order.estimated_delivery && (
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground shrink-0">Entrega est.</span>
                  <span className="font-medium text-right">{formatDate(order.estimated_delivery)}</span>
                </div>
              )}
              {order.problem_description && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground mb-1">Problema</p>
                  <p className="text-sm">{order.problem_description}</p>
                </div>
              )}
              {order.diagnosis && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Diagnóstico</p>
                  <p className="text-sm">{order.diagnosis}</p>
                </div>
              )}
              {order.internal_notes && (
                <div className="rounded-md bg-muted/50 px-3 py-2">
                  <p className="text-xs text-muted-foreground mb-1">Notas internas</p>
                  <p className="text-sm">{order.internal_notes}</p>
                </div>
              )}
              {!order.problem_description && !order.diagnosis && !order.internal_notes && !order.estimated_delivery && (
                <p className="text-xs text-muted-foreground italic">Sin detalles registrados.</p>
              )}
            </CardContent>
          </Card>

          {/* Historial de estados */}
          {statusLog.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Historial de estados</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-1.5">
                {statusLog.map(log => (
                  <div key={log.id} className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{ORDER_STATUS_LABELS[log.to_status]}</span>
                    {log.from_status ? ` ← ${ORDER_STATUS_LABELS[log.from_status]}` : ' (inicio)'}
                    <span className="block text-xs opacity-70">{formatDateTime(log.changed_at)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

        </div>
      </div>

      {/* Dialogs */}
      <EditOrderDialog order={order} open={editOpen} onClose={() => setEditOpen(false)} onSave={handleUpdateOrder} />

      <AlertDialog open={!!confirmStatus} onOpenChange={v => !v && setConfirmStatus(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cambiar estado</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Cambiar <strong>{order.order_number}</strong> a{' '}
              <strong>{confirmStatus ? ORDER_STATUS_LABELS[confirmStatus] : ''}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmStatus && handleStatusChange(confirmStatus)}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
