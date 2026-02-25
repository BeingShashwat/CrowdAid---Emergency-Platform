import { useEffect, useRef, useState } from 'react'
import { HeroSection } from '@/components/features/hero/HeroSection'
import { useLocation } from '@/hooks/useLocation'
import { emergencyService } from '@/services/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/primitives'
import { Button } from '@/components/ui/button'
import { Phone, Clock, MapPin } from 'lucide-react'
import { getStatusColor, getEmergencyLabel, formatRelativeTime } from '@/lib/utils'
import type { Emergency, EmergencyStatus } from '@/types'
import { toast } from 'sonner'

export default function UserDashboardPage() {
  const { location, isLoading, error } = useLocation()
  const [myRequests, setMyRequests] = useState<Emergency[]>([])
  const [isLoadingRequests, setIsLoadingRequests] = useState(true)
  const [submittingThanksId, setSubmittingThanksId] = useState<string | null>(null)
  const [updatingRequestId, setUpdatingRequestId] = useState<string | null>(null)
  const previousStatusRef = useRef<Map<string, EmergencyStatus>>(new Map())

  const loadMyRequests = async (silent = false) => {
    if (!silent) setIsLoadingRequests(true)
    try {
      const data = await emergencyService.getMy(false)
      setMyRequests(data)

      for (const item of data) {
        const previous = previousStatusRef.current.get(item.id)
        if (previous && previous !== item.status) {
          if (item.status === 'IN_PROGRESS') {
            toast.success(
              item.volunteerPhone
                ? `A volunteer responded. Contact: ${item.volunteerPhone}`
                : 'A volunteer responded to your help request.'
            )
          }
          if (item.status === 'RESOLVED') {
            toast.success('Your help request has been marked completed.')
          }
        }
        previousStatusRef.current.set(item.id, item.status)
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Could not load your help requests.')
      setMyRequests([])
    } finally {
      setIsLoadingRequests(false)
    }
  }

  useEffect(() => {
    loadMyRequests()
    const interval = setInterval(() => loadMyRequests(true), 10000)
    return () => clearInterval(interval)
  }, [])

  const submitThanks = async (requestId: string, points: number) => {
    setSubmittingThanksId(requestId)
    try {
      const updated = await emergencyService.thankVolunteer(requestId, points)
      setMyRequests((prev) => prev.map((item) => (item.id === requestId ? updated : item)))
      toast.success(`Thank you sent: ${points} points`)
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Could not submit thank points.')
    } finally {
      setSubmittingThanksId(null)
    }
  }

  const completeHelp = async (requestId: string) => {
    setUpdatingRequestId(requestId)
    try {
      await emergencyService.resolve(requestId)
      await loadMyRequests(true)
      toast.success('Help marked as completed.')
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Could not complete this help request.')
    } finally {
      setUpdatingRequestId(null)
    }
  }

  const cancelHelp = async (requestId: string) => {
    setUpdatingRequestId(requestId)
    try {
      await emergencyService.cancel(requestId)
      await loadMyRequests(true)
      toast.success('Help request cancelled.')
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Could not cancel this help request.')
    } finally {
      setUpdatingRequestId(null)
    }
  }

  const hasActiveSos = myRequests.some((item) => item.status === 'PENDING' || item.status === 'IN_PROGRESS')

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {error && (
        <div className="max-w-4xl mx-auto px-4 pt-6">
          <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Enable browser location so responders can navigate to you faster.
          </div>
        </div>
      )}
      <HeroSection
        userLocation={isLoading ? null : location}
        sosLocked={hasActiveSos}
        sosLockMessage="You already have an active SOS. Use Complete Help or Cancel Help below."
        onSosSent={(created) => setMyRequests((prev) => [created, ...prev])}
      />

      <section className="max-w-6xl mx-auto px-4 pb-14">
        <Card>
          <CardHeader>
            <CardTitle>Your Help Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingRequests ? (
              <p className="text-sm text-gray-500">Loading your requests...</p>
            ) : myRequests.length === 0 ? (
              <p className="text-sm text-gray-500">No help requests yet.</p>
            ) : (
              <div className="space-y-3">
                {myRequests.map((item) => (
                  <div key={item.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(item.status)}`}>
                            {item.status.replace('_', ' ').toLowerCase()}
                          </span>
                          <span className="text-xs text-gray-500">{getEmergencyLabel(item.type)}</span>
                        </div>
                        <p className="text-sm font-medium text-gray-900">{item.description || 'Emergency help request'}</p>
                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {item.location.address}
                        </p>
                        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatRelativeTime(item.createdAt)}
                        </p>
                        {item.volunteerPhone && (
                          <a href={`tel:${item.volunteerPhone}`} className="inline-flex items-center gap-1 text-sm text-blue-700 underline mt-2">
                            <Phone className="h-3.5 w-3.5" />
                            Volunteer: {item.volunteerPhone}
                          </a>
                        )}
                      </div>
                    </div>

                    {(item.status === 'PENDING' || item.status === 'IN_PROGRESS') && (
                      <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap items-center gap-2">
                        {item.status === 'IN_PROGRESS' && (
                          <Button
                            size="sm"
                            disabled={updatingRequestId === item.id}
                            onClick={() => completeHelp(item.id)}
                          >
                            Complete Help
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={updatingRequestId === item.id}
                          onClick={() => cancelHelp(item.id)}
                        >
                          Cancel Help
                        </Button>
                      </div>
                    )}

                    {item.status === 'RESOLVED' && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        {item.thankPoints ? (
                          <p className="text-sm text-green-700">Thank you shared: {item.thankPoints} points</p>
                        ) : (
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm text-gray-700">Send thank you points:</span>
                            {[1, 2, 3, 4, 5].map((points) => (
                              <Button
                                key={points}
                                size="sm"
                                variant="outline"
                                disabled={submittingThanksId === item.id}
                                onClick={() => submitThanks(item.id, points)}
                              >
                                {points}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
