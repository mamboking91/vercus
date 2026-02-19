import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { type PartsCatalogItem } from '@/types'
import { useAuth } from '@/hooks/useAuth'

export function usePartsCatalog() {
  const { user } = useAuth()
  const [parts, setParts] = useState<PartsCatalogItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    fetchParts()
  }, [user])

  async function fetchParts() {
    setLoading(true)
    const { data } = await supabase
      .from('parts_catalog')
      .select('*')
      .eq('user_id', user!.id)
      .order('description')
    setParts((data as PartsCatalogItem[]) ?? [])
    setLoading(false)
  }

  async function createPart(values: Omit<PartsCatalogItem, 'id' | 'user_id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('parts_catalog')
      .insert({ ...values, user_id: user!.id })
      .select()
      .single()
    if (!error && data) setParts(prev => [...prev, data as PartsCatalogItem].sort((a, b) => a.description.localeCompare(b.description)))
    return { error: error?.message ?? null }
  }

  async function updatePart(id: string, values: Partial<Omit<PartsCatalogItem, 'id' | 'user_id' | 'created_at'>>) {
    const { data, error } = await supabase
      .from('parts_catalog')
      .update(values)
      .eq('id', id)
      .eq('user_id', user!.id)
      .select()
      .single()
    if (!error && data) setParts(prev => prev.map(p => p.id === id ? data as PartsCatalogItem : p))
    return { error: error?.message ?? null }
  }

  async function deletePart(id: string) {
    const { error } = await supabase
      .from('parts_catalog')
      .delete()
      .eq('id', id)
      .eq('user_id', user!.id)
    if (!error) setParts(prev => prev.filter(p => p.id !== id))
    return { error: error?.message ?? null }
  }

  // Marcas únicas para el filtro
  const brands = [...new Set(parts.map(p => p.brand).filter(Boolean) as string[])].sort()

  return { parts, loading, brands, createPart, updatePart, deletePart }
}
