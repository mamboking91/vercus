import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { type LaborType } from '@/types'
import { useAuth } from '@/hooks/useAuth'

export function useLaborTypes() {
  const { user } = useAuth()
  const [laborTypes, setLaborTypes] = useState<LaborType[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    fetchLaborTypes()
  }, [user])

  async function fetchLaborTypes() {
    setLoading(true)
    const { data } = await supabase
      .from('labor_types')
      .select('*')
      .eq('user_id', user!.id)
      .order('name')
    setLaborTypes((data as LaborType[]) ?? [])
    setLoading(false)
  }

  async function createLaborType(values: { name: string; hourly_rate: number }) {
    const { error } = await supabase
      .from('labor_types')
      .insert({ ...values, user_id: user!.id })
    if (!error) await fetchLaborTypes()
    return { error: error?.message ?? null }
  }

  async function updateLaborType(id: string, values: { name: string; hourly_rate: number }) {
    const { error } = await supabase
      .from('labor_types')
      .update(values)
      .eq('id', id)
      .eq('user_id', user!.id)
    if (!error) await fetchLaborTypes()
    return { error: error?.message ?? null }
  }

  async function deleteLaborType(id: string) {
    const { error } = await supabase
      .from('labor_types')
      .delete()
      .eq('id', id)
      .eq('user_id', user!.id)
    if (!error) setLaborTypes(prev => prev.filter(lt => lt.id !== id))
    return { error: error?.message ?? null }
  }

  return { laborTypes, loading, createLaborType, updateLaborType, deleteLaborType }
}
