import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} min ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
}

export function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function getEmergencyLabel(type: string): string {
  const labels: Record<string, string> = {
    MEDICAL: 'Medical Emergency',
    FIRE: 'Fire Emergency',
    VEHICLE_ACCIDENT: 'Vehicle Accident',
    PERSONAL_SAFETY: 'Personal Safety',
    NATURAL_DISASTER: 'Natural Disaster',
    LOST_PERSON: 'Lost Person',
    OTHER: 'Other Emergency',
  }
  return labels[type] ?? type
}

export function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'CRITICAL':
    case 'HIGH': return 'bg-red-100 text-red-800 border-red-200'
    case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'LOW': return 'bg-green-100 text-green-800 border-green-200'
    default: return 'bg-gray-100 text-gray-700 border-gray-200'
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'RESOLVED':   return 'bg-green-100 text-green-800'
    case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800'
    case 'PENDING':    return 'bg-red-100 text-red-800'
    case 'CANCELLED':  return 'bg-gray-100 text-gray-700'
    default:           return 'bg-gray-100 text-gray-700'
  }
}
