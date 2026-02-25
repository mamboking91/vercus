import { createContext, useContext, type ReactNode } from 'react'
import { useMachineTypes } from '@/hooks/useMachineTypes'
import { type MachineTypeRecord } from '@/types'

interface MachineTypesContextValue {
  machineTypes: MachineTypeRecord[]
  loading: boolean
  createMachineType: (v: { name: string; icon: string; color: string }) => Promise<{ error: string | null }>
  updateMachineType: (id: string, v: { name: string; icon: string; color: string }) => Promise<{ error: string | null }>
  deleteMachineType: (id: string) => Promise<{ error: string | null }>
}

const MachineTypesContext = createContext<MachineTypesContextValue | null>(null)

export function MachineTypesProvider({ children }: { children: ReactNode }) {
  const value = useMachineTypes()
  return (
    <MachineTypesContext.Provider value={value}>
      {children}
    </MachineTypesContext.Provider>
  )
}

export function useMachineTypesContext() {
  const ctx = useContext(MachineTypesContext)
  if (!ctx) throw new Error('useMachineTypesContext must be used inside MachineTypesProvider')
  return ctx
}
