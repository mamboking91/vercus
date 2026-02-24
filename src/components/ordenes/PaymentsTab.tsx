import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { usePayments } from '@/hooks/usePayments'
import { toast } from '@/hooks/use-toast'
import { formatCurrency, formatDate } from '@/lib/utils'
import { type PaymentMethod, PAYMENT_METHOD_LABELS } from '@/types'

interface PaymentDialogProps {
  open: boolean
  onClose: () => void
  onAdd: (values: { amount: number; date: string; method: PaymentMethod; notes?: string | null }) => Promise<void>
  pending: number
}

function PaymentDialog({ open, onClose, onAdd, pending }: PaymentDialogProps) {
  const today = new Date().toISOString().split('T')[0]
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(today)
  const [method, setMethod] = useState<PaymentMethod>('efectivo')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const amt = parseFloat(amount)
    if (isNaN(amt) || amt <= 0) return
    setSaving(true)
    await onAdd({ amount: amt, date, method, notes: notes.trim() || null })
    setSaving(false)
    setAmount(''); setNotes('')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Registrar pago</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="pay-amount">Importe (€) <span className="text-destructive">*</span></Label>
              {pending > 0 && (
                <span className="text-xs text-muted-foreground">Pendiente: <strong>{formatCurrency(pending)}</strong></span>
              )}
            </div>
            <Input id="pay-amount" type="number" min="0.01" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder={pending > 0 ? String(pending) : '0.00'} required autoFocus />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pay-date">Fecha</Label>
            <Input id="pay-date" type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Forma de pago</Label>
            <Select value={method} onValueChange={v => setMethod(v as PaymentMethod)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map(m => (
                  <SelectItem key={m} value={m}>{PAYMENT_METHOD_LABELS[m]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="pay-notes">Notas</Label>
            <Textarea id="pay-notes" value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Referencia de transferencia, etc." />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={saving || !amount}>{saving ? 'Guardando…' : 'Registrar'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

interface Props {
  workOrderId: string
  totalAmount: number
}

export function PaymentsTab({ workOrderId, totalAmount }: Props) {
  const { payments, loading, totalPaid, addPayment, deletePayment } = usePayments(workOrderId)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const pending = Math.max(0, totalAmount - totalPaid)

  async function handleAdd(values: { amount: number; date: string; method: PaymentMethod; notes?: string | null }) {
    const { error } = await addPayment(values)
    if (error) toast({ title: 'Error al registrar', description: error, variant: 'destructive' })
    else toast({ title: 'Pago registrado' })
  }

  async function handleDelete() {
    if (!deleteTarget) return
    const { error } = await deletePayment(deleteTarget)
    if (error) toast({ title: 'Error al eliminar', variant: 'destructive' })
    else toast({ title: 'Pago eliminado' })
    setDeleteTarget(null)
  }

  if (loading) return <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-10 rounded bg-muted animate-pulse" />)}</div>

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">Total obra</p>
          <p className="font-semibold text-sm">{formatCurrency(totalAmount)}</p>
        </div>
        <div className="rounded-lg border p-3 text-center bg-green-50">
          <p className="text-xs text-muted-foreground mb-1">Pagado</p>
          <p className="font-semibold text-sm text-green-700">{formatCurrency(totalPaid)}</p>
        </div>
        <div className={`rounded-lg border p-3 text-center ${pending > 0 ? 'bg-orange-50' : 'bg-green-50'}`}>
          <p className="text-xs text-muted-foreground mb-1">Pendiente</p>
          <p className={`font-semibold text-sm ${pending > 0 ? 'text-orange-700' : 'text-green-700'}`}>{formatCurrency(pending)}</p>
        </div>
      </div>

      <div className="flex justify-end">
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" />Registrar pago
        </Button>
      </div>

      {payments.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">Sin pagos registrados.</p>
      ) : (
        <div className="space-y-2">
          {payments.map(p => (
            <div key={p.id} className="flex items-center justify-between rounded-lg border px-4 py-3 gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm">{formatCurrency(p.amount)}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {formatDate(p.date)} · {PAYMENT_METHOD_LABELS[p.method]}
                  {p.notes ? ` · ${p.notes}` : ''}
                </p>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(p.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <PaymentDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onAdd={handleAdd} pending={pending} />

      <AlertDialog open={!!deleteTarget} onOpenChange={v => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar pago?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
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
