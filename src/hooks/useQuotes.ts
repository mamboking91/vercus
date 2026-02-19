import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { type Quote, type IvaRate } from '@/types'
import { useAuth } from '@/hooks/useAuth'

export function useQuotes(workOrderId?: string) {
  const { user } = useAuth()
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    fetchQuotes()
  }, [user, workOrderId])

  async function fetchQuotes() {
    setLoading(true)
    let q = supabase
      .from('quotes')
      .select('*, work_order:work_orders(id, order_number, client:clients(id, name))')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })
    if (workOrderId) q = q.eq('work_order_id', workOrderId)
    const { data } = await q
    setQuotes((data as Quote[]) ?? [])
    setLoading(false)
  }

  async function getQuote(id: string) {
    const { data, error } = await supabase
      .from('quotes')
      .select('*, work_order:work_orders(*, client:clients(*), machine:machines(*))')
      .eq('id', id)
      .single()
    return { data: data as Quote | null, error: error?.message ?? null }
  }

  async function createQuote(values: {
    work_order_id: string
    include_iva: boolean
    iva_rate: IvaRate
    valid_until?: string | null
    notes?: string | null
  }) {
    // Generate quote number: PRE-YYYY-NNN
    const year = new Date().getFullYear()
    const prefix = `PRE-${year}-`
    const { count } = await supabase
      .from('quotes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user!.id)
      .like('quote_number', `${prefix}%`)
    const num = String((count ?? 0) + 1).padStart(3, '0')
    const quote_number = `${prefix}${num}`

    const { data, error } = await supabase
      .from('quotes')
      .insert({ ...values, user_id: user!.id, quote_number, status: 'borrador' })
      .select()
      .single()
    if (!error && data) setQuotes(prev => [data as Quote, ...prev])
    return { data: data as Quote | null, error: error?.message ?? null }
  }

  async function updateQuote(id: string, values: Partial<Omit<Quote, 'id' | 'user_id' | 'created_at' | 'quote_number'>>) {
    const { data, error } = await supabase
      .from('quotes')
      .update(values)
      .eq('id', id)
      .eq('user_id', user!.id)
      .select()
      .single()
    if (!error && data) setQuotes(prev => prev.map(q => q.id === id ? data as Quote : q))
    return { error: error?.message ?? null }
  }

  async function deleteQuote(id: string) {
    const { error } = await supabase
      .from('quotes')
      .delete()
      .eq('id', id)
      .eq('user_id', user!.id)
    if (!error) setQuotes(prev => prev.filter(q => q.id !== id))
    return { error: error?.message ?? null }
  }

  return { quotes, loading, getQuote, createQuote, updateQuote, deleteQuote }
}
