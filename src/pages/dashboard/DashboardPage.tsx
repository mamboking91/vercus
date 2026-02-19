import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClipboardList, Euro, CheckCircle2, Clock } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, type WorkOrder, type WorkOrderStatus } from '@/types'

const STATUS_LEFT_BORDER: Record<WorkOrderStatus, string> = {
  recibida:         'border-l-gray-300',
  presupuestada:    'border-l-yellow-400',
  aceptada:         'border-l-blue-400',
  esperando_piezas: 'border-l-orange-400',
  en_reparacion:    'border-l-purple-400',
  lista:            'border-l-green-500',
  entregada:        'border-l-slate-300',
}

interface DashboardStats {
  activeOrders: number
  readyOrders: number
  monthRevenue: number
  pendingAmount: number
}

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState<DashboardStats>({ activeOrders: 0, readyOrders: 0, monthRevenue: 0, pendingAmount: 0 })
  const [recentOrders, setRecentOrders] = useState<WorkOrder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    fetchDashboard()
  }, [user])

  async function fetchDashboard() {
    setLoading(true)
    const userId = user!.id
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

    const [ordersRes, recentRes, paymentsRes] = await Promise.all([
      // All non-delivered orders
      supabase
        .from('work_orders')
        .select('id, status')
        .eq('user_id', userId)
        .neq('status', 'entregada'),

      // 8 most recent orders with client join
      supabase
        .from('work_orders')
        .select('*, client:clients(id, name)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(8),

      // Payments this month
      supabase
        .from('payments')
        .select('amount, work_order_id')
        .gte('date', monthStart)
        .lte('date', monthEnd),
    ])

    const orders: { id: string; status: string }[] = ordersRes.data ?? []
    const activeOrders = orders.length
    const readyOrders = orders.filter(o => o.status === 'lista').length

    const monthRevenue = (paymentsRes.data ?? []).reduce((s: number, p: { amount: number }) => s + p.amount, 0)

    // Pending: sum all parts+labor of active orders minus all payments
    // We do a simpler approach: total from parts+labor for active orders
    const activeIds = orders.map(o => o.id)
    let pendingAmount = 0
    if (activeIds.length > 0) {
      const [partsRes, laborRes, allPaymentsRes] = await Promise.all([
        supabase.from('work_order_parts').select('quantity, unit_price, work_order_id').in('work_order_id', activeIds),
        supabase.from('work_order_labor').select('hours, unit_rate, work_order_id').in('work_order_id', activeIds),
        supabase.from('payments').select('amount, work_order_id').in('work_order_id', activeIds),
      ])
      const totalBilled = [
        ...(partsRes.data ?? []).map((p: { quantity: number; unit_price: number }) => p.quantity * p.unit_price),
        ...(laborRes.data ?? []).map((l: { hours: number; unit_rate: number }) => l.hours * l.unit_rate),
      ].reduce((s, v) => s + v, 0)
      const totalPaid = (allPaymentsRes.data ?? []).reduce((s: number, p: { amount: number }) => s + p.amount, 0)
      pendingAmount = Math.max(0, totalBilled - totalPaid)
    }

    setStats({ activeOrders, readyOrders, monthRevenue, pendingAmount })
    setRecentOrders((recentRes.data as WorkOrder[]) ?? [])
    setLoading(false)
  }

  const kpis = [
    {
      label: 'Órdenes activas',
      value: loading ? '…' : String(stats.activeOrders),
      icon: ClipboardList,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Ingresos del mes',
      value: loading ? '…' : formatCurrency(stats.monthRevenue),
      icon: Euro,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      label: 'Pendiente de cobro',
      value: loading ? '…' : formatCurrency(stats.pendingAmount),
      icon: Euro,
      color: stats.pendingAmount > 0 ? 'text-orange-600' : 'text-muted-foreground',
      bg: stats.pendingAmount > 0 ? 'bg-orange-50' : 'bg-muted/30',
    },
    {
      label: 'Listas para recoger',
      value: loading ? '…' : String(stats.readyOrders),
      icon: CheckCircle2,
      color: stats.readyOrders > 0 ? 'text-green-700' : 'text-muted-foreground',
      bg: stats.readyOrders > 0 ? 'bg-green-50' : 'bg-muted/30',
    },
  ]

  return (
    <div>
      <div className="hidden md:block">
        <PageHeader title="Dashboard" description="Resumen del taller" />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {kpis.map(kpi => (
          <Card key={kpi.label}>
            <CardContent className="pt-5 pb-5">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center mb-3 ${kpi.bg}`}>
                <kpi.icon className={`h-4.5 w-4.5 h-[18px] w-[18px] ${kpi.color}`} />
              </div>
              <p className={`text-2xl font-bold leading-tight ${kpi.color}`}>{kpi.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{kpi.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Órdenes recientes */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4" /> Órdenes recientes
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/ordenes')}>Ver todas</Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-muted rounded animate-pulse" />)}</div>
          ) : recentOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Sin órdenes todavía.</p>
          ) : (
            <div className="space-y-2">
              {recentOrders.map(order => (
                <button
                  key={order.id}
                  onClick={() => navigate(`/ordenes/${order.id}`)}
                  className={`w-full flex items-center justify-between pl-4 pr-3 py-3 rounded-lg border border-l-4 bg-card hover:bg-muted/40 transition-colors text-left ${STATUS_LEFT_BORDER[order.status]}`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{order.order_number}</p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {order.client?.name ?? '—'} · {formatDate(order.created_at)}
                    </p>
                  </div>
                  <span className={`ml-3 shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${ORDER_STATUS_COLORS[order.status]}`}>
                    {ORDER_STATUS_LABELS[order.status]}
                  </span>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
