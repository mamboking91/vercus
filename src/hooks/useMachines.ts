import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { type Machine } from '@/types'
import { useAuth } from '@/hooks/useAuth'

export function useMachines(clientId?: string) {
  const { user } = useAuth()
  const [machines, setMachines] = useState<Machine[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    fetchMachines()
  }, [user, clientId])

  async function fetchMachines() {
    setLoading(true)
    let query = supabase
      .from('machines')
      .select('*, client:clients(id, name, phone)')
      .order('brand')
    if (clientId) query = query.eq('client_id', clientId)
    const { data } = await query
    setMachines((data as Machine[]) ?? [])
    setLoading(false)
  }

  async function getMachine(id: string): Promise<Machine | null> {
    const { data } = await supabase
      .from('machines')
      .select('*, client:clients(id, name, phone, email, address)')
      .eq('id', id)
      .single()
    return data as Machine | null
  }

  async function createMachine(values: Omit<Machine, 'id' | 'user_id' | 'created_at' | 'client'>) {
    const { data, error } = await supabase
      .from('machines')
      .insert({ ...values, user_id: user!.id })
      .select('*, client:clients(id, name, phone)')
      .single()
    if (!error && data) setMachines(prev => [...prev, data as Machine])
    return { data: data as Machine | null, error: error?.message ?? null }
  }

  async function updateMachine(id: string, values: Partial<Omit<Machine, 'id' | 'user_id' | 'created_at' | 'client'>>) {
    const { data, error } = await supabase
      .from('machines')
      .update(values)
      .eq('id', id)
      .select('*, client:clients(id, name, phone)')
      .single()
    if (!error && data) setMachines(prev => prev.map(m => m.id === id ? data as Machine : m))
    return { error: error?.message ?? null }
  }

  async function deleteMachine(id: string) {
    const { error } = await supabase
      .from('machines')
      .delete()
      .eq('id', id)
    if (!error) setMachines(prev => prev.filter(m => m.id !== id))
    return { error: error?.message ?? null }
  }

  return { machines, loading, getMachine, createMachine, updateMachine, deleteMachine, refetch: fetchMachines }
}
