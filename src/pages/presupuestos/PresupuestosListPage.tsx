import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, ChevronRight, Plus } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useQuotes } from '@/hooks/useQuotes'
import { formatDate } from '@/lib/utils'
import { type QuoteStatus } from '@/types'

const STATUS_LABELS: Record<QuoteStatus, string> = {
  borrador: 'Borrador',
  enviado: 'Enviado',
  aceptado: 'Aceptado',
  rechazado: 'Rechazado',
}

const STATUS_COLORS: Record<QuoteStatus, string> = {
  borrador: 'bg-gray-100 text-gray-700',
  enviado: 'bg-blue-100 text-blue-800',
  aceptado: 'bg-green-100 text-green-800',
  rechazado: 'bg-red-100 text-red-800',
}

const ALL_STATUSES: QuoteStatus[] = ['borrador', 'enviado', 'aceptado', 'rechazado']

export default function PresupuestosListPage() {
  const navigate = useNavigate()
  const { quotes, loading } = useQuotes()
  const [statusFilter, setStatusFilter] = useState<QuoteStatus | 'todos'>('todos')

  const filtered = useMemo(() => {
    if (statusFilter === 'todos') return quotes
    return quotes.filter(q => q.status === statusFilter)
  }, [quotes, statusFilter])

  return (
    <div>
      <PageHeader
        title="Presupuestos"
        description={`${quotes.length} presupuesto${quotes.length !== 1 ? 's' : ''}`}
        action={
          <Button size="sm" onClick={() => navigate('/ordenes/nueva')}>
            <Plus className="h-4 w-4 mr-1.5" />
            <span className="hidden sm:inline">Nuevo presupuesto</span>
            <span className="sm:hidden">Nuevo</span>
          </Button>
        }
      />

      {/* Filtros de estado */}
      <div className="flex flex-wrap gap-2 mb-5">
        <button
          onClick={() => setStatusFilter('todos')}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            statusFilter === 'todos'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          Todos
        </button>
        {ALL_STATUSES.map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              statusFilter === s
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 flex flex-col items-center text-center">
            <FileText className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="font-medium">
              {statusFilter !== 'todos' ? 'Sin presupuestos con ese estado' : 'Sin presupuestos todavía'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {statusFilter !== 'todos'
                ? 'Prueba otro filtro.'
                : 'Los presupuestos se crean desde el detalle de una orden de trabajo.'}
            </p>
            {statusFilter === 'todos' && (
              <Button className="mt-4" variant="outline" onClick={() => navigate('/ordenes')}>
                Ir a órdenes
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(quote => (
            <button
              key={quote.id}
              onClick={() => navigate(`/presupuestos/${quote.id}`)}
              className="w-full text-left rounded-lg border bg-card px-4 py-3 hover:bg-muted/40 transition-colors flex items-center justify-between gap-4"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-semibold text-sm">{quote.quote_number}</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[quote.status]}`}>
                    {STATUS_LABELS[quote.status]}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {quote.work_order?.client?.name ?? '—'}
                  {quote.work_order?.order_number ? ` · ${quote.work_order.order_number}` : ''}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatDate(quote.created_at)}
                  {quote.include_iva ? ` · IGIC ${quote.iva_rate}%` : ' · Sin IGIC'}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
