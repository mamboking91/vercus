import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2, TrendingUp, TrendingDown, Wallet, AlertCircle, Phone, ChevronRight, Banknote } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { useFinances } from '@/hooks/useFinances'
import { toast } from '@/hooks/use-toast'
import { formatCurrency, formatDate } from '@/lib/utils'
import { PAYMENT_METHOD_LABELS } from '@/types'

// ─── Colores por método de pago ───────────────────────────────────────────────

const METHOD_COLORS: Record<string, string> = {
  efectivo:      'bg-green-100 text-green-800',
  transferencia: 'bg-blue-100 text-blue-800',
  tarjeta:       'bg-purple-100 text-purple-800',
  otro:          'bg-gray-100 text-gray-700',
}

// ─── Dialog añadir gasto ──────────────────────────────────────────────────────

interface AddExpenseDialogProps {
  open: boolean
  onClose: () => void
  onAdd: (values: { date: string; description: string; category: string; amount: number }) => Promise<void>
}

function AddExpenseDialog({ open, onClose, onAdd }: AddExpenseDialogProps) {
  const today = new Date().toISOString().split('T')[0]
  const [date, setDate] = useState(today)
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [amount, setAmount] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const amt = parseFloat(amount)
    if (!description.trim() || isNaN(amt) || amt <= 0) return
    setSaving(true)
    await onAdd({ date, description: description.trim(), category: category.trim() || 'General', amount: amt })
    setSaving(false)
    setDescription(''); setCategory(''); setAmount('')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Registrar gasto</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="exp-desc">Descripción <span className="text-destructive">*</span></Label>
            <Input id="exp-desc" value={description} onChange={e => setDescription(e.target.value)} placeholder="Compra de aceite, herramienta…" autoFocus required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="exp-cat">Categoría</Label>
              <Input id="exp-cat" value={category} onChange={e => setCategory(e.target.value)} placeholder="Material" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="exp-amount">Importe (€) <span className="text-destructive">*</span></Label>
              <Input id="exp-amount" type="number" min="0.01" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="exp-date">Fecha</Label>
            <Input id="exp-date" type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={saving || !description.trim() || !amount}>{saving ? 'Guardando…' : 'Registrar gasto'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function FinanzasPage() {
  const navigate = useNavigate()
  const {
    expenses, monthlyData, pendingOrders, recentPayments,
    loading, totalIngresos, totalGastos, beneficio, totalPendiente,
    addExpense, deleteExpense,
  } = useFinances()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [showAllPayments, setShowAllPayments] = useState(false)
  const [showAllExpenses, setShowAllExpenses] = useState(false)

  const year = new Date().getFullYear()

  async function handleAdd(values: { date: string; description: string; category: string; amount: number }) {
    const { error } = await addExpense(values)
    if (error) toast({ title: 'Error al registrar', description: error, variant: 'destructive' })
    else toast({ title: 'Gasto registrado' })
  }

  async function handleDelete() {
    if (!deleteTarget) return
    const { error } = await deleteExpense(deleteTarget)
    if (error) toast({ title: 'Error al eliminar', variant: 'destructive' })
    else toast({ title: 'Gasto eliminado' })
    setDeleteTarget(null)
  }

  const visiblePayments = showAllPayments ? recentPayments : recentPayments.slice(0, 8)
  const visibleExpenses = showAllExpenses ? expenses : expenses.slice(0, 8)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Finanzas"
        description={`Año ${year}`}
        action={
          <Button onClick={() => setDialogOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-1.5" />Nuevo gasto
          </Button>
        }
      />

      {/* ── KPIs ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-full bg-green-100">
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
              <p className="text-xs text-muted-foreground">Cobrado ({year})</p>
            </div>
            <p className="text-xl font-bold text-green-600">
              {loading ? '…' : formatCurrency(totalIngresos)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-full bg-red-100">
                <TrendingDown className="h-4 w-4 text-red-500" />
              </div>
              <p className="text-xs text-muted-foreground">Gastos ({year})</p>
            </div>
            <p className="text-xl font-bold text-red-500">
              {loading ? '…' : formatCurrency(totalGastos)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-1.5 rounded-full ${beneficio >= 0 ? 'bg-blue-100' : 'bg-orange-100'}`}>
                <Wallet className={`h-4 w-4 ${beneficio >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
              </div>
              <p className="text-xs text-muted-foreground">Beneficio neto</p>
            </div>
            <p className={`text-xl font-bold ${beneficio >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
              {loading ? '…' : formatCurrency(beneficio)}
            </p>
          </CardContent>
        </Card>

        <Card className={totalPendiente > 0 ? 'border-orange-300' : ''}>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-1.5 rounded-full ${totalPendiente > 0 ? 'bg-orange-100' : 'bg-muted/50'}`}>
                <AlertCircle className={`h-4 w-4 ${totalPendiente > 0 ? 'text-orange-600' : 'text-muted-foreground'}`} />
              </div>
              <p className="text-xs text-muted-foreground">Pendiente cobrar</p>
            </div>
            <p className={`text-xl font-bold ${totalPendiente > 0 ? 'text-orange-600' : 'text-muted-foreground'}`}>
              {loading ? '…' : formatCurrency(totalPendiente)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Pendiente de cobro ────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-orange-500" />
            Pendiente de cobro
            {!loading && pendingOrders.length > 0 && (
              <span className="ml-auto text-sm font-semibold text-orange-600">
                {formatCurrency(totalPendiente)}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />)}
            </div>
          ) : pendingOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No hay deudas pendientes. ¡Todo cobrado!
            </p>
          ) : (
            <div className="space-y-2">
              {pendingOrders.map(order => (
                <button
                  key={order.orderId}
                  onClick={() => navigate(`/ordenes/${order.orderId}`)}
                  className="w-full text-left flex items-center justify-between rounded-lg border border-orange-200 bg-orange-50/50 px-4 py-3 hover:bg-orange-50 transition-colors gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">{order.clientName}</span>
                      <span className="text-xs text-muted-foreground">· {order.orderNumber}</span>
                    </div>
                    {order.clientPhone && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                        <Phone className="h-3 w-3" />{order.clientPhone}
                      </span>
                    )}
                    {order.billed > 0 && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Total: {formatCurrency(order.billed)}
                        {order.paid > 0 && ` · Pagado: ${formatCurrency(order.paid)}`}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-bold text-orange-600">{formatCurrency(order.pending)}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Historial de cobros ───────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Banknote className="h-4 w-4 text-green-600" />
            Historial de cobros
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />)}
            </div>
          ) : recentPayments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Aún no hay cobros registrados.
            </p>
          ) : (
            <>
              <div className="space-y-2">
                {visiblePayments.map(payment => (
                  <button
                    key={payment.id}
                    onClick={() => navigate(`/ordenes/${payment.orderId}`)}
                    className="w-full text-left flex items-center justify-between rounded-lg border bg-card px-4 py-3 hover:bg-muted/40 transition-colors gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm">{payment.clientName}</span>
                        <span className="text-xs text-muted-foreground">· {payment.orderNumber}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-xs text-muted-foreground">{formatDate(payment.date)}</span>
                        <Badge className={`text-xs px-1.5 py-0 ${METHOD_COLORS[payment.method] ?? METHOD_COLORS.otro}`}>
                          {PAYMENT_METHOD_LABELS[payment.method]}
                        </Badge>
                        {payment.notes && (
                          <span className="text-xs text-muted-foreground truncate">{payment.notes}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-bold text-green-600">{formatCurrency(payment.amount)}</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </button>
                ))}
              </div>
              {recentPayments.length > 8 && (
                <button
                  onClick={() => setShowAllPayments(v => !v)}
                  className="mt-3 w-full text-sm text-center text-primary hover:underline py-1"
                >
                  {showAllPayments ? 'Ver menos' : `Ver todos (${recentPayments.length})`}
                </button>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* ── Gráfico mensual ───────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Ingresos vs Gastos por mes ({year})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-52 bg-muted/40 rounded animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyData} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${v}€`} width={56} />
                <Tooltip formatter={(v) => formatCurrency(Number(v ?? 0))} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="ingresos" name="Cobrado" fill="#22c55e" radius={[3, 3, 0, 0]} />
                <Bar dataKey="gastos" name="Gastos" fill="#ef4444" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* ── Gastos ───────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Gastos registrados ({year})</CardTitle>
            <Button size="sm" variant="outline" onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />Añadir
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-10 bg-muted rounded animate-pulse" />)}</div>
          ) : expenses.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Sin gastos registrados este año.</p>
          ) : (
            <>
              <div className="space-y-2">
                {visibleExpenses.map(exp => (
                  <div key={exp.id} className="flex items-center justify-between rounded-lg border px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{exp.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(exp.date)} · {exp.category}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 ml-3 shrink-0">
                      <span className="text-sm font-semibold text-red-600">{formatCurrency(exp.amount)}</span>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(exp.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              {expenses.length > 8 && (
                <button
                  onClick={() => setShowAllExpenses(v => !v)}
                  className="mt-3 w-full text-sm text-center text-primary hover:underline py-1"
                >
                  {showAllExpenses ? 'Ver menos' : `Ver todos (${expenses.length})`}
                </button>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <AddExpenseDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onAdd={handleAdd} />

      <AlertDialog open={!!deleteTarget} onOpenChange={v => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar gasto?</AlertDialogTitle>
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
