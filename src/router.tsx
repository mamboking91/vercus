import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { useAuth } from '@/hooks/useAuth'

// Lazy-loaded pages
const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage'))
const ClientesPage = lazy(() => import('@/pages/clientes/ClientesPage'))
const ClienteDetallePage = lazy(() => import('@/pages/clientes/ClienteDetallePage'))
const MaquinasPage = lazy(() => import('@/pages/maquinas/MaquinasPage'))
const OrdenesPage = lazy(() => import('@/pages/ordenes/OrdenesPage'))
const OrdenNuevaPage = lazy(() => import('@/pages/ordenes/OrdenNuevaPage'))
const OrdenDetallePage = lazy(() => import('@/pages/ordenes/OrdenDetallePage'))
const PresupuestosListPage = lazy(() => import('@/pages/presupuestos/PresupuestosListPage'))
const PresupuestosPage = lazy(() => import('@/pages/presupuestos/PresupuestosPage'))
const CatalogoPage = lazy(() => import('@/pages/catalogo/CatalogoPage'))
const FinanzasPage = lazy(() => import('@/pages/finanzas/FinanzasPage'))
const ConfiguracionPage = lazy(() => import('@/pages/configuracion/ConfiguracionPage'))
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'))
const RegistroPage = lazy(() => import('@/pages/auth/RegistroPage'))

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

// Protected route wrapper — used inside the router
function ProtectedLayout() {
  const { session, loading } = useAuth()
  if (loading) return <PageLoader />
  if (!session) return <Navigate to="/login" replace />
  return <AppLayout />
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <Suspense fallback={<PageLoader />}>
        <LoginPage />
      </Suspense>
    ),
  },
  {
    path: '/registro',
    element: (
      <Suspense fallback={<PageLoader />}>
        <RegistroPage />
      </Suspense>
    ),
  },
  {
    path: '/',
    element: <ProtectedLayout />,
    children: [
      {
        index: true,
        element: <Suspense fallback={<PageLoader />}><DashboardPage /></Suspense>,
      },
      {
        path: 'clientes',
        element: <Suspense fallback={<PageLoader />}><ClientesPage /></Suspense>,
      },
      {
        path: 'clientes/:id',
        element: <Suspense fallback={<PageLoader />}><ClienteDetallePage /></Suspense>,
      },
      {
        path: 'maquinas/:id',
        element: <Suspense fallback={<PageLoader />}><MaquinasPage /></Suspense>,
      },
      {
        path: 'ordenes',
        element: <Suspense fallback={<PageLoader />}><OrdenesPage /></Suspense>,
      },
      {
        path: 'ordenes/nueva',
        element: <Suspense fallback={<PageLoader />}><OrdenNuevaPage /></Suspense>,
      },
      {
        path: 'ordenes/:id',
        element: <Suspense fallback={<PageLoader />}><OrdenDetallePage /></Suspense>,
      },
      {
        path: 'presupuestos',
        element: <Suspense fallback={<PageLoader />}><PresupuestosListPage /></Suspense>,
      },
      {
        path: 'presupuestos/:id',
        element: <Suspense fallback={<PageLoader />}><PresupuestosPage /></Suspense>,
      },
      {
        path: 'catalogo',
        element: <Suspense fallback={<PageLoader />}><CatalogoPage /></Suspense>,
      },
      {
        path: 'finanzas',
        element: <Suspense fallback={<PageLoader />}><FinanzasPage /></Suspense>,
      },
      {
        path: 'configuracion',
        element: <Suspense fallback={<PageLoader />}><ConfiguracionPage /></Suspense>,
      },
    ],
  },
])
