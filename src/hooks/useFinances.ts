import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { type Expense } from '@/types'
import { useAuth } from '@/hooks/useAuth'

export interface MonthlyData {
  month: string   // e.g. "Ene", "Feb"
  ingresos: number
  gastos: number
}

export function useFinances() {
  const { user } = useAuth()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    fetchData()
  }, [user])

  async function fetchData() {
    setLoading(true)
    const year = new Date().getFullYear()
    const from = `${year}-01-01`
    const to = `${year}-12-31`

    const [paymentsRes, expensesRes] = await Promise.all([
      supabase
        .from('payments')
        .select('amount, date, work_order_id')
        .gte('date', from)
        .lte('date', to),
      supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user!.id)
        .gte('date', from)
        .lte('date', to)
        .order('date', { ascending: false }),
    ])

    const monthNames = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
    const monthly: Record<number, MonthlyData> = {}
    for (let i = 0; i < 12; i++) {
      monthly[i] = { month: monthNames[i], ingresos: 0, gastos: 0 }
    }

    for (const p of (paymentsRes.data ?? [])) {
      const m = new Date(p.date).getMonth()
      monthly[m].ingresos += p.amount
    }
    for (const e of (expensesRes.data ?? [])) {
      const m = new Date(e.date).getMonth()
      monthly[m].gastos += e.amount
    }

    setMonthlyData(Object.values(monthly))
    setExpenses((expensesRes.data as Expense[]) ?? [])
    setLoading(false)
  }

  async function addExpense(values: { date: string; description: string; category: string; amount: number }) {
    const { data, error } = await supabase
      .from('expenses')
      .insert({ ...values, user_id: user!.id })
      .select()
      .single()
    if (!error && data) {
      const e = data as Expense
      setExpenses(prev => [e, ...prev])
      // update monthly
      const m = new Date(e.date).getMonth()
      setMonthlyData(prev => prev.map((md, i) => i === m ? { ...md, gastos: md.gastos + e.amount } : md))
    }
    return { error: error?.message ?? null }
  }

  async function deleteExpense(id: string) {
    const exp = expenses.find(e => e.id === id)
    const { error } = await supabase.from('expenses').delete().eq('id', id)
    if (!error && exp) {
      setExpenses(prev => prev.filter(e => e.id !== id))
      const m = new Date(exp.date).getMonth()
      setMonthlyData(prev => prev.map((md, i) => i === m ? { ...md, gastos: md.gastos - exp.amount } : md))
    }
    return { error: error?.message ?? null }
  }

  const totalIngresos = monthlyData.reduce((s, m) => s + m.ingresos, 0)
  const totalGastos = monthlyData.reduce((s, m) => s + m.gastos, 0)
  const beneficio = totalIngresos - totalGastos

  return { expenses, monthlyData, loading, totalIngresos, totalGastos, beneficio, addExpense, deleteExpense, refetch: fetchData }
}
