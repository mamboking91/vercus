import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Plus, User, Wrench } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ClienteFormDialog } from '@/components/clientes/ClienteFormDialog'
import { MaquinaFormDialog } from '@/components/maquinas/MaquinaFormDialog'
import { MachineTypeBadge } from '@/components/maquinas/MachineTypeBadge'
import { useWorkOrders } from '@/hooks/useWorkOrders'
import { useClients } from '@/hooks/useClients'
import { useMachines } from '@/hooks/useMachines'
import { toast } from '@/hooks/use-toast'
import { type Client, type Machine } from '@/types'

export default function OrdenNuevaPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { createOrder } = useWorkOrders()
  const { clients, createClient } = useClients()
  const { machines, createMachine } = useMachines()

  const [clientId, setClientId] = useState(searchParams.get('cliente') ?? '')
  const [machineId, setMachineId] = useState(searchParams.get('maquina') ?? 'none')
  const [problemDescription, setProblemDescription] = useState('')
  const [diagnosis, setDiagnosis] = useState('')
  const [internalNotes, setInternalNotes] = useState('')
  const [estimatedDelivery, setEstimatedDelivery] = useState('')
  const [saving, setSaving] = useState(false)

  const [clientDialogOpen, setClientDialogOpen] = useState(false)
  const [machineDialogOpen, setMachineDialogOpen] = useState(false)

  const clientMachines = machines.filter(m => m.client_id === clientId)
  const selectedClient = clients.find(c => c.id === clientId)
  const selectedMachine = clientMachines.find(m => m.id === machineId && machineId !== 'none')

  useEffect(() => { setMachineId('none') }, [clientId])

  async function handleCreateClient(values: Omit<Client, 'id' | 'user_id' | 'created_at'>) {
    const { data, error } = await createClient(values)
    if (error) { toast({ title: 'Error al crear cliente', description: error, variant: 'destructive' }); return }
    if (data) { setClientId(data.id); toast({ title: 'Cliente creado' }) }
  }

  async function handleCreateMachine(values: Omit<Machine, 'id' | 'user_id' | 'created_at' | 'client'>) {
    const { data, error } = await createMachine(values)
    if (error) { toast({ title: 'Error al crear máquina', description: error, variant: 'destructive' }); return }
    if (data) { setMachineId(data.id); toast({ title: 'Máquina añadida' }) }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!clientId) { toast({ title: 'Selecciona un cliente', variant: 'destructive' }); return }
    setSaving(true)
    const { data, error } = await createOrder({
      client_id: clientId,
      machine_id: machineId === 'none' ? null : machineId,
      problem_description: problemDescription || undefined,
      diagnosis: diagnosis || undefined,
      internal_notes: internalNotes || undefined,
      estimated_delivery: estimatedDelivery || null,
    })
    setSaving(false)
    if (error) {
      toast({ title: 'Error al crear la orden', description: error, variant: 'destructive' })
    } else if (data) {
      toast({ title: `Orden ${data.order_number} creada` })
      navigate(`/ordenes/${data.id}`)
    }
  }

  return (
    <div>
      <Button variant="ghost" size="sm" className="mb-3 -ml-2 text-muted-foreground" onClick={() => navigate('/ordenes')}>
        <ArrowLeft className="h-4 w-4 mr-1" />Órdenes
      </Button>
      <PageHeader title="Nueva orden de trabajo" />

      <form onSubmit={handleSubmit}>
        {/*
          Mobile: sidebar (cliente/máquina) on top, description below — flex-col-reverse
          Desktop: description on left, sidebar on right — lg:grid
        */}
        <div className="flex flex-col-reverse lg:grid lg:grid-cols-[1fr_300px] lg:items-start gap-5">

          {/* ── LEFT: Descripción del trabajo ── */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Descripción del trabajo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="problem">Descripción del problema</Label>
                  <Textarea
                    id="problem"
                    value={problemDescription}
                    onChange={e => setProblemDescription(e.target.value)}
                    placeholder="Describe el problema que reporta el cliente…"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="diagnosis">Diagnóstico inicial</Label>
                  <Textarea
                    id="diagnosis"
                    value={diagnosis}
                    onChange={e => setDiagnosis(e.target.value)}
                    placeholder="Observaciones técnicas tras la primera inspección…"
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notas internas</Label>
                  <Textarea
                    id="notes"
                    value={internalNotes}
                    onChange={e => setInternalNotes(e.target.value)}
                    placeholder="Notas para uso interno (no aparecen en el presupuesto)…"
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="delivery">Fecha estimada de entrega</Label>
                  <Input
                    id="delivery"
                    type="date"
                    value={estimatedDelivery}
                    onChange={e => setEstimatedDelivery(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Botones en móvil (debajo del formulario) */}
            <div className="flex gap-3 lg:hidden">
              <Button type="button" variant="outline" className="flex-1" onClick={() => navigate('/ordenes')}>
                Cancelar
              </Button>
              <Button type="submit" className="flex-1" disabled={saving || !clientId}>
                {saving ? 'Creando…' : 'Crear orden'}
              </Button>
            </div>
          </div>

          {/* ── RIGHT: Cliente + Máquina + Botones desktop ── */}
          <div className="space-y-4">

            {/* Cliente */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                    Cliente <span className="text-destructive">*</span>
                  </CardTitle>
                  <Button
                    type="button" variant="ghost" size="sm"
                    className="h-7 px-2 text-xs gap-1"
                    onClick={() => setClientDialogOpen(true)}
                  >
                    <Plus className="h-3.5 w-3.5" />Nuevo
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar cliente…" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedClient && (
                  <div className="rounded-md bg-muted/50 px-3 py-2.5 space-y-0.5 text-sm">
                    <p className="font-medium">{selectedClient.name}</p>
                    {selectedClient.phone && <p className="text-xs text-muted-foreground">{selectedClient.phone}</p>}
                    {selectedClient.email && <p className="text-xs text-muted-foreground">{selectedClient.email}</p>}
                    {selectedClient.address && (
                      <p className="text-xs text-muted-foreground truncate">{selectedClient.address}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Máquina */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-1.5">
                    <Wrench className="h-3.5 w-3.5 text-muted-foreground" />
                    Máquina
                  </CardTitle>
                  {clientId && (
                    <Button
                      type="button" variant="ghost" size="sm"
                      className="h-7 px-2 text-xs gap-1"
                      onClick={() => setMachineDialogOpen(true)}
                    >
                      <Plus className="h-3.5 w-3.5" />Nueva
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                {!clientId ? (
                  <p className="text-xs text-muted-foreground py-1">
                    Selecciona primero un cliente para ver sus máquinas.
                  </p>
                ) : (
                  <Select value={machineId} onValueChange={setMachineId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar máquina…" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin máquina específica</SelectItem>
                      {clientMachines.map(m => (
                        <SelectItem key={m.id} value={m.id}>
                          {[m.brand, m.model].filter(Boolean).join(' ') || 'Máquina sin nombre'}
                          {m.serial_number ? ` (${m.serial_number})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {selectedMachine && (
                  <div className="rounded-md bg-muted/50 px-3 py-2.5 space-y-1.5">
                    <MachineTypeBadge type={selectedMachine.type} />
                    {(selectedMachine.brand || selectedMachine.model) && (
                      <p className="text-sm font-medium">
                        {[selectedMachine.brand, selectedMachine.model].filter(Boolean).join(' ')}
                      </p>
                    )}
                    {selectedMachine.serial_number && (
                      <p className="text-xs text-muted-foreground font-mono">
                        S/N: {selectedMachine.serial_number}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Botones desktop */}
            <div className="hidden lg:flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={() => navigate('/ordenes')}>
                Cancelar
              </Button>
              <Button type="submit" className="flex-1" disabled={saving || !clientId}>
                {saving ? 'Creando…' : 'Crear orden'}
              </Button>
            </div>

          </div>
        </div>
      </form>

      <ClienteFormDialog
        open={clientDialogOpen}
        onClose={() => setClientDialogOpen(false)}
        onSave={handleCreateClient}
      />
      {clientId && (
        <MaquinaFormDialog
          open={machineDialogOpen}
          onClose={() => setMachineDialogOpen(false)}
          onSave={handleCreateMachine}
          clientId={clientId}
        />
      )}
    </div>
  )
}
