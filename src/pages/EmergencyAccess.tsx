import { HeroSection } from '@/components/features/hero/HeroSection'
import { useLocation } from '@/hooks/useLocation'

export default function EmergencyAccessPage() {
  const { location, isLoading, error } = useLocation()

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {error && (
        <div className="max-w-4xl mx-auto px-4 pt-6">
          <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Location permission is required to dispatch volunteers accurately. {error}
          </div>
        </div>
      )}
      <HeroSection userLocation={isLoading ? null : location} />
    </main>
  )
}
