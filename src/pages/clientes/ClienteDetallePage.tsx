import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Pencil, Trash2, Plus, Phone, Mail, MapPin, Wrench, ClipboardList } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { ClienteFormDialog } from '@/components/clientes/ClienteFormDialog'
import { MaquinaFormDialog } from '@/components/maquinas/MaquinaFormDialog'
import { useClients } from '@/hooks/useClients'
import { useMachines } from '@/hooks/useMachines'
import { toast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/lib/utils'
import { type Client, type Machine, type WorkOrder, MACHINE_TYPE_LABELS, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/types'

function MachineCard({ machine, onEdit, onDelete }: { machine: Machine; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
      <div className="flex items-center gap-3 min-w-0">
        <Wrench className="h-4 w-4 text-muted-foreground shrink-0" />
        <div className="min-w-0">
          <p className="font-medium text-sm">
            {[machine.brand, machine.model].filter(Boolean).join(' ') || 'Sin nombre'}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-muted-foreground">{MACHINE_TYPE_LABELS[machine.type]}</span>
            {machine.serial_number && (
              <span className="text-xs text-muted-foreground">· Nº {machine.serial_number}</span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0 ml-2">
        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
          <Link to={`/maquinas/${machine.id}`}>
            <ClipboardList className="h-3.5 w-3.5" />
          </Link>
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={onDelete}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}

export default function ClienteDetallePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { getClient, updateClient, deleteClient } = useClients()
  const { machines, createMachine, updateMachine, deleteMachine } = useMachines(id)

  const [client, setClient] = useState<Client | null>(null)
  const [orders, setOrders] = useState<WorkOrder[]>([])
  const [loadingClient, setLoadingClient] = useState(true)
  const [loadingOrders, setLoadingOrders] = useState(true)

  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [machineDialogOpen, setMachineDialogOpen] = useState(false)
  const [editingMachine, setEditingMachine] = useState<Machine | null>(null)
  const [deleteMachineTarget, setDeleteMachineTarget] = useState<Machine | null>(null)

  useEffect(() => {
    if (!id) return
    getClient(id).then(c => { setClient(c); setLoadingClient(false) })
    fetchOrders()
  }, [id])

  async function fetchOrders() {
    setLoadingOrders(true)
    const { data } = await supabase
      .from('work_orders')
      .select('*, machine:machines(brand, model)')
      .eq('client_id', id)
      .order('created_at', { ascending: false })
      .limit(10)
    setOrders((data as WorkOrder[]) ?? [])
    setLoadingOrders(false)
  }

  async function handleUpdateClient(values: Omit<Client, 'id' | 'user_id' | 'created_at'>) {
    const { error } = await updateClient(id!, values)
    if (error) {
      toast({ title: 'Error al guardar', description: error, variant: 'destructive' })
    } else {
      setClient(prev => prev ? { ...prev, ...values } : prev)
      toast({ title: 'Cliente actualizado' })
    }
  }

  async function handleDeleteClient() {
    const { error } = await deleteClient(id!)
    if (error) {
      toast({ title: 'Error al eliminar', description: error, variant: 'destructive' })
    } else {
      toast({ title: 'Cliente eliminado' })
      navigate('/clientes')
    }
  }

  async function handleSaveMachine(values: Omit<Machine, 'id' | 'user_id' | 'created_at' | 'client'>) {
    if (editingMachine) {
      const { error } = await updateMachine(editingMachine.id, values)
      if (error) toast({ title: 'Error al guardar', description: error, variant: 'destructive' })
      else toast({ title: 'Máquina actualizada' })
    } else {
      const { error } = await createMachine(values)
      if (error) toast({ title: 'Error al crear', description: error, variant: 'destructive' })
      else toast({ title: 'Máquina añadida' })
    }
    setEditingMachine(null)
  }

  async function handleDeleteMachine() {
    if (!deleteMachineTarget) return
    const { error } = await deleteMachine(deleteMachineTarget.id)
    if (error) toast({ title: 'Error al eliminar', description: error, variant: 'destructive' })
    else toast({ title: 'Máquina eliminada' })
    setDeleteMachineTarget(null)
  }

  if (loadingClient) {
    return (
      <div>
        <div className="h-8 w-48 bg-muted rounded animate-pulse mb-6" />
        <div className="h-32 bg-muted rounded-xl animate-pulse" />
      </div>
    )
  }

  if (!client) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Cliente no encontrado.</p>
        <Button variant="link" onClick={() => navigate('/clientes')}>Volver a clientes</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Button variant="ghost" size="sm" className="mb-3 -ml-2 text-muted-foreground" onClick={() => navigate('/clientes')}>
          <ArrowLeft className="h-4 w-4 mr-1" />Clientes
        </Button>
        <PageHeader
          title={client.name}
          action={
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                <Pencil className="h-4 w-4 mr-1" />Editar
              </Button>
              <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDeleteOpen(true)}>
                <Trash2 className="h-4 w-4 mr-1" />Eliminar
              </Button>
            </div>
          }
        />
      </div>

      {/* Datos de contacto */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {client.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                <a href={`tel:${client.phone}`} className="hover:underline">{client.phone}</a>
              </div>
            )}
            {client.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                <a href={`mailto:${client.email}`} className="hover:underline truncate">{client.email}</a>
              </div>
            )}
            {client.address && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">{client.address}</span>
              </div>
            )}
            {!client.phone && !client.email && !client.address && (
              <p className="text-sm text-muted-foreground col-span-3">Sin datos de contacto.</p>
            )}
          </div>
          {client.notes && (
            <p className="text-sm text-muted-foreground mt-3 pt-3 border-t">{client.notes}</p>
          )}
        </CardContent>
      </Card>

      {/* Máquinas */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Máquinas ({machines.length})</CardTitle>
            <Button size="sm" onClick={() => { setEditingMachine(null); setMachineDialogOpen(true) }}>
              <Plus className="h-4 w-4 mr-1" />Añadir
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {machines.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Sin máquinas registradas.</p>
          ) : (
            machines.map(m => (
              <MachineCard
                key={m.id}
                machine={m}
                onEdit={() => { setEditingMachine(m); setMachineDialogOpen(true) }}
                onDelete={() => setDeleteMachineTarget(m)}
              />
            ))
          )}
        </CardContent>
      </Card>

      {/* Historial de órdenes */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Historial de órdenes</CardTitle>
            <Button size="sm" variant="outline" onClick={() => navigate(`/ordenes/nueva?cliente=${id}`)}>
              <Plus className="h-4 w-4 mr-1" />Nueva orden
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loadingOrders ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => <div key={i} className="h-10 bg-muted rounded animate-pulse" />)}
            </div>
          ) : orders.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Sin órdenes de trabajo.</p>
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

      {/* Dialogs */}
      <ClienteFormDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSave={handleUpdateClient}
        initial={client}
      />

      <MaquinaFormDialog
        open={machineDialogOpen}
        onClose={() => { setMachineDialogOpen(false); setEditingMachine(null) }}
        onSave={handleSaveMachine}
        clientId={id!}
        initial={editingMachine}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar a {client.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminarán también todas sus máquinas. Las órdenes de trabajo no se eliminan pero quedarán sin cliente asignado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleDeleteClient}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteMachineTarget} onOpenChange={v => !v && setDeleteMachineTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar máquina?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará <strong>{[deleteMachineTarget?.brand, deleteMachineTarget?.model].filter(Boolean).join(' ') || 'esta máquina'}</strong>.
              Las órdenes de trabajo vinculadas quedarán sin máquina asignada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleDeleteMachine}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
