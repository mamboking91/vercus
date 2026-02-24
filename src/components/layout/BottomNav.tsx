import { NavLink } from 'react-router-dom'
import { LayoutDashboard, ClipboardList, Users, FileText, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'

const nav = [
  { to: '/', label: 'Inicio', icon: LayoutDashboard, end: true },
  { to: '/ordenes', label: 'Órdenes', icon: ClipboardList },
  { to: '/presupuestos', label: 'Presupuestos', icon: FileText },
  { to: '/clientes', label: 'Clientes', icon: Users },
  { to: '/finanzas', label: 'Finanzas', icon: BarChart3 },
]

export function BottomNav() {
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex">
        {nav.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs font-medium transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )
            }
          >
            <Icon className="h-5 w-5" />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
