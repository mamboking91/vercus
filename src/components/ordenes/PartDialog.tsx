import { useState, useEffect } from 'react'
import { BookOpen } from 'lucide-react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CatalogSearchDialog } from './CatalogSearchDialog'
import { type WorkOrderPart, type PartsCatalogItem } from '@/types'
import { formatCurrency } from '@/lib/utils'

interface Props {
  open: boolean
  onClose: () => void
  onSave: (values: Omit<WorkOrderPart, 'id'>) => Promise<void>
  workOrderId: string
  initial?: WorkOrderPart | null
}

const empty = { code: '', description: '', brand: '', quantity: '1', unit_price: '' }

export function PartDialog({ open, onClose, onSave, workOrderId, initial }: Props) {
  const [form, setForm] = useState(empty)
  const [catalogOpen, setCatalogOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(initial
        ? { code: initial.code ?? '', description: initial.description, brand: initial.brand ?? '', quantity: String(initial.quantity), unit_price: String(initial.unit_price) }
        : empty
      )
    }
  }, [open, initial])

  function setField(key: string, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function applyFromCatalog(part: PartsCatalogItem) {
    setForm(prev => ({
      ...prev,
      code: part.code ?? '',
      description: part.description,
      brand: part.brand ?? '',
      unit_price: String(part.sell_price),
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const quantity = parseFloat(form.quantity)
    const unit_price = parseFloat(form.unit_price)
    if (!form.description.trim() || isNaN(quantity) || quantity <= 0 || isNaN(unit_price) || unit_price < 0) return
    setSaving(true)
    await onSave({
      work_order_id: workOrderId,
      catalog_part_id: null,
      code: form.code.trim() || null,
      description: form.description.trim(),
      brand: form.brand.trim() || null,
      quantity,
      unit_price,
    })
    setSaving(false)
    onClose()
  }

  const total = (parseFloat(form.quantity) || 0) * (parseFloat(form.unit_price) || 0)

  return (
    <>
      <Dialog open={open} onOpenChange={v => !v && onClose()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{initial ? 'Editar pieza' : 'Añadir pieza'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            {!initial && (
              <Button type="button" variant="outline" size="sm" onClick={() => setCatalogOpen(true)}>
                <BookOpen className="h-4 w-4 mr-2" />Buscar en catálogo
              </Button>
            )}

            <div className="space-y-2">
              <Label htmlFor="p-desc">Descripción <span className="text-destructive">*</span></Label>
              <Input id="p-desc" value={form.description} onChange={e => setField('description', e.target.value)} placeholder="Carburador Stihl" autoFocus required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="p-code">Referencia / Código</Label>
                <Input id="p-code" value={form.code} onChange={e => setField('code', e.target.value)} placeholder="1140-120-0612" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-brand">Marca</Label>
                <Input id="p-brand" value={form.brand} onChange={e => setField('brand', e.target.value)} placeholder="Stihl" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="p-qty">Cantidad <span className="text-destructive">*</span></Label>
                <Input id="p-qty" type="number" min="0.01" step="0.01" value={form.quantity} onChange={e => setField('quantity', e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-price">Precio unit. (€) <span className="text-destructive">*</span></Label>
                <Input id="p-price" type="number" min="0" step="0.01" value={form.unit_price} onChange={e => setField('unit_price', e.target.value)} placeholder="0.00" required />
              </div>
            </div>

            {total > 0 && (
              <p className="text-sm text-right text-muted-foreground">
                Total: <span className="font-semibold text-foreground">{formatCurrency(total)}</span>
              </p>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
              <Button type="submit" disabled={saving || !form.description.trim()}>
                {saving ? 'Guardando…' : initial ? 'Guardar' : 'Añadir'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <CatalogSearchDialog
        open={catalogOpen}
        onClose={() => setCatalogOpen(false)}
        onSelect={applyFromCatalog}
      />
    </>
  )
}
