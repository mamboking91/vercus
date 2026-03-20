import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { type Client } from '@/types'
import { useAuth } from '@/hooks/useAuth'

export function useClients() {
  const { user } = useAuth()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    fetchClients()
  }, [user])

  async function fetchClients() {
    setLoading(true)
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('name')
    if (error) setError(error.message)
    else setClients((data as Client[]) ?? [])
    setLoading(false)
  }

  async function createClient(values: Omit<Client, 'id' | 'user_id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('clients')
      .insert({ ...values, user_id: user!.id })
      .select()
      .single()
    if (!error && data) setClients(prev => [...prev, data as Client].sort((a, b) => a.name.localeCompare(b.name)))
    return { data: data as Client | null, error: error?.message ?? null }
  }

  async function updateClient(id: string, values: Partial<Omit<Client, 'id' | 'user_id' | 'created_at'>>) {
    const { data, error } = await supabase
      .from('clients')
      .update(values)
      .eq('id', id)
      .select()
      .single()
    if (!error && data) setClients(prev => prev.map(c => c.id === id ? data as Client : c).sort((a, b) => a.name.localeCompare(b.name)))
    return { error: error?.message ?? null }
  }

  async function deleteClient(id: string) {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id)
    if (!error) setClients(prev => prev.filter(c => c.id !== id))
    return { error: error?.message ?? null }
  }

  async function getClient(id: string): Promise<Client | null> {
    const { data } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single()
    return data as Client | null
  }

  return { clients, loading, error, createClient, updateClient, deleteClient, getClient, refetch: fetchClients }
}
