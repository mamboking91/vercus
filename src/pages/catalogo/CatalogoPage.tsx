import { useState, useMemo, useEffect } from 'react'
import { Plus, Search, Pencil, Trash2, BookOpen, ExternalLink } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { usePartsCatalog } from '@/hooks/usePartsCatalog'
import { toast } from '@/hooks/use-toast'
import { formatCurrency } from '@/lib/utils'
import { type PartsCatalogItem } from '@/types'

// ─── Dialog crear/editar pieza ────────────────────────────────────────────────

interface PartFormDialogProps {
  open: boolean
  onClose: () => void
  onSave: (values: Omit<PartsCatalogItem, 'id' | 'user_id' | 'created_at'>) => Promise<void>
  initial?: PartsCatalogItem | null
}

const emptyForm = { code: '', brand: '', description: '', sell_price: '', notes: '', url: '' }

function PartFormDialog({ open, onClose, onSave, initial }: PartFormDialogProps) {
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(initial
        ? { code: initial.code ?? '', brand: initial.brand ?? '', description: initial.description, sell_price: String(initial.sell_price), notes: initial.notes ?? '', url: initial.url ?? '' }
        : emptyForm
      )
    }
  }, [open, initial])

  function setField(key: string, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const sell_price = parseFloat(form.sell_price)
    if (!form.description.trim() || isNaN(sell_price) || sell_price < 0) return
    setSaving(true)
    await onSave({
      code: form.code.trim() || null,
      brand: form.brand.trim() || null,
      description: form.description.trim(),
      sell_price,
      notes: form.notes.trim() || null,
      url: form.url.trim() || null,
    })
    setSaving(false)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{initial ? 'Editar pieza' : 'Nueva pieza en catálogo'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="cat-desc">Descripción <span className="text-destructive">*</span></Label>
            <Input id="cat-desc" value={form.description} onChange={e => setField('description', e.target.value)} placeholder="Carburador completo" autoFocus required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cat-code">Referencia / Código</Label>
              <Input id="cat-code" value={form.code} onChange={e => setField('code', e.target.value)} placeholder="1140-120-0612" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-brand">Marca</Label>
              <Input id="cat-brand" value={form.brand} onChange={e => setField('brand', e.target.value)} placeholder="Stihl" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cat-price">Precio de venta (€) <span className="text-destructive">*</span></Label>
            <Input id="cat-price" type="number" min="0" step="0.01" value={form.sell_price} onChange={e => setField('sell_price', e.target.value)} placeholder="0.00" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cat-notes">Notas</Label>
            <Textarea id="cat-notes" value={form.notes} onChange={e => setField('notes', e.target.value)} placeholder="Observaciones, proveedor, etc." rows={2} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cat-url">URL del proveedor</Label>
            <Input id="cat-url" type="url" value={form.url} onChange={e => setField('url', e.target.value)} placeholder="https://www.proveedor.com/pieza" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={saving || !form.description.trim()}>
              {saving ? 'Guardando…' : initial ? 'Guardar cambios' : 'Añadir al catálogo'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function CatalogoPage() {
  const { parts, loading, brands, createPart, updatePart, deletePart } = usePartsCatalog()
  const [search, setSearch] = useState('')
  const [brandFilter, setBrandFilter] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<PartsCatalogItem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<PartsCatalogItem | null>(null)

  const filtered = useMemo(() => {
    return parts.filter(p => {
      const matchesBrand = brandFilter === 'all' || p.brand === brandFilter
      const q = search.toLowerCase()
      const matchesSearch = !q ||
        p.description.toLowerCase().includes(q) ||
        p.code?.toLowerCase().includes(q) ||
        p.brand?.toLowerCase().includes(q)
      return matchesBrand && matchesSearch
    })
  }, [parts, search, brandFilter])

  async function handleSave(values: Omit<PartsCatalogItem, 'id' | 'user_id' | 'created_at'>) {
    if (editing) {
      const { error } = await updatePart(editing.id, values)
      if (error) toast({ title: 'Error al guardar', description: error, variant: 'destructive' })
      else toast({ title: 'Pieza actualizada' })
    } else {
      const { error } = await createPart(values)
      if (error) toast({ title: 'Error al crear', description: error, variant: 'destructive' })
      else toast({ title: 'Pieza añadida al catálogo' })
    }
    setEditing(null)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    const { error } = await deletePart(deleteTarget.id)
    if (error) toast({ title: 'Error al eliminar', description: error, variant: 'destructive' })
    else toast({ title: 'Pieza eliminada' })
    setDeleteTarget(null)
  }

  return (
    <div>
      <PageHeader
        title="Catálogo de piezas"
        description={`${parts.length} referencia${parts.length !== 1 ? 's' : ''}`}
        action={
          <Button onClick={() => { setEditing(null); setDialogOpen(true) }}>
            <Plus className="h-4 w-4 mr-2" />Nueva pieza
          </Button>
        }
      />

      {/* Filtros */}
      <div className="flex gap-3 mb-4 flex-col sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por código, marca o descripción…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        {brands.length > 0 && (
          <Select value={brandFilter} onValueChange={setBrandFilter}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las marcas</SelectItem>
              {brands.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <div key={i} className="h-12 rounded bg-muted animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 flex flex-col items-center text-center">
            <BookOpen className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="font-medium">{search || brandFilter !== 'all' ? 'Sin resultados' : 'Catálogo vacío'}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {search || brandFilter !== 'all' ? 'Prueba con otros términos.' : 'Añade piezas para buscarlas rápido al crear órdenes.'}
            </p>
            {!search && brandFilter === 'all' && (
              <Button className="mt-4" onClick={() => { setEditing(null); setDialogOpen(true) }}>
                <Plus className="h-4 w-4 mr-2" />Nueva pieza
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descripción</TableHead>
                <TableHead className="hidden sm:table-cell">Código</TableHead>
                <TableHead className="hidden sm:table-cell">Marca</TableHead>
                <TableHead className="text-right">P. venta</TableHead>
                <TableHead className="w-8 hidden sm:table-cell"></TableHead>
                <TableHead className="w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(part => (
                <TableRow key={part.id}>
                  <TableCell>
                    <p className="font-medium text-sm">{part.description}</p>
                    {part.notes && <p className="text-xs text-muted-foreground truncate max-w-xs">{part.notes}</p>}
                    {/* En móvil mostramos código, marca y URL bajo la descripción */}
                    <p className="text-xs text-muted-foreground sm:hidden">
                      {[part.code, part.brand].filter(Boolean).join(' · ')}
                    </p>
                    {part.url && (
                      <a href={part.url} target="_blank" rel="noopener noreferrer" className="sm:hidden inline-flex items-center gap-1 text-xs text-primary hover:underline" onClick={e => e.stopPropagation()}>
                        <ExternalLink className="h-3 w-3" />Ver proveedor
                      </a>
                    )}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-sm font-mono text-muted-foreground">{part.code ?? '—'}</TableCell>
                  <TableCell className="hidden sm:table-cell text-sm">{part.brand ?? '—'}</TableCell>
                  <TableCell className="text-right font-semibold text-sm">{formatCurrency(part.sell_price)}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {part.url && (
                      <a href={part.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-accent text-muted-foreground hover:text-primary transition-colors" title="Ver en proveedor">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 justify-end">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditing(part); setDialogOpen(true) }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(part)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        </Card>
      )}

      <PartFormDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditing(null) }}
        onSave={handleSave}
        initial={editing}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={v => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar del catálogo?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará <strong>{deleteTarget?.description}</strong>. Las piezas ya usadas en órdenes no se ven afectadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleDelete}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
