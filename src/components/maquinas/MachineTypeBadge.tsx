import { Tractor, Axe, Scissors, Bolt, Wrench } from 'lucide-react'
import { type MachineType, MACHINE_TYPE_LABELS } from '@/types'
import { type LucideIcon } from 'lucide-react'

const TYPE_CONFIG: Record<MachineType, { icon: LucideIcon; className: string }> = {
  tractor:      { icon: Tractor,  className: 'bg-green-100 text-green-700' },
  motosierra:   { icon: Axe,      className: 'bg-orange-100 text-orange-700' },
  desbrozadora: { icon: Scissors, className: 'bg-lime-100 text-lime-700' },
  electrica:    { icon: Bolt,     className: 'bg-blue-100 text-blue-700' },
  otro:         { icon: Wrench,   className: 'bg-slate-100 text-slate-600' },
}

interface Props {
  type: MachineType
  size?: 'sm' | 'md'
}

export function MachineTypeBadge({ type, size = 'sm' }: Props) {
  const { icon: Icon, className } = TYPE_CONFIG[type]
  const isSmall = size === 'sm'

  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium ${className} ${isSmall ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1'}`}>
      <Icon className={isSmall ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
      {MACHINE_TYPE_LABELS[type]}
    </span>
  )
}
