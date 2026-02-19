import { useState, useEffect, useCallback } from 'react'
import { Search } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { type PartsCatalogItem } from '@/types'
import { formatCurrency } from '@/lib/utils'

interface Props {
  open: boolean
  onClose: () => void
  onSelect: (part: PartsCatalogItem) => void
}

export function CatalogSearchDialog({ open, onClose, onSelect }: Props) {
  const { user } = useAuth()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PartsCatalogItem[]>([])
  const [loading, setLoading] = useState(false)

  const search = useCallback(async (q: string) => {
    if (!user) return
    setLoading(true)
    let dbQuery = supabase
      .from('parts_catalog')
      .select('*')
      .eq('user_id', user.id)
      .order('description')
      .limit(20)

    if (q.trim()) {
      dbQuery = dbQuery.or(
        `description.ilike.%${q}%,code.ilike.%${q}%,brand.ilike.%${q}%`
      )
    }

    const { data } = await dbQuery
    setResults((data as PartsCatalogItem[]) ?? [])
    setLoading(false)
  }, [user])

  useEffect(() => {
    if (!open) { setQuery(''); setResults([]); return }
    const timer = setTimeout(() => search(query), 300)
    return () => clearTimeout(timer)
  }, [query, open, search])

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Buscar en catálogo</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              autoFocus
              placeholder="Código, marca o descripción…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="max-h-72 overflow-y-auto space-y-1">
            {loading ? (
              <p className="text-sm text-muted-foreground text-center py-6">Buscando…</p>
            ) : results.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                {query ? 'Sin resultados. Añade la pieza manualmente.' : 'Escribe para buscar en el catálogo.'}
              </p>
            ) : (
              results.map(part => (
                <button
                  key={part.id}
                  type="button"
                  onClick={() => { onSelect(part); onClose() }}
                  className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-accent text-left transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{part.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {[part.code, part.brand].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-primary ml-3 shrink-0">
                    {formatCurrency(part.sell_price)}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
