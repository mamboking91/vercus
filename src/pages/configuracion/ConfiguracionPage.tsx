import { useState, useEffect, useRef } from 'react'
import { Pencil, Trash2, Plus, Upload, Wrench } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useSettings } from '@/hooks/useSettings'
import { useLaborTypes } from '@/hooks/useLaborTypes'
import { toast } from '@/hooks/use-toast'
import { formatCurrency } from '@/lib/utils'
import { type LaborType, type IvaRate } from '@/types'

// ─── Tab: Datos del taller ───────────────────────────────────────────────────

function DatosTallerTab() {
  const { settings, loading, saveSettings, uploadLogo } = useSettings()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  const [form, setForm] = useState({
    business_name: '',
    owner_name: '',
    phone: '',
    address: '',
    tax_id: '',
    default_iva_rate: 7 as IvaRate,
    logo_url: null as string | null,
  })

  useEffect(() => {
    if (settings) {
      setForm({
        business_name: settings.business_name ?? '',
        owner_name: settings.owner_name ?? '',
        phone: settings.phone ?? '',
        address: settings.address ?? '',
        tax_id: settings.tax_id ?? '',
        default_iva_rate: (settings.default_iva_rate ?? 7) as IvaRate,
        logo_url: settings.logo_url ?? null,
      })
      setLogoPreview(settings.logo_url ?? null)
    }
  }, [settings])

  function setField(key: string, value: string | number | null) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Formato no válido', description: 'Selecciona una imagen (JPG, PNG, SVG…)', variant: 'destructive' })
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'Imagen demasiado grande', description: 'Máximo 2 MB', variant: 'destructive' })
      return
    }

    // Preview local inmediato
    const reader = new FileReader()
    reader.onload = () => setLogoPreview(reader.result as string)
    reader.readAsDataURL(file)

    setUploading(true)
    const { url, error } = await uploadLogo(file)
    setUploading(false)

    if (error) {
      toast({ title: 'Error al subir el logo', description: error, variant: 'destructive' })
      setLogoPreview(form.logo_url)
      return
    }
    setField('logo_url', url)
    toast({ title: 'Logo actualizado', variant: 'default' })
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.business_name.trim()) {
      toast({ title: 'El nombre del taller es obligatorio', variant: 'destructive' })
      return
    }
    setSaving(true)
    const { error } = await saveSettings(form)
    setSaving(false)
    if (error) {
      toast({ title: 'Error al guardar', description: error, variant: 'destructive' })
    } else {
      toast({ title: 'Configuración guardada', variant: 'default' })
    }
  }

  if (loading) {
    return <div className="py-12 text-center text-muted-foreground text-sm">Cargando…</div>
  }

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-xl">
      {/* Logo */}
      <div className="space-y-3">
        <Label>Logo del taller</Label>
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 rounded-lg border border-dashed border-border bg-muted flex items-center justify-center overflow-hidden shrink-0">
            {logoPreview ? (
              <img src={logoPreview} alt="Logo" className="h-full w-full object-contain" />
            ) : (
              <Wrench className="h-8 w-8 text-muted-foreground" />
            )}
          </div>
          <div className="space-y-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoChange}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? 'Subiendo…' : logoPreview ? 'Cambiar logo' : 'Subir logo'}
            </Button>
            <p className="text-xs text-muted-foreground">JPG, PNG o SVG. Máx. 2 MB</p>
          </div>
        </div>
      </div>

      {/* Nombre del taller */}
      <div className="space-y-2">
        <Label htmlFor="business_name">Nombre del taller <span className="text-destructive">*</span></Label>
        <Input
          id="business_name"
          value={form.business_name}
          onChange={e => setField('business_name', e.target.value)}
          placeholder="Taller Mecánico García"
          required
        />
      </div>

      {/* Nombre del dueño */}
      <div className="space-y-2">
        <Label htmlFor="owner_name">Nombre del propietario</Label>
        <Input
          id="owner_name"
          value={form.owner_name}
          onChange={e => setField('owner_name', e.target.value)}
          placeholder="Juan García López"
        />
      </div>

      {/* Teléfono y NIF en fila */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Teléfono</Label>
          <Input
            id="phone"
            type="tel"
            value={form.phone}
            onChange={e => setField('phone', e.target.value)}
            placeholder="666 000 000"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tax_id">NIF / CIF</Label>
          <Input
            id="tax_id"
            value={form.tax_id}
            onChange={e => setField('tax_id', e.target.value)}
            placeholder="12345678A"
          />
        </div>
      </div>

      {/* Dirección */}
      <div className="space-y-2">
        <Label htmlFor="address">Dirección</Label>
        <Input
          id="address"
          value={form.address}
          onChange={e => setField('address', e.target.value)}
          placeholder="Calle Mayor 1, 28001 Madrid"
        />
      </div>

      {/* IGIC por defecto */}
      <div className="space-y-2">
        <Label>Tipo de IGIC por defecto en presupuestos</Label>
        <Select
          value={String(form.default_iva_rate)}
          onValueChange={v => setField('default_iva_rate', Number(v) as IvaRate)}
        >
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">7% — General</SelectItem>
            <SelectItem value="3">3% — Reducido</SelectItem>
            <SelectItem value="0">0% — Tipo cero</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" disabled={saving}>
        {saving ? 'Guardando…' : 'Guardar cambios'}
      </Button>
    </form>
  )
}

// ─── Dialog: Crear / Editar tipo de mano de obra ─────────────────────────────

interface LaborTypeDialogProps {
  open: boolean
  onClose: () => void
  onSave: (values: { name: string; hourly_rate: number }) => Promise<void>
  initial?: LaborType | null
}

function LaborTypeDialog({ open, onClose, onSave, initial }: LaborTypeDialogProps) {
  const [name, setName] = useState('')
  const [rate, setRate] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? '')
      setRate(initial ? String(initial.hourly_rate) : '')
    }
  }, [open, initial])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const hourly_rate = parseFloat(rate)
    if (!name.trim()) {
      toast({ title: 'El nombre es obligatorio', variant: 'destructive' })
      return
    }
    if (isNaN(hourly_rate) || hourly_rate < 0) {
      toast({ title: 'Introduce una tarifa válida', variant: 'destructive' })
      return
    }
    setSaving(true)
    await onSave({ name: name.trim(), hourly_rate })
    setSaving(false)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{initial ? 'Editar tipo de mano de obra' : 'Nuevo tipo de mano de obra'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="lt-name">Nombre <span className="text-destructive">*</span></Label>
            <Input
              id="lt-name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Reparación mecánica"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lt-rate">Tarifa (€/hora) <span className="text-destructive">*</span></Label>
            <Input
              id="lt-rate"
              type="number"
              min="0"
              step="0.5"
              value={rate}
              onChange={e => setRate(e.target.value)}
              placeholder="45"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Guardando…' : initial ? 'Guardar cambios' : 'Crear tipo'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Tab: Tipos de mano de obra ──────────────────────────────────────────────

function TiposManoObraTab() {
  const { laborTypes, loading, createLaborType, updateLaborType, deleteLaborType } = useLaborTypes()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<LaborType | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<LaborType | null>(null)

  async function handleSave(values: { name: string; hourly_rate: number }) {
    if (editing) {
      const { error } = await updateLaborType(editing.id, values)
      if (error) toast({ title: 'Error al guardar', description: error, variant: 'destructive' })
      else toast({ title: 'Tipo actualizado' })
    } else {
      const { error } = await createLaborType(values)
      if (error) toast({ title: 'Error al crear', description: error, variant: 'destructive' })
      else toast({ title: 'Tipo creado' })
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    const { error } = await deleteLaborType(deleteTarget.id)
    if (error) toast({ title: 'Error al eliminar', description: error, variant: 'destructive' })
    else toast({ title: 'Tipo eliminado' })
    setDeleteTarget(null)
  }

  return (
    <div className="space-y-4 max-w-xl">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Define los tipos de trabajo y sus tarifas horarias. Se usarán al añadir mano de obra a las órdenes.
        </p>
        <Button
          size="sm"
          onClick={() => { setEditing(null); setDialogOpen(true) }}
        >
          <Plus className="h-4 w-4 mr-1" /> Añadir tipo
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground py-8 text-center">Cargando…</p>
      ) : laborTypes.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-sm text-muted-foreground">No hay tipos de mano de obra.</p>
            <p className="text-xs text-muted-foreground mt-1">Añade uno para empezar.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo de trabajo</TableHead>
                <TableHead className="text-right">Tarifa/hora</TableHead>
                <TableHead className="w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {laborTypes.map(lt => (
                <TableRow key={lt.id}>
                  <TableCell className="font-medium">{lt.name}</TableCell>
                  <TableCell className="text-right">{formatCurrency(lt.hourly_rate)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1 justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => { setEditing(lt); setDialogOpen(true) }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(lt)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <LaborTypeDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditing(null) }}
        onSave={handleSave}
        initial={editing}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={v => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar tipo de mano de obra?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará <strong>{deleteTarget?.name}</strong>. Las órdenes existentes que lo usen conservarán la tarifa guardada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function ConfiguracionPage() {
  return (
    <div>
      <PageHeader
        title="Configuración"
        description="Datos del taller y parámetros de trabajo"
      />
      <Tabs defaultValue="taller">
        <TabsList className="mb-6">
          <TabsTrigger value="taller">Datos del taller</TabsTrigger>
          <TabsTrigger value="manoobra">Tipos de mano de obra</TabsTrigger>
        </TabsList>

        <TabsContent value="taller">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Información del negocio</CardTitle>
              <CardDescription>Estos datos aparecerán en los presupuestos PDF.</CardDescription>
            </CardHeader>
            <CardContent>
              <DatosTallerTab />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manoobra">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tipos de mano de obra</CardTitle>
              <CardDescription>Configura los tipos de trabajo y sus tarifas por hora.</CardDescription>
            </CardHeader>
            <CardContent>
              <TiposManoObraTab />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
