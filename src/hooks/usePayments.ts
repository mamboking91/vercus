import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { type Payment, type PaymentMethod } from '@/types'

export function usePayments(workOrderId: string) {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!workOrderId) return
    fetchPayments()
  }, [workOrderId])

  async function fetchPayments() {
    setLoading(true)
    const { data } = await supabase
      .from('payments')
      .select('*')
      .eq('work_order_id', workOrderId)
      .order('date', { ascending: false })
    setPayments((data as Payment[]) ?? [])
    setLoading(false)
  }

  async function addPayment(values: { amount: number; date: string; method: PaymentMethod; notes?: string | null }) {
    const { data, error } = await supabase
      .from('payments')
      .insert({ ...values, work_order_id: workOrderId })
      .select()
      .single()
    if (!error && data) setPayments(prev => [data as Payment, ...prev])
    return { error: error?.message ?? null }
  }

  async function deletePayment(id: string) {
    const { error } = await supabase.from('payments').delete().eq('id', id)
    if (!error) setPayments(prev => prev.filter(p => p.id !== id))
    return { error: error?.message ?? null }
  }

  const totalPaid = payments.reduce((s, p) => s + p.amount, 0)

  return { payments, loading, totalPaid, addPayment, deletePayment }
}
