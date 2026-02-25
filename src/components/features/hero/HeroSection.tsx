import { useState, useEffect, type ElementType } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, Flame, Car, Shield, Home, AlertTriangle, Phone, Siren } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { emergencyService } from '@/services/api'
import { useAuth } from '@/hooks/useAuth'
import { formatCountdown, getEmergencyLabel } from '@/lib/utils'
import type { Emergency, EmergencyType, Location } from '@/types'
import { toast } from 'sonner'

const EMERGENCY_TYPES: { id: EmergencyType; label: string; icon: ElementType; bg: string; desc: string }[] = [
  { id: 'MEDICAL', label: 'Medical', icon: Heart, bg: 'bg-red-500', desc: 'Health emergency' },
  { id: 'FIRE', label: 'Fire', icon: Flame, bg: 'bg-orange-500', desc: 'Fire or smoke' },
  { id: 'VEHICLE_ACCIDENT', label: 'Vehicle', icon: Car, bg: 'bg-yellow-500', desc: 'Road accident' },
  { id: 'PERSONAL_SAFETY', label: 'Safety', icon: Shield, bg: 'bg-purple-500', desc: 'Personal threat' },
  { id: 'NATURAL_DISASTER', label: 'Disaster', icon: Home, bg: 'bg-green-500', desc: 'Flood/quake' },
  { id: 'OTHER', label: 'Other', icon: AlertTriangle, bg: 'bg-blue-500', desc: 'Other critical issue' },
]

interface Props {
  userLocation: Location | null
  sosLocked?: boolean
  sosLockMessage?: string
  onSosSent?: (emergency: Emergency) => void
}

export function HeroSection({ userLocation, sosLocked = false, sosLockMessage, onSosSent }: Props) {
  const [selected, setSelected] = useState<EmergencyType | null>(null)
  const [sosActive, setSosActive] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [isSending, setIsSending] = useState(false)
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (countdown <= 0) {
      if (sosActive) setSosActive(false)
      return
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown, sosActive])

  const handleSOS = async () => {
    if (!selected) {
      toast.error('Select an emergency type first.')
      return
    }
    if (sosLocked) {
      toast.error(sosLockMessage || 'You already have an active help request.')
      return
    }
    if (!userLocation) {
      toast.error('Location permission is required to send SOS.')
      return
    }

    setIsSending(true)
    try {
      const created = await emergencyService.sendSOS({
        type: selected,
        location: userLocation,
        description: getEmergencyLabel(selected),
        sharePhone: true,
      })
      setSosActive(true)
      setCountdown(180)
      onSosSent?.(created)
      toast.success('SOS sent. Nearby volunteers and services have been notified.')
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'SOS could not be sent. Please call 112/102 immediately.')
    } finally {
      setIsSending(false)
    }
  }

  const handleCancelSOS = () => {
    setSosActive(false)
    setCountdown(0)
    toast.info('Local SOS alert state cleared.')
  }

  return (
    <section className="relative py-14 px-4 overflow-hidden">
      <div className="absolute inset-0 gradient-hero" />
      <div className="absolute inset-0 bg-black/20" />

      <div className="relative max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
            Emergency SOS
          </h1>
          <p className="text-base text-blue-100 max-w-2xl mx-auto">
            Share your browser location and emergency type to dispatch help fast.
          </p>
          <p className="text-xs text-blue-200 mt-3">
            {userLocation ? `Location: ${userLocation.address}` : 'Location not available yet.'}
          </p>
        </div>

        <div className="mb-8">
          <p className="text-center text-white/80 text-xs mb-3 uppercase tracking-wider font-medium">
            Select Emergency Type
          </p>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3 max-w-3xl mx-auto">
            {EMERGENCY_TYPES.map((type) => (
              <button
                key={type.id}
                onClick={() => setSelected(type.id)}
                className={`relative p-3 rounded-xl border-2 transition-all duration-200 text-center ${
                  selected === type.id
                    ? 'border-yellow-300 bg-yellow-400/20'
                    : 'border-white/20 bg-white/10 hover:bg-white/20 hover:border-white/40'
                }`}
              >
                <div className={`w-10 h-10 ${type.bg} rounded-lg flex items-center justify-center mx-auto mb-2`}>
                  <type.icon className="h-5 w-5 text-white" />
                </div>
                <p className="text-white text-xs font-medium">{type.label}</p>
                <p className="text-white/70 text-[10px] mt-0.5 hidden md:block">{type.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center gap-4">
          <button
            onClick={sosActive ? handleCancelSOS : handleSOS}
            disabled={isSending || (!sosActive && sosLocked)}
            className={`relative w-52 h-52 rounded-full font-bold text-4xl shadow-2xl transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-4 ${
              sosActive
                ? 'bg-gradient-to-br from-green-500 to-green-600 text-white focus:ring-green-400/50'
                : 'bg-gradient-to-br from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 emergency-pulse focus:ring-red-400/50'
            }`}
            aria-label={sosActive ? 'Cancel SOS' : 'Send SOS'}
          >
            {isSending ? (
              <span className="text-lg">Sending…</span>
            ) : sosActive ? (
              <div className="text-center">
                <div className="text-xl font-bold">HELP</div>
                <div className="text-2xl font-bold">COMING</div>
                <div className="text-sm mt-1 opacity-80">Tap to clear</div>
              </div>
            ) : sosLocked ? (
              <div className="text-center">
                <div className="text-2xl font-bold">WAIT</div>
                <div className="text-sm mt-1 opacity-80">Active SOS</div>
              </div>
            ) : (
              'SOS'
            )}
          </button>

          {countdown > 0 && (
            <div className="glass rounded-xl px-4 py-3 text-center text-white">
              <p className="font-semibold">SOS Active</p>
              <p className="text-sm text-white/80">
                ETA window: <span className="font-mono font-bold text-yellow-300">{formatCountdown(countdown)}</span>
              </p>
            </div>
          )}

          {!sosActive && sosLocked && (
            <div className="glass rounded-xl px-4 py-3 text-center text-white">
              <p className="text-sm">{sosLockMessage || 'SOS is temporarily locked because you have an active help request.'}</p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <a href="tel:102">
              <Button size="lg" variant="danger" className="px-6">
                <Phone className="h-4 w-4" />
                Call Ambulance (102)
              </Button>
            </a>
            <a href="tel:112">
              <Button size="lg" variant="outline" className="bg-white/10 border-white/40 text-white hover:bg-white/20 px-6">
                <Siren className="h-4 w-4" />
                Call Emergency (112)
              </Button>
            </a>
            {!isAuthenticated && (
              <Button
                size="lg"
                variant="outline"
                className="bg-white/10 border-white/40 text-white hover:bg-white/20 px-6"
                onClick={() => navigate('/login')}
              >
                Login
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
