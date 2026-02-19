import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { Toaster } from '@/components/ui/toaster'

export function AppLayout() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 p-4 md:p-8 pb-20 md:pb-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </div>
      </main>
      <BottomNav />
      <Toaster />
    </div>
  )
}
