import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useMachineTypesContext } from '@/contexts/MachineTypesContext'
import { ICON_MAP, COLOR_MAP } from '@/components/maquinas/MachineTypeBadge'
import { type Machine } from '@/types'

interface Props {
  open: boolean
  onClose: () => void
  onSave: (values: Omit<Machine, 'id' | 'user_id' | 'created_at' | 'client'>) => Promise<void>
  clientId: string
  initial?: Machine | null
}

const empty = { brand: '', model: '', serial_number: '', type: 'otro', notes: '' }

export function MaquinaFormDialog({ open, onClose, onSave, clientId, initial }: Props) {
  const { machineTypes } = useMachineTypesContext()
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(initial
        ? { brand: initial.brand ?? '', model: initial.model ?? '', serial_number: initial.serial_number ?? '', type: initial.type, notes: initial.notes ?? '' }
        : empty
      )
    }
  }, [open, initial])

  function setField(key: string, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await onSave({
      client_id: clientId,
      brand: form.brand.trim() || null,
      model: form.model.trim() || null,
      serial_number: form.serial_number.trim() || null,
      type: form.type,
      notes: form.notes.trim() || null,
    })
    setSaving(false)
    onClose()
  }

  const selectedType = machineTypes.find(t => t.slug === form.type)

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{initial ? 'Editar máquina' : 'Nueva máquina'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Tipo */}
          <div className="space-y-2">
            <Label>Tipo de máquina <span className="text-destructive">*</span></Label>
            <Select value={form.type} onValueChange={v => setField('type', v)}>
              <SelectTrigger>
                {selectedType ? (
                  <span className="flex items-center gap-2">
                    {(() => {
                      const Icon = ICON_MAP[selectedType.icon] ?? ICON_MAP['wrench']
                      const cls = COLOR_MAP[selectedType.color] ?? 'bg-slate-100 text-slate-600'
                      return (
                        <span className={`inline-flex items-center gap-1 rounded-full text-xs px-2 py-0.5 font-medium ${cls}`}>
                          <Icon className="h-3 w-3" />
                        </span>
                      )
                    })()}
                    {selectedType.name}
                  </span>
                ) : (
                  <SelectValue placeholder="Seleccionar tipo…" />
                )}
              </SelectTrigger>
              <SelectContent>
                {machineTypes.map(mt => {
                  const Icon = ICON_MAP[mt.icon] ?? ICON_MAP['wrench']
                  const cls = COLOR_MAP[mt.color] ?? 'bg-slate-100 text-slate-600'
                  return (
                    <SelectItem key={mt.slug} value={mt.slug}>
                      <span className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 rounded-full text-xs px-2 py-0.5 font-medium ${cls}`}>
                          <Icon className="h-3 w-3" />
                        </span>
                        {mt.name}
                      </span>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Marca y Modelo */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maq-brand">Marca</Label>
              <Input id="maq-brand" value={form.brand} onChange={e => setField('brand', e.target.value)} placeholder="Stihl" autoFocus />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maq-model">Modelo</Label>
              <Input id="maq-model" value={form.model} onChange={e => setField('model', e.target.value)} placeholder="MS 261" />
            </div>
          </div>

          {/* Número de serie */}
          <div className="space-y-2">
            <Label htmlFor="maq-serial">Número de serie</Label>
            <Input id="maq-serial" value={form.serial_number} onChange={e => setField('serial_number', e.target.value)} placeholder="XXXXXXXXX" />
          </div>

          {/* Notas */}
          <div className="space-y-2">
            <Label htmlFor="maq-notes">Notas</Label>
            <Textarea id="maq-notes" value={form.notes} onChange={e => setField('notes', e.target.value)} placeholder="Observaciones sobre la máquina…" rows={2} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Guardando…' : initial ? 'Guardar cambios' : 'Añadir máquina'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
