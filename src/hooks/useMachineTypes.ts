import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { type MachineTypeRecord } from '@/types'

export const BUILTIN_MACHINE_TYPES: Omit<MachineTypeRecord, 'id' | 'user_id' | 'created_at'>[] = [
  { slug: 'tractor',      name: 'Tractor',      icon: 'tractor',  color: 'green'  },
  { slug: 'motosierra',   name: 'Motosierra',   icon: 'axe',      color: 'orange' },
  { slug: 'desbrozadora', name: 'Desbrozadora', icon: 'scissors', color: 'lime'   },
  { slug: 'electrica',    name: 'Eléctrica',    icon: 'bolt',     color: 'blue'   },
  { slug: 'otro',         name: 'Otro',         icon: 'wrench',   color: 'slate'  },
]

// Fallback inmediato: muestra los tipos predefinidos antes de que cargue la BD
const BUILTIN_FALLBACK: MachineTypeRecord[] = BUILTIN_MACHINE_TYPES.map(t => ({
  ...t,
  id: `builtin-${t.slug}`,
  user_id: '',
  created_at: '',
}))

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function useMachineTypes() {
  const { user } = useAuth()
  const [machineTypes, setMachineTypes] = useState<MachineTypeRecord[]>(BUILTIN_FALLBACK)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    fetchMachineTypes()
  }, [user])

  async function fetchMachineTypes() {
    setLoading(true)
    const { data, error: fetchError } = await supabase
      .from('machine_types')
      .select('*')
      .order('name')

    // Si la tabla no existe aún, mantener el fallback estático
    if (fetchError) {
      setLoading(false)
      return
    }

    const types = (data as MachineTypeRecord[]) ?? []

    if (types.length === 0) {
      // Auto-seed los 5 tipos predefinidos en el primer uso
      const rows = BUILTIN_MACHINE_TYPES.map(t => ({ ...t, user_id: user!.id }))
      const { error } = await supabase.from('machine_types').insert(rows)
      if (!error) {
        const { data: seeded } = await supabase
          .from('machine_types')
          .select('*')
          .order('name')
        setMachineTypes((seeded as MachineTypeRecord[]) ?? BUILTIN_FALLBACK)
      }
    } else {
      setMachineTypes(types)
    }
    setLoading(false)
  }

  async function createMachineType(values: { name: string; icon: string; color: string }) {
    const slug = slugify(values.name) || `tipo-${Date.now()}`
    const { error } = await supabase
      .from('machine_types')
      .insert({ ...values, slug, user_id: user!.id })
    if (!error) await fetchMachineTypes()
    return { error: error?.message ?? null }
  }

  async function updateMachineType(id: string, values: { name: string; icon: string; color: string }) {
    const { error } = await supabase
      .from('machine_types')
      .update(values)
      .eq('id', id)
    if (!error) await fetchMachineTypes()
    return { error: error?.message ?? null }
  }

  async function deleteMachineType(id: string) {
    const { error } = await supabase
      .from('machine_types')
      .delete()
      .eq('id', id)
    if (!error) setMachineTypes(prev => prev.filter(t => t.id !== id))
    return { error: error?.message ?? null }
  }

  return { machineTypes, loading, createMachineType, updateMachineType, deleteMachineType }
}
