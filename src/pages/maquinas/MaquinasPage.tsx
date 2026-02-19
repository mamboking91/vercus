import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Pencil, Wrench } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MaquinaFormDialog } from '@/components/maquinas/MaquinaFormDialog'
import { useMachines } from '@/hooks/useMachines'
import { toast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/lib/utils'
import { type Machine, type WorkOrder, MACHINE_TYPE_LABELS, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/types'

export default function MaquinasPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { getMachine, updateMachine } = useMachines()

  const [machine, setMachine] = useState<Machine | null>(null)
  const [orders, setOrders] = useState<WorkOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingOrders, setLoadingOrders] = useState(true)
  const [editOpen, setEditOpen] = useState(false)

  useEffect(() => {
    if (!id) return
    getMachine(id).then(m => { setMachine(m); setLoading(false) })
    fetchOrders()
  }, [id])

  async function fetchOrders() {
    setLoadingOrders(true)
    const { data } = await supabase
      .from('work_orders')
      .select('*')
      .eq('machine_id', id)
      .order('created_at', { ascending: false })
    setOrders((data as WorkOrder[]) ?? [])
    setLoadingOrders(false)
  }

  async function handleUpdate(values: Omit<Machine, 'id' | 'user_id' | 'created_at' | 'client'>) {
    const { error } = await updateMachine(id!, values)
    if (error) {
      toast({ title: 'Error al guardar', description: error, variant: 'destructive' })
    } else {
      setMachine(prev => prev ? { ...prev, ...values } : prev)
      toast({ title: 'Máquina actualizada' })
    }
  }

  if (loading) {
    return (
      <div>
        <div className="h-8 w-48 bg-muted rounded animate-pulse mb-6" />
        <div className="h-32 bg-muted rounded-xl animate-pulse" />
      </div>
    )
  }

  if (!machine) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Máquina no encontrada.</p>
      </div>
    )
  }

  const machineName = [machine.brand, machine.model].filter(Boolean).join(' ') || 'Máquina sin nombre'

  return (
    <div className="space-y-6">
      {/* Navegación */}
      <div>
        {machine.client && (
          <Button variant="ghost" size="sm" className="mb-3 -ml-2 text-muted-foreground" onClick={() => navigate(`/clientes/${machine.client_id}`)}>
            <ArrowLeft className="h-4 w-4 mr-1" />{machine.client.name}
          </Button>
        )}
        <PageHeader
          title={machineName}
          description={MACHINE_TYPE_LABELS[machine.type]}
          action={
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4 mr-1" />Editar
            </Button>
          }
        />
      </div>

      {/* Datos de la máquina */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Tipo</p>
              <p className="font-medium">{MACHINE_TYPE_LABELS[machine.type]}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Marca</p>
              <p className="font-medium">{machine.brand || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Modelo</p>
              <p className="font-medium">{machine.model || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Nº de serie</p>
              <p className="font-medium font-mono">{machine.serial_number || '—'}</p>
            </div>
          </div>
          {machine.notes && (
            <p className="text-sm text-muted-foreground mt-4 pt-4 border-t">{machine.notes}</p>
          )}
          {machine.client && (
            <div className="mt-4 pt-4 border-t flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Propietario:</span>
              <Link to={`/clientes/${machine.client_id}`} className="font-medium hover:underline text-primary">
                {machine.client.name}
              </Link>
              {machine.client.phone && <span className="text-muted-foreground">· {machine.client.phone}</span>}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Historial de reparaciones */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Historial de reparaciones ({orders.length})</CardTitle>
            <Button size="sm" variant="outline" onClick={() => navigate(`/ordenes/nueva?maquina=${id}`)}>
              Nueva orden
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loadingOrders ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => <div key={i} className="h-10 bg-muted rounded animate-pulse" />)}
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8">
              <Wrench className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Sin reparaciones registradas.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {orders.map(o => (
                <Link
                  key={o.id}
                  to={`/ordenes/${o.id}`}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium">{o.order_number}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(o.created_at)}</p>
                    {o.problem_description && (
                      <p className="text-xs text-muted-foreground truncate max-w-xs mt-0.5">{o.problem_description}</p>
                    )}
                  </div>
                  <Badge className={ORDER_STATUS_COLORS[o.status]}>
                    {ORDER_STATUS_LABELS[o.status]}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <MaquinaFormDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSave={handleUpdate}
        clientId={machine.client_id}
        initial={machine}
      />
    </div>
  )
}
