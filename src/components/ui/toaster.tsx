import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import {
  Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport,
} from '@/components/ui/toast'

function ToastIcon({ variant }: { variant?: string | null }) {
  if (variant === 'destructive') return <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
  if (variant === 'warning')     return <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
  if (variant === 'success')     return <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
  /* default = success operation */   return <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
}

export function Toaster() {
  const { toasts } = useToast()
  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, action, ...props }) => (
        <Toast key={id} {...props}>
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <ToastIcon variant={props.variant} />
            <div className="grid gap-0.5 flex-1 min-w-0">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && <ToastDescription>{description}</ToastDescription>}
            </div>
          </div>
          {action}
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  )
}
