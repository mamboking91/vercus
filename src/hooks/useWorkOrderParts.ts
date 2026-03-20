import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { type WorkOrderPart } from '@/types'
import { useAuth } from '@/hooks/useAuth'

export function useWorkOrderParts(workOrderId: string) {
  const { user } = useAuth()
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

  // Sincroniza una pieza al catálogo si no existe ya (por código o descripción)
  async function syncToCatalog(values: Omit<WorkOrderPart, 'id'>) {
    if (!user) return
    const code = values.code?.trim()
    const description = values.description.trim()

    // Busca duplicado: primero por código (si lo hay), luego por descripción exacta
    const matchField = code ? 'code' : null
    let existsQuery = supabase
      .from('parts_catalog')
      .select('id', { count: 'exact', head: true })

    if (matchField) {
      existsQuery = existsQuery.eq('code', code!)
    } else {
      existsQuery = existsQuery.ilike('description', description)
    }

    const { count } = await existsQuery
    if ((count ?? 0) > 0) return // ya existe en el catálogo

    await supabase.from('parts_catalog').insert({
      user_id: user.id,
      code: code || null,
      brand: values.brand ?? null,
      description,
      sell_price: values.unit_price,
      notes: null,
      url: null,
    })
  }

  async function addPart(values: Omit<WorkOrderPart, 'id'>) {
    const { data, error } = await supabase
      .from('work_order_parts')
      .insert(values)
      .select()
      .single()
    if (!error && data) {
      setParts(prev => [...prev, data as WorkOrderPart])
      // Si es pieza introducida manualmente (no desde catálogo), la añade al catálogo
      if (!values.catalog_part_id) {
        syncToCatalog(values)
      }
    }
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
