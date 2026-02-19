import { useState } from 'react'
import { Plus, Trash2, TrendingUp, TrendingDown, Wallet } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { useFinances } from '@/hooks/useFinances'
import { toast } from '@/hooks/use-toast'
import { formatCurrency, formatDate } from '@/lib/utils'

// ─── Formulario añadir gasto ──────────────────────────────────────────────────

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
  const { expenses, monthlyData, loading, totalIngresos, totalGastos, beneficio, addExpense, deleteExpense } = useFinances()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

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

  return (
    <div>
      <PageHeader
        title="Finanzas"
        description={`Resumen del año ${year}`}
        action={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />Nuevo gasto
          </Button>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-5 pb-4 flex items-center gap-4">
            <div className="p-2 rounded-full bg-green-100">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Ingresos totales</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(totalIngresos)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4 flex items-center gap-4">
            <div className="p-2 rounded-full bg-red-100">
              <TrendingDown className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Gastos totales</p>
              <p className="text-xl font-bold text-red-500">{formatCurrency(totalGastos)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4 flex items-center gap-4">
            <div className={`p-2 rounded-full ${beneficio >= 0 ? 'bg-blue-100' : 'bg-orange-100'}`}>
              <Wallet className={`h-5 w-5 ${beneficio >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Beneficio neto</p>
              <p className={`text-xl font-bold ${beneficio >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>{formatCurrency(beneficio)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfica mensual */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Ingresos vs Gastos por mes ({year})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-64 bg-muted/40 rounded animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthlyData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${v}€`} />
                <Tooltip formatter={(v) => formatCurrency(Number(v ?? 0))} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="ingresos" name="Ingresos" fill="#22c55e" radius={[3, 3, 0, 0]} />
                <Bar dataKey="gastos" name="Gastos" fill="#ef4444" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Tabla de gastos */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Gastos registrados ({year})</CardTitle>
            <Button size="sm" variant="outline" onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />Añadir
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-10 bg-muted rounded animate-pulse" />)}</div>
          ) : expenses.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Sin gastos registrados este año.</p>
          ) : (
            <div className="space-y-2">
              {expenses.map(exp => (
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
