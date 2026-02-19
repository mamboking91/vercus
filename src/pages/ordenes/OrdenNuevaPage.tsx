import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Plus } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ClienteFormDialog } from '@/components/clientes/ClienteFormDialog'
import { MaquinaFormDialog } from '@/components/maquinas/MaquinaFormDialog'
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

  // Filtrar máquinas por cliente seleccionado
  const clientMachines = machines.filter(m => m.client_id === clientId)

  // Resetear máquina si cambia el cliente
  useEffect(() => {
    setMachineId('none')
  }, [clientId])

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
        <div className="space-y-6 max-w-2xl">
          {/* Cliente */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-end gap-2">
                <div className="flex-1 space-y-2">
                  <Label>Cliente <span className="text-destructive">*</span></Label>
                  <Select value={clientId} onValueChange={setClientId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar cliente…" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}{c.phone ? ` · ${c.phone}` : ''}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="button" variant="outline" size="icon" onClick={() => setClientDialogOpen(true)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Máquina */}
              <div className="flex items-end gap-2">
                <div className="flex-1 space-y-2">
                  <Label>Máquina</Label>
                  <Select value={machineId} onValueChange={setMachineId} disabled={!clientId}>
                    <SelectTrigger>
                      <SelectValue placeholder={clientId ? 'Seleccionar máquina…' : 'Selecciona un cliente primero'} />
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
                </div>
                <Button type="button" variant="outline" size="icon" disabled={!clientId} onClick={() => setMachineDialogOpen(true)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Descripción del trabajo */}
          <Card>
            <CardContent className="pt-6 space-y-4">
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

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => navigate('/ordenes')}>Cancelar</Button>
            <Button type="submit" disabled={saving || !clientId}>
              {saving ? 'Creando orden…' : 'Crear orden de trabajo'}
            </Button>
          </div>
        </div>
      </form>

      <ClienteFormDialog open={clientDialogOpen} onClose={() => setClientDialogOpen(false)} onSave={handleCreateClient} />
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
