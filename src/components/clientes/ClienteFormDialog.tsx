import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { type Client } from '@/types'

interface Props {
  open: boolean
  onClose: () => void
  onSave: (values: Omit<Client, 'id' | 'user_id' | 'created_at'>) => Promise<void>
  initial?: Client | null
}

const empty = { name: '', phone: '', email: '', address: '', notes: '' }

export function ClienteFormDialog({ open, onClose, onSave, initial }: Props) {
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)
  const [emailError, setEmailError] = useState('')

  useEffect(() => {
    if (open) {
      setForm(initial
        ? { name: initial.name, phone: initial.phone ?? '', email: initial.email ?? '', address: initial.address ?? '', notes: initial.notes ?? '' }
        : empty
      )
      setEmailError('')
    }
  }, [open, initial])

  function setField(key: string, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
    if (key === 'email') setEmailError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setEmailError('Introduce un email válido')
      return
    }
    setSaving(true)
    await onSave({
      name: form.name.trim(),
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      address: form.address.trim() || null,
      notes: form.notes.trim() || null,
    })
    setSaving(false)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{initial ? 'Editar cliente' : 'Nuevo cliente'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="cli-name">Nombre <span className="text-destructive">*</span></Label>
            <Input id="cli-name" value={form.name} onChange={e => setField('name', e.target.value)} placeholder="Juan García" autoFocus required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cli-phone">Teléfono</Label>
              <Input id="cli-phone" type="tel" value={form.phone} onChange={e => setField('phone', e.target.value)} placeholder="666 000 000" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cli-email">Email</Label>
              <Input id="cli-email" type="email" value={form.email} onChange={e => setField('email', e.target.value)} placeholder="juan@email.com" />
              {emailError && <p className="text-xs text-destructive">{emailError}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cli-address">Dirección</Label>
            <Input id="cli-address" value={form.address} onChange={e => setField('address', e.target.value)} placeholder="Calle Mayor 1, Pueblo" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cli-notes">Notas</Label>
            <Textarea id="cli-notes" value={form.notes} onChange={e => setField('notes', e.target.value)} placeholder="Observaciones sobre el cliente…" rows={2} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={saving || !form.name.trim()}>
              {saving ? 'Guardando…' : initial ? 'Guardar cambios' : 'Crear cliente'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
