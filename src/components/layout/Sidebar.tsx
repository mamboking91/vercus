import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Users, Wrench, ClipboardList, BookOpen, FileText, BarChart3, Settings, LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/ordenes', label: 'Órdenes', icon: ClipboardList },
  { to: '/presupuestos', label: 'Presupuestos', icon: FileText },
  { to: '/clientes', label: 'Clientes', icon: Users },
  { to: '/catalogo', label: 'Catálogo', icon: BookOpen },
  { to: '/finanzas', label: 'Finanzas', icon: BarChart3 },
  { to: '/configuracion', label: 'Configuración', icon: Settings },
]

export function Sidebar() {
  const { signOut } = useAuth()

  return (
    <aside className="hidden md:flex flex-col w-56 h-screen sticky top-0 shrink-0 bg-white border-r border-border overflow-y-auto">
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 py-5 border-b border-border">
        <Wrench className="h-6 w-6 text-primary" />
        <span className="text-xl font-bold tracking-tight text-foreground">Vercus</span>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 p-3 flex-1">
        {nav.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-border space-y-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground hover:text-destructive"
          onClick={signOut}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Cerrar sesión
        </Button>
        <p className="text-xs text-muted-foreground px-3">Vercus v0.1</p>
      </div>
    </aside>
  )
}
