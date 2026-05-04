import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom'
import { ArrowLeft, Download, Share2, Pencil, User, ClipboardList } from 'lucide-react'
import { PDFDownloadLink, pdf } from '@react-pdf/renderer'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { QuotePDF } from '@/components/presupuestos/QuotePDF'
import { MachineTypeBadge } from '@/components/maquinas/MachineTypeBadge'
import { useQuotes } from '@/hooks/useQuotes'
import { useWorkOrderParts } from '@/hooks/useWorkOrderParts'
import { useWorkOrderLabor } from '@/hooks/useWorkOrderLabor'
import { useWorkOrderExtras } from '@/hooks/useWorkOrderExtras'
import { useSettings } from '@/hooks/useSettings'
import { supabase } from '@/lib/supabase'
import { toast } from '@/hooks/use-toast'
import { formatCurrency, formatDate } from '@/lib/utils'
import { type Quote, type IvaRate, type QuoteStatus, type WorkOrder, type WorkOrderExtra } from '@/types'

// ─── Tipos de estado ──────────────────────────────────────────────────────────

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

// ─── Selector IGIC ────────────────────────────────────────────────────────────

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
    await onSave({ include_iva: includeIgic, iva_rate: igicRate, valid_until: validUntil || null, notes: notes || null, status })
    setSaving(false)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Editar presupuesto</DialogTitle></DialogHeader>
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
            <Textarea id="edit-notes" value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Condiciones, garantía, plazo de entrega…" />
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

// ─── Formulario nuevo presupuesto ─────────────────────────────────────────────

interface NewQuoteFormProps {
  workOrderId: string
  onCreated: (id: string) => void
}

function NewQuoteForm({ workOrderId, onCreated }: NewQuoteFormProps) {
  const { createQuote } = useQuotes()
  const { settings } = useSettings()
  const { parts, loading: loadingParts } = useWorkOrderParts(workOrderId)
  const { laborEntries: labor, loading: loadingLabor } = useWorkOrderLabor(workOrderId)
  const { extras, loading: loadingExtras } = useWorkOrderExtras(workOrderId)

  const [includeIgic, setIncludeIgic] = useState(false)
  const [igicRate, setIgicRate] = useState<IvaRate>(7)
  const [validUntil, setValidUntil] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [workOrderInfo, setWorkOrderInfo] = useState<WorkOrder | null>(null)

  useEffect(() => {
    if (settings?.default_iva_rate) setIgicRate(settings.default_iva_rate)
  }, [settings?.default_iva_rate])

  useEffect(() => {
    if (!workOrderId) return
    supabase
      .from('work_orders')
      .select('*, client:clients(id, name, phone, email), machine:machines(id, brand, model, type)')
      .eq('id', workOrderId)
      .single()
      .then(({ data }) => setWorkOrderInfo(data as WorkOrder | null))
  }, [workOrderId])

  const subtotalParts = parts.reduce((s, p) => s + p.quantity * p.unit_price, 0)
  const subtotalLabor = labor.reduce((s, l) => s + l.hours * l.unit_rate, 0)
  const subtotalExtras = extras.reduce((s, e) => s + e.amount, 0)
  const subtotal = subtotalParts + subtotalLabor + subtotalExtras
  const igicAmount = includeIgic ? subtotal * (igicRate / 100) : 0
  const total = subtotal + igicAmount

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

  const loadingContent = loadingParts || loadingLabor || loadingExtras

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex flex-col lg:grid lg:grid-cols-[1fr_280px] lg:items-start gap-5">

        {/* ── LEFT: Vista previa del contenido ── */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Contenido del presupuesto</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingContent ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => <div key={i} className="h-10 rounded bg-muted animate-pulse" />)}
                </div>
              ) : parts.length === 0 && labor.length === 0 && extras.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Esta orden no tiene piezas, mano de obra ni extras. El presupuesto se generará vacío.
                </p>
              ) : (
                <div className="space-y-5">
                  {/* Piezas */}
                  {parts.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                        Piezas y materiales
                      </p>
                      <div className="divide-y">
                        {parts.map(p => (
                          <div key={p.id} className="flex items-start justify-between py-2.5 gap-3">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium">{p.description}</p>
                              <p className="text-xs text-muted-foreground">
                                {[p.code, p.brand].filter(Boolean).join(' · ')}
                                {(p.code || p.brand) ? ' · ' : ''}
                                {p.quantity} ud × {formatCurrency(p.unit_price)}
                              </p>
                            </div>
                            <p className="text-sm font-semibold shrink-0">{formatCurrency(p.quantity * p.unit_price)}</p>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground pt-2 border-t">
                        <span>Subtotal piezas</span>
                        <span className="font-medium">{formatCurrency(subtotalParts)}</span>
                      </div>
                    </div>
                  )}

                  {/* Mano de obra */}
                  {labor.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                        Mano de obra
                      </p>
                      <div className="divide-y">
                        {labor.map(l => (
                          <div key={l.id} className="flex items-start justify-between py-2.5 gap-3">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium">{l.labor_type?.name ?? 'Mano de obra'}</p>
                              <p className="text-xs text-muted-foreground">
                                {l.hours}h × {formatCurrency(l.unit_rate)}/h
                                {l.description ? ` · ${l.description}` : ''}
                              </p>
                            </div>
                            <p className="text-sm font-semibold shrink-0">{formatCurrency(l.hours * l.unit_rate)}</p>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground pt-2 border-t">
                        <span>Subtotal mano de obra</span>
                        <span className="font-medium">{formatCurrency(subtotalLabor)}</span>
                      </div>
                    </div>
                  )}

                  {/* Extras */}
                  {extras.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                        Gastos adicionales
                      </p>
                      <div className="divide-y">
                        {extras.map(e => (
                          <div key={e.id} className="flex items-center justify-between py-2.5 gap-3">
                            <p className="text-sm font-medium min-w-0 flex-1 truncate">{e.description}</p>
                            <p className="text-sm font-semibold shrink-0">{formatCurrency(e.amount)}</p>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground pt-2 border-t">
                        <span>Subtotal extras</span>
                        <span className="font-medium">{formatCurrency(subtotalExtras)}</span>
                      </div>
                    </div>
                  )}

                  {/* Total preview */}
                  <div className="border-t pt-3 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Base imponible</span>
                      <span>{formatCurrency(subtotal)}</span>
                    </div>
                    {includeIgic && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">IGIC ({igicRate}%)</span>
                        <span>{formatCurrency(igicAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-base pt-1">
                      <span>Total</span>
                      <span>{formatCurrency(total)}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── RIGHT: Configuración + Orden vinculada ── */}
        <div className="space-y-4">

          {/* Configuración del presupuesto */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Configuración</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="new-igic-switch" className="text-sm">Incluir IGIC</Label>
                <Switch id="new-igic-switch" checked={includeIgic} onCheckedChange={setIncludeIgic} />
              </div>
              {includeIgic && (
                <div className="space-y-2">
                  <Label className="text-sm">Tipo de IGIC</Label>
                  <IgicRateSelect value={igicRate} onChange={setIgicRate} />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="new-valid" className="text-sm">Válido hasta</Label>
                <Input id="new-valid" type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-notes" className="text-sm">Observaciones</Label>
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
            </CardContent>
          </Card>

          {/* Orden vinculada */}
          {workOrderInfo && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-1.5">
                  <ClipboardList className="h-3.5 w-3.5 text-muted-foreground" />
                  Orden vinculada
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                <p className="text-sm font-medium">{workOrderInfo.order_number}</p>
                {workOrderInfo.client && (
                  <div className="flex items-center gap-1.5 text-sm">
                    <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span>{workOrderInfo.client.name}</span>
                  </div>
                )}
                {workOrderInfo.machine && (
                  <div className="space-y-1">
                    <MachineTypeBadge type={workOrderInfo.machine.type} />
                    {(workOrderInfo.machine.brand || workOrderInfo.machine.model) && (
                      <p className="text-xs text-muted-foreground">
                        {[workOrderInfo.machine.brand, workOrderInfo.machine.model].filter(Boolean).join(' ')}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

        </div>
      </div>
    </form>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

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
  const { extras } = useWorkOrderExtras(quote?.work_order_id ?? '')

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
        <QuotePDF quote={quote} parts={parts} labor={labor} extras={extras} settings={settings} />
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

  // ── Modo nuevo ──
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
        <PageHeader title="Nuevo presupuesto" description="Configura y genera el presupuesto para esta orden." />
        <NewQuoteForm workOrderId={workOrderId} onCreated={handleCreated} />
      </div>
    )
  }

  // ── Cargando ──
  if (loadingQuote || !quote) {
    return (
      <div className="space-y-2">
        {[...Array(4)].map((_, i) => <div key={i} className="h-12 rounded bg-muted animate-pulse" />)}
      </div>
    )
  }

  const subtotalParts = parts.reduce((s, p) => s + p.quantity * p.unit_price, 0)
  const subtotalLabor = labor.reduce((s, l) => s + l.hours * l.unit_rate, 0)
  const subtotalExtras = extras.reduce((s, e) => s + e.amount, 0)
  const subtotal = subtotalParts + subtotalLabor + subtotalExtras
  const igicAmount = quote.include_iva ? subtotal * (quote.iva_rate / 100) : 0
  const total = subtotal + igicAmount

  const client = quote.work_order?.client
  const machine = quote.work_order?.machine

  // ── Vista de presupuesto existente ──
  return (
    <div>
      <Button variant="ghost" size="sm" className="mb-3 -ml-2 text-muted-foreground" onClick={() => navigate(`/ordenes/${quote.work_order_id}`)}>
        <ArrowLeft className="h-4 w-4 mr-1" />Orden {quote.work_order?.order_number ?? ''}
      </Button>

      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">{quote.quote_number}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Creado el {formatDate(quote.created_at)}</p>
        </div>
        {/* Acciones — siempre visibles en la cabecera */}
        <div className="flex flex-wrap gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="h-3.5 w-3.5 mr-1.5" />
            <span className="hidden sm:inline">Editar</span>
          </Button>
          <Button variant="outline" size="sm" onClick={handleWhatsApp}>
            <Share2 className="h-3.5 w-3.5 mr-1.5" />
            <span className="hidden sm:inline">WhatsApp</span>
          </Button>
          <PDFDownloadLink
            document={<QuotePDF quote={quote} parts={parts} labor={labor} extras={extras} settings={settings} />}
            fileName={`${quote.quote_number}.pdf`}
          >
            {({ loading: pdfLoading }) => (
              <Button size="sm" disabled={pdfLoading}>
                <Download className="h-3.5 w-3.5 mr-1.5" />
                {pdfLoading ? 'Preparando…' : <><span className="hidden sm:inline">Descargar </span>PDF</>}
              </Button>
            )}
          </PDFDownloadLink>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="flex flex-col lg:grid lg:grid-cols-[1fr_280px] lg:items-start gap-5">

        {/* ── LEFT: Líneas del presupuesto + Resumen ── */}
        <div className="space-y-4">

          {/* Piezas */}
          {parts.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Piezas y materiales</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="divide-y">
                  {parts.map(p => (
                    <div key={p.id} className="flex items-start justify-between py-3 gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{p.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {[p.code, p.brand].filter(Boolean).join(' · ')}
                          {(p.code || p.brand) ? ' · ' : ''}
                          {p.quantity} ud × {formatCurrency(p.unit_price)}
                        </p>
                      </div>
                      <p className="text-sm font-semibold shrink-0">{formatCurrency(p.quantity * p.unit_price)}</p>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-sm border-t pt-3 mt-1 text-muted-foreground">
                  <span>Subtotal piezas</span>
                  <span className="font-medium text-foreground">{formatCurrency(subtotalParts)}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Mano de obra */}
          {labor.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Mano de obra</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="divide-y">
                  {labor.map(l => (
                    <div key={l.id} className="flex items-start justify-between py-3 gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{l.labor_type?.name ?? 'Mano de obra'}</p>
                        <p className="text-xs text-muted-foreground">
                          {l.hours}h × {formatCurrency(l.unit_rate)}/h
                          {l.description ? ` · ${l.description}` : ''}
                        </p>
                      </div>
                      <p className="text-sm font-semibold shrink-0">{formatCurrency(l.hours * l.unit_rate)}</p>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-sm border-t pt-3 mt-1 text-muted-foreground">
                  <span>Subtotal mano de obra</span>
                  <span className="font-medium text-foreground">{formatCurrency(subtotalLabor)}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Extras */}
          {extras.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Gastos adicionales</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="divide-y">
                  {extras.map(e => (
                    <div key={e.id} className="flex items-center justify-between py-3 gap-3">
                      <p className="text-sm font-medium min-w-0 flex-1 truncate">{e.description}</p>
                      <p className="text-sm font-semibold shrink-0">{formatCurrency(e.amount)}</p>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-sm border-t pt-3 mt-1 text-muted-foreground">
                  <span>Subtotal extras</span>
                  <span className="font-medium text-foreground">{formatCurrency(subtotalExtras)}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {parts.length === 0 && labor.length === 0 && extras.length === 0 && (
            <Card>
              <CardContent className="py-10 text-center">
                <p className="text-sm text-muted-foreground">Este presupuesto no tiene líneas de detalle.</p>
              </CardContent>
            </Card>
          )}

          {/* Resumen económico */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Resumen económico</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Piezas y materiales</span>
                <span>{formatCurrency(subtotalParts)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Mano de obra</span>
                <span>{formatCurrency(subtotalLabor)}</span>
              </div>
              {subtotalExtras > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Gastos adicionales</span>
                  <span>{formatCurrency(subtotalExtras)}</span>
                </div>
              )}
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
              <div className="flex justify-between font-bold text-lg border-t pt-3 mt-1">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
              {!quote.include_iva && (
                <p className="text-xs text-muted-foreground">* Precios sin IGIC</p>
              )}
            </CardContent>
          </Card>

          {/* Observaciones */}
          {quote.notes && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Observaciones</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground">{quote.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* ── RIGHT: Estado + IGIC + Cliente + Orden ── */}
        <div className="space-y-4">

          {/* Estado */}
          <Card>
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Estado</span>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${QUOTE_STATUS_COLORS[quote.status]}`}>
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
            </CardContent>
          </Card>

          {/* Cliente */}
          {client && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  Cliente
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-1">
                <Link
                  to={`/clientes/${client.id}`}
                  className="text-sm font-medium hover:underline text-primary"
                >
                  {client.name}
                </Link>
                {client.phone && <p className="text-xs text-muted-foreground">{client.phone}</p>}
                {client.email && <p className="text-xs text-muted-foreground">{client.email}</p>}
              </CardContent>
            </Card>
          )}

          {/* Orden vinculada */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-1.5">
                <ClipboardList className="h-3.5 w-3.5 text-muted-foreground" />
                Orden de trabajo
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              <Link
                to={`/ordenes/${quote.work_order_id}`}
                className="text-sm font-medium hover:underline text-primary"
              >
                {quote.work_order?.order_number ?? quote.work_order_id}
              </Link>
              {machine && (
                <div className="space-y-1 pt-1">
                  <MachineTypeBadge type={machine.type} />
                  {(machine.brand || machine.model) && (
                    <p className="text-xs text-muted-foreground">
                      {[machine.brand, machine.model].filter(Boolean).join(' ')}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </div>

      <EditQuoteDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        quote={quote}
        onSave={handleSave}
      />
    </div>
  )
}
