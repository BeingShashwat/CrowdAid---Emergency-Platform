import { useEffect, useState } from 'react'
import { HeroSection } from '@/components/features/hero/HeroSection'
import { VolunteerDashboard } from '@/components/features/volunteer/VolunteerDashboard'
import { useLocation } from '@/hooks/useLocation'
import { emergencyService } from '@/services/api'

export default function VolunteerDashboardPage() {
  const { location, isLoading, error, refresh } = useLocation()
  const [hasActiveSos, setHasActiveSos] = useState(false)

  useEffect(() => {
    let mounted = true
    const loadActive = async () => {
      try {
        const rows = await emergencyService.getMy(true)
        if (!mounted) return
        setHasActiveSos(rows.some((item) => item.status === 'PENDING' || item.status === 'IN_PROGRESS'))
      } catch {
        if (mounted) setHasActiveSos(false)
      }
    }

    loadActive()
    const interval = setInterval(loadActive, 10000)
    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [])

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-10 px-4">
      <HeroSection
        userLocation={isLoading ? null : location}
        sosLocked={hasActiveSos}
        sosLockMessage="You already have an active SOS. Complete it before sending another one."
        onSosSent={() => setHasActiveSos(true)}
      />
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Volunteer Dashboard</h1>
        <p className="text-sm text-gray-600 mb-6">
          As a volunteer, you can also raise SOS for yourself. Nearby emergencies are based on your browser location.
        </p>
        <VolunteerDashboard
          location={location}
          locationLoading={isLoading}
          locationError={error}
          refreshLocation={refresh}
        />
      </div>
    </main>
  )
}
