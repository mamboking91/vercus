import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { type WorkOrder, type WorkOrderStatus } from '@/types'
import { useAuth } from '@/hooks/useAuth'

interface Filters {
  status?: WorkOrderStatus | 'all'
  clientId?: string
  search?: string
}

export function useWorkOrders(filters: Filters = {}) {
  const { user } = useAuth()
  const [orders, setOrders] = useState<WorkOrder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    fetchOrders()
  }, [user, filters.status, filters.clientId, filters.search])

  async function fetchOrders() {
    setLoading(true)
    let query = supabase
      .from('work_orders')
      .select('*, client:clients(id, name, phone), machine:machines(id, brand, model, type)')
      .order('created_at', { ascending: false })

    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status)
    }
    if (filters.clientId) {
      query = query.eq('client_id', filters.clientId)
    }
    if (filters.search?.trim()) {
      const q = `%${filters.search.trim()}%`
      query = query.or(`order_number.ilike.${q},problem_description.ilike.${q}`)
    }

    const { data } = await query
    setOrders((data as WorkOrder[]) ?? [])
    setLoading(false)
  }

  async function createOrder(values: {
    client_id: string
    machine_id?: string | null
    problem_description?: string
    diagnosis?: string
    internal_notes?: string
    estimated_delivery?: string | null
  }) {
    // Generar número correlativo para el año actual
    const year = new Date().getFullYear()
    const { count } = await supabase
      .from('work_orders')
      .select('*', { count: 'exact', head: true })
      .like('order_number', `ORD-${year}-%`)

    const seq = (count ?? 0) + 1
    const order_number = `ORD-${year}-${String(seq).padStart(3, '0')}`

    const { data, error } = await supabase
      .from('work_orders')
      .insert({
        ...values,
        machine_id: values.machine_id || null,
        order_number,
        status: 'recibida',
        user_id: user!.id,
      })
      .select('*, client:clients(id, name, phone), machine:machines(id, brand, model, type)')
      .single()

    if (!error && data) {
      // Registrar estado inicial en el log
      await supabase.from('work_order_status_log').insert({
        work_order_id: data.id,
        from_status: null,
        to_status: 'recibida',
      })
      setOrders(prev => [data as WorkOrder, ...prev])
    }

    return { data: data as WorkOrder | null, error: error?.message ?? null }
  }

  async function updateOrderStatus(id: string, fromStatus: WorkOrderStatus, toStatus: WorkOrderStatus) {
    const { error } = await supabase
      .from('work_orders')
      .update({ status: toStatus })
      .eq('id', id)

    if (!error) {
      await supabase.from('work_order_status_log').insert({
        work_order_id: id,
        from_status: fromStatus,
        to_status: toStatus,
      })
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: toStatus } : o))
    }

    return { error: error?.message ?? null }
  }

  async function updateOrder(id: string, values: Partial<Pick<WorkOrder, 'problem_description' | 'diagnosis' | 'internal_notes' | 'estimated_delivery' | 'machine_id' | 'client_id'>>) {
    const { error } = await supabase
      .from('work_orders')
      .update(values)
      .eq('id', id)

    if (!error) {
      setOrders(prev => prev.map(o => o.id === id ? { ...o, ...values } : o))
    }

    return { error: error?.message ?? null }
  }

  async function deleteOrder(id: string) {
    const { error } = await supabase
      .from('work_orders')
      .delete()
      .eq('id', id)
    if (!error) setOrders(prev => prev.filter(o => o.id !== id))
    return { error: error?.message ?? null }
  }

  async function getOrder(id: string): Promise<WorkOrder | null> {
    const { data } = await supabase
      .from('work_orders')
      .select('*, client:clients(id, name, phone, email), machine:machines(id, brand, model, type, serial_number)')
      .eq('id', id)
      .single()
    return data as WorkOrder | null
  }

  return { orders, loading, createOrder, updateOrder, updateOrderStatus, deleteOrder, getOrder, refetch: fetchOrders }
}
