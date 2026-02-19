import { Outlet } from 'react-router-dom'
import { Wrench } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { Toaster } from '@/components/ui/toaster'

export function AppLayout() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top bar solo en móvil */}
        <header className="md:hidden sticky top-0 z-40 flex items-center justify-center h-12 bg-white border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <Wrench className="h-4 w-4 text-primary" />
            <span className="text-base font-bold tracking-tight">Vercus</span>
          </div>
        </header>
        <div className="flex-1 p-4 md:p-8 pb-20 md:pb-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </div>
      </main>
      <BottomNav />
      <Toaster />
    </div>
  )
}
