import { useState, useEffect } from 'react'
import type { Location } from '@/types'
import { locationService } from '@/services/api'

export function useLocation() {
  const [location, setLocation] = useState<Location | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLocation = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const loc = await locationService.getCurrentPosition()
      setLocation(loc)
    } catch (err: any) {
      setError(err?.message ?? 'Could not get location')
      setLocation(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { fetchLocation() }, [])

  return { location, isLoading, error, refresh: fetchLocation }
}
