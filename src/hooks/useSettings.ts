import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { type Settings } from '@/types'
import { useAuth } from '@/hooks/useAuth'

export function useSettings() {
  const { user } = useAuth()
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    fetchSettings()
  }, [user])

  async function fetchSettings() {
    setLoading(true)
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('user_id', user!.id)
      .maybeSingle()

    if (error) setError(error.message)
    else setSettings(data)
    setLoading(false)
  }

  async function saveSettings(values: Partial<Omit<Settings, 'id' | 'user_id'>>) {
    if (!user) return { error: 'No autenticado' }

    const payload = { ...values, user_id: user.id }
    const { data, error } = await supabase
      .from('settings')
      .upsert(payload, { onConflict: 'user_id' })
      .select()
      .single()

    if (!error && data) setSettings(data as Settings)
    return { error: error?.message ?? null }
  }

  async function uploadLogo(file: File): Promise<{ url: string | null; error: string | null }> {
    if (!user) return { url: null, error: 'No autenticado' }

    const ext = file.name.split('.').pop()
    const path = `${user.id}/logo.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('logos')
      .upload(path, file, { upsert: true })

    if (uploadError) return { url: null, error: uploadError.message }

    const { data } = supabase.storage.from('logos').getPublicUrl(path)
    // Añadir timestamp para evitar caché del navegador
    const url = `${data.publicUrl}?t=${Date.now()}`
    return { url, error: null }
  }

  return { settings, loading, error, saveSettings, uploadLogo, refetch: fetchSettings }
}
