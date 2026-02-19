import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { type WorkOrderPart } from '@/types'

export function useWorkOrderParts(workOrderId: string) {
  const [parts, setParts] = useState<WorkOrderPart[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!workOrderId) return
    fetchParts()
  }, [workOrderId])

  async function fetchParts() {
    setLoading(true)
    const { data } = await supabase
      .from('work_order_parts')
      .select('*')
      .eq('work_order_id', workOrderId)
      .order('description')
    setParts((data as WorkOrderPart[]) ?? [])
    setLoading(false)
  }

  async function addPart(values: Omit<WorkOrderPart, 'id'>) {
    const { data, error } = await supabase
      .from('work_order_parts')
      .insert(values)
      .select()
      .single()
    if (!error && data) setParts(prev => [...prev, data as WorkOrderPart])
    return { error: error?.message ?? null }
  }

  async function updatePart(id: string, values: Partial<Omit<WorkOrderPart, 'id' | 'work_order_id'>>) {
    const { data, error } = await supabase
      .from('work_order_parts')
      .update(values)
      .eq('id', id)
      .select()
      .single()
    if (!error && data) setParts(prev => prev.map(p => p.id === id ? data as WorkOrderPart : p))
    return { error: error?.message ?? null }
  }

  async function deletePart(id: string) {
    const { error } = await supabase
      .from('work_order_parts')
      .delete()
      .eq('id', id)
    if (!error) setParts(prev => prev.filter(p => p.id !== id))
    return { error: error?.message ?? null }
  }

  const totalParts = parts.reduce((sum, p) => sum + p.quantity * p.unit_price, 0)

  return { parts, loading, addPart, updatePart, deletePart, totalParts }
}
