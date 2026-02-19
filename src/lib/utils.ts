import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount)
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(typeof date === 'string' ? new Date(date) : date)
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(typeof date === 'string' ? new Date(date) : date)
}

export function generateOrderNumber(sequence: number, year?: number): string {
  const y = year ?? new Date().getFullYear()
  return `ORD-${y}-${String(sequence).padStart(3, '0')}`
}

export function generateQuoteNumber(sequence: number, year?: number): string {
  const y = year ?? new Date().getFullYear()
  return `PRS-${y}-${String(sequence).padStart(3, '0')}`
}
