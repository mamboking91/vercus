import {
  Tractor, Axe, Scissors, Bolt, Wrench, Car, Truck, Settings,
  Hammer, Zap, Leaf, Gauge, Flame, Bike, Fan,
  type LucideIcon,
} from 'lucide-react'
import { useMachineTypesContext } from '@/contexts/MachineTypesContext'

export const ICON_OPTIONS: { id: string; Icon: LucideIcon; label: string }[] = [
  { id: 'tractor',  Icon: Tractor,   label: 'Tractor'      },
  { id: 'axe',      Icon: Axe,       label: 'Motosierra'   },
  { id: 'scissors', Icon: Scissors,  label: 'Desbrozadora' },
  { id: 'bolt',     Icon: Bolt,      label: 'Eléctrica'    },
  { id: 'wrench',   Icon: Wrench,    label: 'Herramienta'  },
  { id: 'car',      Icon: Car,       label: 'Vehículo'     },
  { id: 'truck',    Icon: Truck,     label: 'Camión'       },
  { id: 'hammer',   Icon: Hammer,    label: 'Martillo'     },
  { id: 'gauge',    Icon: Gauge,     label: 'Motor'        },
  { id: 'zap',      Icon: Zap,       label: 'Eléctrico'    },
  { id: 'leaf',     Icon: Leaf,      label: 'Jardín'       },
  { id: 'flame',    Icon: Flame,     label: 'Calefacción'  },
  { id: 'bike',     Icon: Bike,      label: 'Moto'         },
  { id: 'fan',      Icon: Fan,       label: 'Ventilación'  },
  { id: 'settings', Icon: Settings,  label: 'Máquina'      },
]

export const COLOR_OPTIONS: { id: string; className: string; label: string }[] = [
  { id: 'green',  className: 'bg-green-100 text-green-700',   label: 'Verde'   },
  { id: 'orange', className: 'bg-orange-100 text-orange-700', label: 'Naranja' },
  { id: 'lime',   className: 'bg-lime-100 text-lime-700',     label: 'Lima'    },
  { id: 'blue',   className: 'bg-blue-100 text-blue-700',     label: 'Azul'    },
  { id: 'slate',  className: 'bg-slate-100 text-slate-600',   label: 'Gris'    },
  { id: 'red',    className: 'bg-red-100 text-red-700',       label: 'Rojo'    },
  { id: 'purple', className: 'bg-purple-100 text-purple-700', label: 'Morado'  },
  { id: 'yellow', className: 'bg-yellow-100 text-yellow-700', label: 'Amarillo'},
  { id: 'pink',   className: 'bg-pink-100 text-pink-700',     label: 'Rosa'    },
  { id: 'cyan',   className: 'bg-cyan-100 text-cyan-700',     label: 'Cian'    },
]

export const ICON_MAP: Record<string, LucideIcon> = Object.fromEntries(
  ICON_OPTIONS.map(o => [o.id, o.Icon])
)

export const COLOR_MAP: Record<string, string> = Object.fromEntries(
  COLOR_OPTIONS.map(o => [o.id, o.className])
)

interface Props {
  type: string
  size?: 'sm' | 'md'
}

export function MachineTypeBadge({ type, size = 'sm' }: Props) {
  const { machineTypes } = useMachineTypesContext()
  const mt = machineTypes.find(t => t.slug === type)

  const Icon = ICON_MAP[mt?.icon ?? 'wrench'] ?? Wrench
  const className = COLOR_MAP[mt?.color ?? 'slate'] ?? 'bg-slate-100 text-slate-600'
  const label = mt?.name ?? type

  const isSmall = size === 'sm'
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium ${className} ${isSmall ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1'}`}>
      <Icon className={isSmall ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
      {label}
    </span>
  )
}
