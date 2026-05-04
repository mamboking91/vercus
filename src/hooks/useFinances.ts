import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { type Expense, type PaymentMethod } from '@/types'
import { useAuth } from '@/hooks/useAuth'

export interface MonthlyData {
  month: string
  ingresos: number
  gastos: number
}

export interface PendingOrder {
  orderId: string
  orderNumber: string
  clientId: string
  clientName: string
  clientPhone: string | null
  billed: number
  paid: number
  pending: number
}

export interface RecentPayment {
  id: string
  amount: number
  date: string
  method: PaymentMethod
  notes: string | null
  orderId: string
  orderNumber: string
  clientId: string
  clientName: string
  clientPhone: string | null
}

export function useFinances() {
  const { user } = useAuth()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([])
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([])
  const [recentPayments, setRecentPayments] = useState<RecentPayment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    fetchData()
  }, [user])

  async function fetchData() {
    setLoading(true)
    const year = new Date().getFullYear()
    const from = `${year}-01-01`
    const to = `${year}-12-31`

    const [paymentsRes, expensesRes, activeOrdersRes, recentPaymentsRes] = await Promise.all([
      // Payments this year for the chart
      supabase
        .from('payments')
        .select('amount, date, work_order_id')
        .gte('date', from)
        .lte('date', to),
      // Expenses this year
      supabase
        .from('expenses')
        .select('*')
        .gte('date', from)
        .lte('date', to)
        .order('date', { ascending: false }),
      // All non-delivered orders with client info
      supabase
        .from('work_orders')
        .select('id, order_number, status, client:clients(id, name, phone)')
        .neq('status', 'entregada'),
      // Recent payments with order + client info
      supabase
        .from('payments')
        .select('id, amount, date, method, notes, work_order:work_orders(id, order_number, client:clients(id, name, phone))')
        .order('date', { ascending: false })
        .limit(60),
    ])

    // ── Monthly chart data ──────────────────────────────────────────────────
    const monthNames = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
    const monthly: Record<number, MonthlyData> = {}
    for (let i = 0; i < 12; i++) {
      monthly[i] = { month: monthNames[i], ingresos: 0, gastos: 0 }
    }
    for (const p of (paymentsRes.data ?? [])) {
      const m = new Date(p.date).getUTCMonth()
      monthly[m].ingresos += p.amount
    }
    for (const e of (expensesRes.data ?? [])) {
      const m = new Date(e.date).getUTCMonth()
      monthly[m].gastos += e.amount
    }
    setMonthlyData(Object.values(monthly))
    setExpenses((expensesRes.data as Expense[]) ?? [])

    // ── Recent payments ─────────────────────────────────────────────────────
    const rp: RecentPayment[] = ((recentPaymentsRes.data as any[]) ?? [])
      .filter(p => p.work_order)
      .map(p => ({
        id: p.id,
        amount: p.amount,
        date: p.date,
        method: p.method as PaymentMethod,
        notes: p.notes ?? null,
        orderId: p.work_order.id,
        orderNumber: p.work_order.order_number,
        clientId: p.work_order.client?.id ?? '',
        clientName: p.work_order.client?.name ?? '—',
        clientPhone: p.work_order.client?.phone ?? null,
      }))
    setRecentPayments(rp)

    // ── Pending per order ───────────────────────────────────────────────────
    const activeOrders = (activeOrdersRes.data as any[]) ?? []
    const activeIds = activeOrders.map((o: any) => o.id)

    if (activeIds.length > 0) {
      const [partsRes, laborRes, extrasRes, paidRes] = await Promise.all([
        supabase
          .from('work_order_parts')
          .select('work_order_id, quantity, unit_price')
          .in('work_order_id', activeIds),
        supabase
          .from('work_order_labor')
          .select('work_order_id, hours, unit_rate')
          .in('work_order_id', activeIds),
        supabase
          .from('work_order_extras')
          .select('work_order_id, amount')
          .in('work_order_id', activeIds),
        supabase
          .from('payments')
          .select('work_order_id, amount')
          .in('work_order_id', activeIds),
      ])

      const billed: Record<string, number> = {}
      for (const p of (partsRes.data ?? [])) {
        billed[p.work_order_id] = (billed[p.work_order_id] ?? 0) + p.quantity * p.unit_price
      }
      for (const l of (laborRes.data ?? [])) {
        billed[l.work_order_id] = (billed[l.work_order_id] ?? 0) + l.hours * l.unit_rate
      }
      for (const e of (extrasRes.data ?? [])) {
        billed[e.work_order_id] = (billed[e.work_order_id] ?? 0) + e.amount
      }
      const paid: Record<string, number> = {}
      for (const p of (paidRes.data ?? [])) {
        paid[p.work_order_id] = (paid[p.work_order_id] ?? 0) + p.amount
      }

      const pending: PendingOrder[] = activeOrders
        .map((o: any) => {
          const b = billed[o.id] ?? 0
          const pa = paid[o.id] ?? 0
          return {
            orderId: o.id,
            orderNumber: o.order_number,
            clientId: o.client?.id ?? '',
            clientName: o.client?.name ?? 'Sin cliente',
            clientPhone: o.client?.phone ?? null,
            billed: b,
            paid: pa,
            pending: Math.max(0, b - pa),
          }
        })
        .filter((o: PendingOrder) => o.pending > 0)
        .sort((a: PendingOrder, b: PendingOrder) => b.pending - a.pending)

      setPendingOrders(pending)
    } else {
      setPendingOrders([])
    }

    setLoading(false)
  }

  async function addExpense(values: { date: string; description: string; category: string; amount: number }) {
    const { data, error } = await supabase
      .from('expenses')
      .insert({ ...values, user_id: user!.id })
      .select()
      .single()
    if (!error && data) {
      const e = data as Expense
      setExpenses(prev => [e, ...prev])
      const m = new Date(e.date).getUTCMonth()
      setMonthlyData(prev => prev.map((md, i) => i === m ? { ...md, gastos: md.gastos + e.amount } : md))
    }
    return { error: error?.message ?? null }
  }

  async function deleteExpense(id: string) {
    const exp = expenses.find(e => e.id === id)
    const { error } = await supabase.from('expenses').delete().eq('id', id)
    if (!error && exp) {
      setExpenses(prev => prev.filter(e => e.id !== id))
      const m = new Date(exp.date).getUTCMonth()
      setMonthlyData(prev => prev.map((md, i) => i === m ? { ...md, gastos: md.gastos - exp.amount } : md))
    }
    return { error: error?.message ?? null }
  }

  const totalIngresos = monthlyData.reduce((s, m) => s + m.ingresos, 0)
  const totalGastos = monthlyData.reduce((s, m) => s + m.gastos, 0)
  const beneficio = totalIngresos - totalGastos
  const totalPendiente = pendingOrders.reduce((s, o) => s + o.pending, 0)

  return {
    expenses, monthlyData, pendingOrders, recentPayments,
    loading, totalIngresos, totalGastos, beneficio, totalPendiente,
    addExpense, deleteExpense, refetch: fetchData,
  }
}
