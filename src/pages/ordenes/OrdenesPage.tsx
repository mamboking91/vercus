import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, ClipboardList, Pencil, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { useWorkOrders } from '@/hooks/useWorkOrders'
import { MachineTypeBadge } from '@/components/maquinas/MachineTypeBadge'
import { toast } from '@/hooks/use-toast'
import { formatDate } from '@/lib/utils'
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, type WorkOrder, type WorkOrderStatus } from '@/types'

const STATUS_OPTIONS: { value: WorkOrderStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos los estados' },
  { value: 'recibida', label: 'Recibida' },
  { value: 'presupuestada', label: 'Presupuestada' },
  { value: 'aceptada', label: 'Aceptada' },
  { value: 'esperando_piezas', label: 'Esperando piezas' },
  { value: 'en_reparacion', label: 'En reparación' },
  { value: 'lista', label: 'Lista para recoger' },
  { value: 'entregada', label: 'Entregada' },
]

export default function OrdenesPage() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<WorkOrderStatus | 'all'>('all')
  const [search, setSearch] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<WorkOrder | null>(null)

  const { orders, loading, deleteOrder } = useWorkOrders({
    status: status !== 'all' ? status : undefined,
    search: search || undefined,
  })

  async function handleDelete() {
    if (!deleteTarget) return
    const { error } = await deleteOrder(deleteTarget.id)
    if (error) toast({ title: 'Error al eliminar', description: error, variant: 'destructive' })
    else toast({ title: 'Orden eliminada' })
    setDeleteTarget(null)
  }

  return (
    <div>
      <PageHeader
        title="Órdenes de trabajo"
        description={`${orders.length} orden${orders.length !== 1 ? 'es' : ''}`}
        action={
          <Button onClick={() => navigate('/ordenes/nueva')}>
            <Plus className="h-4 w-4 mr-2" />Nueva orden
          </Button>
        }
      />

      {/* Filtros */}
      <div className="flex gap-3 mb-4 flex-col sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nº orden o descripción…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={status} onValueChange={v => setStatus(v as WorkOrderStatus | 'all')}>
          <SelectTrigger className="w-full sm:w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map(o => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />)}
        </div>
      ) : orders.length === 0 ? (
        <Card>
          <CardContent className="py-16 flex flex-col items-center text-center">
            <ClipboardList className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="font-medium">{search || status !== 'all' ? 'Sin resultados' : 'No hay órdenes aún'}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {search || status !== 'all' ? 'Prueba con otros filtros.' : 'Crea la primera orden de trabajo.'}
            </p>
            {!search && status === 'all' && (
              <Button className="mt-4" onClick={() => navigate('/ordenes/nueva')}>
                <Plus className="h-4 w-4 mr-2" />Nueva orden
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {orders.map(order => (
            <div
              key={order.id}
              className="flex items-center rounded-lg border bg-card hover:bg-accent/50 transition-colors gap-0"
            >
              {/* Área principal clickable */}
              <div
                onClick={() => navigate(`/ordenes/${order.id}`)}
                className="flex items-center justify-between flex-1 p-4 cursor-pointer gap-3 min-w-0"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">{order.order_number}</span>
                    {order.client && (
                      <span className="text-sm text-muted-foreground">· {order.client.name}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {order.machine && <MachineTypeBadge type={order.machine.type} />}
                    {order.machine && (order.machine.brand || order.machine.model) && (
                      <span className="text-xs text-muted-foreground">
                        {[order.machine.brand, order.machine.model].filter(Boolean).join(' ')}
                      </span>
                    )}
                    {order.problem_description && (
                      <span className="text-xs text-muted-foreground truncate max-w-xs">
                        {order.machine ? '· ' : ''}{order.problem_description}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <Badge className={ORDER_STATUS_COLORS[order.status]}>
                    {ORDER_STATUS_LABELS[order.status]}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{formatDate(order.created_at)}</span>
                </div>
              </div>
              {/* Acciones rápidas */}
              <div className="flex items-center gap-0.5 pr-2 shrink-0">
                <Button
                  variant="ghost" size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={e => { e.stopPropagation(); navigate(`/ordenes/${order.id}`) }}
                  title="Editar"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost" size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={e => { e.stopPropagation(); setDeleteTarget(order) }}
                  title="Eliminar"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={v => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar orden?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará <strong>{deleteTarget?.order_number}</strong> y todos sus datos (piezas, mano de obra, pagos). Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleDelete}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
