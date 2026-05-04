import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { type WorkOrderExtra } from '@/types'

export function useWorkOrderExtras(workOrderId: string) {
  const [extras, setExtras] = useState<WorkOrderExtra[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!workOrderId) return
    fetchExtras()
  }, [workOrderId])

  async function fetchExtras() {
    setLoading(true)
    const { data } = await supabase
      .from('work_order_extras')
      .select('*')
      .eq('work_order_id', workOrderId)
      .order('description')
    setExtras((data as WorkOrderExtra[]) ?? [])
    setLoading(false)
  }

  async function addExtra(values: Omit<WorkOrderExtra, 'id'>) {
    const { data, error } = await supabase
      .from('work_order_extras')
      .insert(values)
      .select()
      .single()
    if (!error && data) setExtras(prev => [...prev, data as WorkOrderExtra])
    return { error: error?.message ?? null }
  }

  async function updateExtra(id: string, values: Partial<Omit<WorkOrderExtra, 'id' | 'work_order_id'>>) {
    const { data, error } = await supabase
      .from('work_order_extras')
      .update(values)
      .eq('id', id)
      .select()
      .single()
    if (!error && data) setExtras(prev => prev.map(e => e.id === id ? data as WorkOrderExtra : e))
    return { error: error?.message ?? null }
  }

  async function deleteExtra(id: string) {
    const { error } = await supabase.from('work_order_extras').delete().eq('id', id)
    if (!error) setExtras(prev => prev.filter(e => e.id !== id))
    return { error: error?.message ?? null }
  }

  const totalExtras = extras.reduce((s, e) => s + e.amount, 0)

  return { extras, loading, addExtra, updateExtra, deleteExtra, totalExtras }
}
