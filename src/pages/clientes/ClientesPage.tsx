import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Users, Phone, Mail } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { ClienteFormDialog } from '@/components/clientes/ClienteFormDialog'
import { useClients } from '@/hooks/useClients'
import { useMachines } from '@/hooks/useMachines'
import { toast } from '@/hooks/use-toast'
import { type Client } from '@/types'

function ClientCard({ client, machineCount, onClick }: { client: Client; machineCount: number; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 cursor-pointer transition-colors"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <span className="text-sm font-semibold text-primary">
            {client.name.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="min-w-0">
          <p className="font-medium truncate">{client.name}</p>
          <div className="flex items-center gap-3 mt-0.5">
            {client.phone && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Phone className="h-3 w-3" />{client.phone}
              </span>
            )}
            {client.email && (
              <span className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                <Mail className="h-3 w-3" />{client.email}
              </span>
            )}
          </div>
        </div>
      </div>
      <span className="text-xs text-muted-foreground shrink-0 ml-4">
        {machineCount} {machineCount === 1 ? 'máquina' : 'máquinas'}
      </span>
    </div>
  )
}

export default function ClientesPage() {
  const navigate = useNavigate()
  const { clients, loading, createClient } = useClients()
  const { machines } = useMachines()
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)

  const filtered = useMemo(() => {
    if (!search.trim()) return clients
    const q = search.toLowerCase()
    return clients.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.phone?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q)
    )
  }, [clients, search])

  const machineCountByClient = useMemo(() => {
    const map: Record<string, number> = {}
    machines.forEach(m => { map[m.client_id] = (map[m.client_id] ?? 0) + 1 })
    return map
  }, [machines])

  async function handleCreate(values: Omit<Client, 'id' | 'user_id' | 'created_at'>) {
    const { data, error } = await createClient(values)
    if (error) {
      toast({ title: 'Error al crear cliente', description: error, variant: 'destructive' })
    } else {
      toast({ title: 'Cliente creado' })
      if (data) navigate(`/clientes/${data.id}`)
    }
  }

  return (
    <div>
      <PageHeader
        title="Clientes"
        description={`${clients.length} cliente${clients.length !== 1 ? 's' : ''} registrado${clients.length !== 1 ? 's' : ''}`}
        action={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />Nuevo cliente
          </Button>
        }
      />

      {/* Buscador */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre, teléfono o email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Lista */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 flex flex-col items-center text-center">
            <Users className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="font-medium">{search ? 'Sin resultados' : 'No hay clientes aún'}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {search ? 'Prueba con otro término de búsqueda.' : 'Crea el primer cliente para empezar.'}
            </p>
            {!search && (
              <Button className="mt-4" onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />Nuevo cliente
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(client => (
            <ClientCard
              key={client.id}
              client={client}
              machineCount={machineCountByClient[client.id] ?? 0}
              onClick={() => navigate(`/clientes/${client.id}`)}
            />
          ))}
        </div>
      )}

      <ClienteFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleCreate}
      />
    </div>
  )
}
