import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, ClipboardList } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useWorkOrders } from '@/hooks/useWorkOrders'
import { formatDate } from '@/lib/utils'
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, type WorkOrderStatus } from '@/types'

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

  const { orders, loading } = useWorkOrders({
    status: status !== 'all' ? status : undefined,
    search: search || undefined,
  })

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
              onClick={() => navigate(`/ordenes/${order.id}`)}
              className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 cursor-pointer transition-colors gap-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm">{order.order_number}</span>
                  {order.client && (
                    <span className="text-sm text-muted-foreground">· {order.client.name}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  {order.machine && (
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
          ))}
        </div>
      )}
    </div>
  )
}
