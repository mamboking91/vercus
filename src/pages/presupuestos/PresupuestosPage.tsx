import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Download, Share2, Pencil } from 'lucide-react'
import { PDFDownloadLink, pdf } from '@react-pdf/renderer'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { QuotePDF } from '@/components/presupuestos/QuotePDF'
import { useQuotes } from '@/hooks/useQuotes'
import { useWorkOrderParts } from '@/hooks/useWorkOrderParts'
import { useWorkOrderLabor } from '@/hooks/useWorkOrderLabor'
import { useSettings } from '@/hooks/useSettings'
import { toast } from '@/hooks/use-toast'
import { formatCurrency, formatDate } from '@/lib/utils'
import { type Quote, type IvaRate, type QuoteStatus } from '@/types'

const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  borrador: 'Borrador',
  enviado: 'Enviado',
  aceptado: 'Aceptado',
  rechazado: 'Rechazado',
}

const QUOTE_STATUS_COLORS: Record<QuoteStatus, string> = {
  borrador: 'bg-gray-100 text-gray-700',
  enviado: 'bg-blue-100 text-blue-800',
  aceptado: 'bg-green-100 text-green-800',
  rechazado: 'bg-red-100 text-red-800',
}

// ─── Selector de tipo IGIC ────────────────────────────────────────────────────

function IgicRateSelect({ value, onChange }: { value: IvaRate; onChange: (v: IvaRate) => void }) {
  return (
    <Select value={String(value)} onValueChange={v => onChange(Number(v) as IvaRate)}>
      <SelectTrigger><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value="7">7% — General</SelectItem>
        <SelectItem value="3">3% — Reducido</SelectItem>
        <SelectItem value="0">0% — Tipo cero</SelectItem>
      </SelectContent>
    </Select>
  )
}

// ─── Dialog editar presupuesto ────────────────────────────────────────────────

interface EditQuoteDialogProps {
  open: boolean
  onClose: () => void
  quote: Quote
  onSave: (values: Partial<Quote>) => Promise<void>
}

function EditQuoteDialog({ open, onClose, quote, onSave }: EditQuoteDialogProps) {
  const [includeIgic, setIncludeIgic] = useState(quote.include_iva)
  const [igicRate, setIgicRate] = useState<IvaRate>(quote.iva_rate)
  const [validUntil, setValidUntil] = useState(quote.valid_until ?? '')
  const [notes, setNotes] = useState(quote.notes ?? '')
  const [status, setStatus] = useState<QuoteStatus>(quote.status)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setIncludeIgic(quote.include_iva)
      setIgicRate(quote.iva_rate)
      setValidUntil(quote.valid_until ?? '')
      setNotes(quote.notes ?? '')
      setStatus(quote.status)
    }
  }, [open, quote])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await onSave({
      include_iva: includeIgic,
      iva_rate: igicRate,
      valid_until: validUntil || null,
      notes: notes || null,
      status,
    })
    setSaving(false)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar presupuesto</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="igic-switch">Incluir IGIC</Label>
            <Switch id="igic-switch" checked={includeIgic} onCheckedChange={setIncludeIgic} />
          </div>
          {includeIgic && (
            <div className="space-y-2">
              <Label>Tipo de IGIC</Label>
              <IgicRateSelect value={igicRate} onChange={setIgicRate} />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="edit-valid">Válido hasta</Label>
            <Input id="edit-valid" type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Estado</Label>
            <Select value={status} onValueChange={v => setStatus(v as QuoteStatus)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(QUOTE_STATUS_LABELS) as QuoteStatus[]).map(s => (
                  <SelectItem key={s} value={s}>{QUOTE_STATUS_LABELS[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-notes">Observaciones</Label>
            <Textarea
              id="edit-notes"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              placeholder="Condiciones, garantía, plazo de entrega…"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Formulario crear presupuesto nuevo ──────────────────────────────────────

interface NewQuoteFormProps {
  workOrderId: string
  onCreated: (id: string) => void
}

function NewQuoteForm({ workOrderId, onCreated }: NewQuoteFormProps) {
  const { createQuote } = useQuotes()
  const { settings } = useSettings()
  const [includeIgic, setIncludeIgic] = useState(false)
  const [igicRate, setIgicRate] = useState<IvaRate>(7)
  const [validUntil, setValidUntil] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (settings?.default_iva_rate) setIgicRate(settings.default_iva_rate)
  }, [settings?.default_iva_rate])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const { data, error } = await createQuote({
      work_order_id: workOrderId,
      include_iva: includeIgic,
      iva_rate: igicRate,
      valid_until: validUntil || null,
      notes: notes || null,
    })
    setSaving(false)
    if (error) { toast({ title: 'Error', description: error, variant: 'destructive' }); return }
    if (data) onCreated(data.id)
  }

  return (
    <div className="max-w-md">
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="new-igic-switch">Incluir IGIC en el presupuesto</Label>
              <Switch id="new-igic-switch" checked={includeIgic} onCheckedChange={setIncludeIgic} />
            </div>
            {includeIgic && (
              <div className="space-y-2">
                <Label>Tipo de IGIC</Label>
                <IgicRateSelect value={igicRate} onChange={setIgicRate} />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="new-valid">Válido hasta (opcional)</Label>
              <Input id="new-valid" type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-notes">Observaciones (opcional)</Label>
              <Textarea
                id="new-notes"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
                placeholder="Plazo de entrega, garantía…"
              />
            </div>
            <Button type="submit" disabled={saving} className="w-full">
              {saving ? 'Generando…' : 'Generar presupuesto'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Vista de presupuesto existente ──────────────────────────────────────────

export default function PresupuestosPage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const workOrderId = searchParams.get('orden') ?? ''
  const isNew = id === 'nuevo'

  const { getQuote, updateQuote } = useQuotes(workOrderId || undefined)
  const { settings } = useSettings()

  const [quote, setQuote] = useState<Quote | null>(null)
  const [loadingQuote, setLoadingQuote] = useState(false)
  const [editOpen, setEditOpen] = useState(false)

  const { parts } = useWorkOrderParts(quote?.work_order_id ?? '')
  const { laborEntries: labor } = useWorkOrderLabor(quote?.work_order_id ?? '')

  useEffect(() => {
    if (!isNew && id) loadQuote(id)
  }, [id])

  async function loadQuote(quoteId: string) {
    setLoadingQuote(true)
    const { data, error } = await getQuote(quoteId)
    if (error) toast({ title: 'Error al cargar presupuesto', variant: 'destructive' })
    setQuote(data)
    setLoadingQuote(false)
  }

  async function handleCreated(newId: string) {
    navigate(`/presupuestos/${newId}`, { replace: true })
  }

  async function handleSave(values: Partial<Quote>) {
    if (!quote) return
    const { error } = await updateQuote(quote.id, values)
    if (error) { toast({ title: 'Error al guardar', description: error, variant: 'destructive' }); return }
    toast({ title: 'Presupuesto actualizado' })
    await loadQuote(quote.id)
  }

  async function handleWhatsApp() {
    if (!quote) return
    try {
      const blob = await pdf(
        <QuotePDF quote={quote} parts={parts} labor={labor} settings={settings} />
      ).toBlob()
      const file = new File([blob], `${quote.quote_number}.pdf`, { type: 'application/pdf' })
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: quote.quote_number })
      } else {
        const phone = quote.work_order?.client?.phone?.replace(/\D/g, '') ?? ''
        const msg = encodeURIComponent(`Te adjunto el presupuesto ${quote.quote_number}.`)
        window.open(phone ? `https://wa.me/${phone}?text=${msg}` : `https://wa.me/?text=${msg}`, '_blank')
      }
    } catch {
      toast({ title: 'No se pudo compartir el PDF', variant: 'destructive' })
    }
  }

  // ── modo "nuevo" ──
  if (isNew) {
    if (!workOrderId) {
      return (
        <div>
          <Button variant="ghost" size="sm" className="mb-3 -ml-2 text-muted-foreground" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-1" />Atrás
          </Button>
          <p className="text-sm text-muted-foreground">Falta el parámetro de orden.</p>
        </div>
      )
    }
    return (
      <div>
        <Button variant="ghost" size="sm" className="mb-3 -ml-2 text-muted-foreground" onClick={() => navigate(`/ordenes/${workOrderId}`)}>
          <ArrowLeft className="h-4 w-4 mr-1" />Volver a la orden
        </Button>
        <PageHeader title="Nuevo presupuesto" description="Configura el presupuesto antes de generarlo." />
        <NewQuoteForm workOrderId={workOrderId} onCreated={handleCreated} />
      </div>
    )
  }

  // ── cargando ──
  if (loadingQuote || !quote) {
    return (
      <div className="space-y-2">
        {[...Array(4)].map((_, i) => <div key={i} className="h-12 rounded bg-muted animate-pulse" />)}
      </div>
    )
  }

  const subtotalParts = parts.reduce((s: number, p) => s + p.quantity * p.unit_price, 0)
  const subtotalLabor = labor.reduce((s: number, l) => s + l.hours * l.unit_rate, 0)
  const subtotal = subtotalParts + subtotalLabor
  const igicAmount = quote.include_iva ? subtotal * (quote.iva_rate / 100) : 0
  const total = subtotal + igicAmount

  return (
    <div className="max-w-2xl">
      <Button variant="ghost" size="sm" className="mb-3 -ml-2 text-muted-foreground" onClick={() => navigate(`/ordenes/${quote.work_order_id}`)}>
        <ArrowLeft className="h-4 w-4 mr-1" />Orden {quote.work_order?.order_number ?? ''}
      </Button>

      <PageHeader
        title={quote.quote_number}
        description={`Creado el ${formatDate(quote.created_at)}`}
      />

      {/* Acciones */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
          <Pencil className="h-3.5 w-3.5 mr-1.5" />Editar
        </Button>
        <Button variant="outline" size="sm" onClick={handleWhatsApp}>
          <Share2 className="h-3.5 w-3.5 mr-1.5" />Compartir por WhatsApp
        </Button>
        <PDFDownloadLink
          document={<QuotePDF quote={quote} parts={parts} labor={labor} settings={settings} />}
          fileName={`${quote.quote_number}.pdf`}
        >
          {({ loading: pdfLoading }) => (
            <Button size="sm" disabled={pdfLoading}>
              <Download className="h-3.5 w-3.5 mr-1.5" />
              {pdfLoading ? 'Preparando…' : 'Descargar PDF'}
            </Button>
          )}
        </PDFDownloadLink>
      </div>

      {/* Estado e información */}
      <Card className="mb-4">
        <CardContent className="pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Estado</span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${QUOTE_STATUS_COLORS[quote.status]}`}>
              {QUOTE_STATUS_LABELS[quote.status]}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">IGIC</span>
            <span className="text-sm font-medium">
              {quote.include_iva ? `${quote.iva_rate}% incluido` : 'Sin IGIC'}
            </span>
          </div>
          {quote.valid_until && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Válido hasta</span>
              <span className="text-sm font-medium">{formatDate(quote.valid_until)}</span>
            </div>
          )}
          {quote.notes && (
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground mb-1">Observaciones</p>
              <p className="text-sm">{quote.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resumen económico */}
      <Card>
        <CardContent className="pt-4 space-y-2">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-3">Resumen económico</p>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Piezas y materiales</span>
            <span>{formatCurrency(subtotalParts)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Mano de obra</span>
            <span>{formatCurrency(subtotalLabor)}</span>
          </div>
          <div className="flex justify-between text-sm border-t pt-2">
            <span className="text-muted-foreground">Base imponible</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          {quote.include_iva && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">IGIC ({quote.iva_rate}%)</span>
              <span>{formatCurrency(igicAmount)}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold border-t pt-2 mt-1">
            <span>Total</span>
            <span className="text-xl">{formatCurrency(total)}</span>
          </div>
          {!quote.include_iva && (
            <p className="text-xs text-muted-foreground">* Precios sin IGIC</p>
          )}
        </CardContent>
      </Card>

      <EditQuoteDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        quote={quote}
        onSave={handleSave}
      />
    </div>
  )
}
