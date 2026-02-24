import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useLaborTypes } from '@/hooks/useLaborTypes'
import { type WorkOrderLabor } from '@/types'
import { formatCurrency } from '@/lib/utils'

interface Props {
  open: boolean
  onClose: () => void
  onSave: (values: Omit<WorkOrderLabor, 'id' | 'labor_type'>) => Promise<void>
  workOrderId: string
  initial?: WorkOrderLabor | null
}

export function LaborDialog({ open, onClose, onSave, workOrderId, initial }: Props) {
  const { laborTypes } = useLaborTypes()
  const [laborTypeId, setLaborTypeId] = useState('')
  const [hours, setHours] = useState('')
  const [rate, setRate] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      if (initial) {
        setLaborTypeId(initial.labor_type_id ?? '')
        setHours(String(initial.hours))
        setRate(String(initial.unit_rate))
        setDescription(initial.description ?? '')
      } else {
        setLaborTypeId('')
        setHours('')
        setRate('')
        setDescription('')
      }
    }
  }, [open, initial])

  function handleTypeChange(id: string) {
    setLaborTypeId(id)
    const lt = laborTypes.find(t => t.id === id)
    if (lt) setRate(String(lt.hourly_rate))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const h = parseFloat(hours)
    const r = parseFloat(rate)
    if (isNaN(h) || h <= 0 || isNaN(r) || r < 0) return
    setSaving(true)
    await onSave({
      work_order_id: workOrderId,
      labor_type_id: laborTypeId || null,
      hours: h,
      unit_rate: r,
      description: description.trim() || null,
    })
    setSaving(false)
    onClose()
  }

  const total = (parseFloat(hours) || 0) * (parseFloat(rate) || 0)

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{initial ? 'Editar mano de obra' : 'Añadir mano de obra'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Tipo de trabajo */}
          <div className="space-y-2">
            <Label>Tipo de trabajo</Label>
            {laborTypes.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Define tipos en <strong>Configuración → Tipos de mano de obra</strong>.
              </p>
            ) : (
              <Select value={laborTypeId} onValueChange={handleTypeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo…" />
                </SelectTrigger>
                <SelectContent>
                  {laborTypes.map(lt => (
                    <SelectItem key={lt.id} value={lt.id}>
                      {lt.name} — {lt.hourly_rate} €/h
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Horas y Tarifa */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lb-hours">Horas <span className="text-destructive">*</span></Label>
              <Input id="lb-hours" type="number" min="0.25" step="0.25" value={hours} onChange={e => setHours(e.target.value)} placeholder="1.5" autoFocus required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lb-rate">Tarifa €/hora <span className="text-destructive">*</span></Label>
              <Input id="lb-rate" type="number" min="0" step="0.5" value={rate} onChange={e => setRate(e.target.value)} placeholder="45" required />
            </div>
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <Label htmlFor="lb-desc">Descripción del trabajo</Label>
            <Textarea id="lb-desc" value={description} onChange={e => setDescription(e.target.value)} placeholder="Sustitución de carburador y limpieza general…" rows={2} />
          </div>

          {total > 0 && (
            <p className="text-sm text-right text-muted-foreground">
              Total: <span className="font-semibold text-foreground">{formatCurrency(total)}</span>
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={saving || !hours || !rate}>
              {saving ? 'Guardando…' : initial ? 'Guardar' : 'Añadir'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
