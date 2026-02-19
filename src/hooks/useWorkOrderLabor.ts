import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { type WorkOrderLabor } from '@/types'

export function useWorkOrderLabor(workOrderId: string) {
  const [laborEntries, setLaborEntries] = useState<WorkOrderLabor[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!workOrderId) return
    fetchLabor()
  }, [workOrderId])

  async function fetchLabor() {
    setLoading(true)
    const { data } = await supabase
      .from('work_order_labor')
      .select('*, labor_type:labor_types(id, name, hourly_rate)')
      .eq('work_order_id', workOrderId)
    setLaborEntries((data as WorkOrderLabor[]) ?? [])
    setLoading(false)
  }

  async function addLabor(values: Omit<WorkOrderLabor, 'id' | 'labor_type'>) {
    const { data, error } = await supabase
      .from('work_order_labor')
      .insert(values)
      .select('*, labor_type:labor_types(id, name, hourly_rate)')
      .single()
    if (!error && data) setLaborEntries(prev => [...prev, data as WorkOrderLabor])
    return { error: error?.message ?? null }
  }

  async function updateLabor(id: string, values: Partial<Omit<WorkOrderLabor, 'id' | 'work_order_id' | 'labor_type'>>) {
    const { data, error } = await supabase
      .from('work_order_labor')
      .update(values)
      .eq('id', id)
      .select('*, labor_type:labor_types(id, name, hourly_rate)')
      .single()
    if (!error && data) setLaborEntries(prev => prev.map(l => l.id === id ? data as WorkOrderLabor : l))
    return { error: error?.message ?? null }
  }

  async function deleteLabor(id: string) {
    const { error } = await supabase
      .from('work_order_labor')
      .delete()
      .eq('id', id)
    if (!error) setLaborEntries(prev => prev.filter(l => l.id !== id))
    return { error: error?.message ?? null }
  }

  const totalLabor = laborEntries.reduce((sum, l) => sum + l.hours * l.unit_rate, 0)

  return { laborEntries, loading, addLabor, updateLabor, deleteLabor, totalLabor }
}
