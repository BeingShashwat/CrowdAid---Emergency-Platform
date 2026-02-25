import { useState, useEffect, useRef } from 'react'
import { Users, Award, MapPin, Phone, RefreshCw, Clock, CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, Progress } from '@/components/ui/primitives'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { volunteerService, emergencyService } from '@/services/api'
import { useAuth } from '@/hooks/useAuth'
import { getStatusColor, getSeverityColor, getEmergencyLabel, formatRelativeTime } from '@/lib/utils'
import type { VolunteerStats, VolunteerActivity, Emergency, Location } from '@/types'
import { toast } from 'sonner'

interface SharedContactInfo {
  requesterPhone?: string
  volunteerPhone?: string
}

interface VolunteerDashboardProps {
  location: Location | null
  locationLoading: boolean
  locationError: string | null
  refreshLocation: () => Promise<void>
}

export function VolunteerDashboard({
  location,
  locationLoading,
  locationError,
  refreshLocation,
}: VolunteerDashboardProps) {
  const { user } = useAuth()
  const [stats, setStats] = useState<VolunteerStats | null>(null)
  const [activity, setActivity] = useState<VolunteerActivity[]>([])
  const [nearbyRequests, setNearbyRequests] = useState<Emergency[]>([])
  const [isOnline, setIsOnline] = useState<boolean>(user?.isOnline ?? true)
  const [isLoadingStats, setIsLoadingStats] = useState(true)
  const [isLoadingActivity, setIsLoadingActivity] = useState(true)
  const [isLoadingNearby, setIsLoadingNearby] = useState(false)
  const [sharedContact, setSharedContact] = useState<SharedContactInfo | null>(null)
  const seenNearbyIdsRef = useRef<Set<string>>(new Set())

  const loadStats = async () => {
    setIsLoadingStats(true)
    try {
      const data = await volunteerService.getStats()
      setStats(data)
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Could not load volunteer stats.')
      setStats(null)
    } finally {
      setIsLoadingStats(false)
    }
  }

  const loadActivity = async () => {
    setIsLoadingActivity(true)
    try {
      const data = await volunteerService.getActivity()
      setActivity(data)
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Could not load volunteer history.')
      setActivity([])
    } finally {
      setIsLoadingActivity(false)
    }
  }

  const loadNearby = async () => {
    if (!location || !isOnline) {
      setNearbyRequests([])
      return
    }
    setIsLoadingNearby(true)
    try {
      const data = await emergencyService.getNearby(location.latitude, location.longitude, 5)
      const previousIds = seenNearbyIdsRef.current
      const newCount = data.filter((item) => !previousIds.has(item.id)).length
      if (previousIds.size > 0 && newCount > 0) {
        toast.info(`${newCount} new emergency request(s) found within 5 km.`)
      }
      seenNearbyIdsRef.current = new Set(data.map((item) => item.id))
      setNearbyRequests(data)
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Could not load nearby emergencies.')
      setNearbyRequests([])
    } finally {
      setIsLoadingNearby(false)
    }
  }

  useEffect(() => {
    loadStats()
    loadActivity()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    loadNearby()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location, isOnline])

  useEffect(() => {
    const timer = setInterval(() => {
      loadNearby()
    }, 8000)
    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location, isOnline])

  const toggleOnline = async () => {
    const next = !isOnline
    setIsOnline(next)
    try {
      await volunteerService.setOnline(next)
      toast.success(next ? 'You are now online.' : 'You are now offline.')
    } catch (err: any) {
      setIsOnline(!next)
      toast.error(err?.response?.data?.message ?? 'Could not update online status.')
    }
  }

  const openGoogleMaps = (emergency: Emergency) => {
    const params = new URLSearchParams({
      api: '1',
      destination: `${emergency.location.latitude},${emergency.location.longitude}`,
      travelmode: 'driving',
    })
    if (location) {
      params.set('origin', `${location.latitude},${location.longitude}`)
    }
    const url = `https://www.google.com/maps/dir/?${params.toString()}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const handleRespond = async (emergency: Emergency) => {
    try {
      const response = await emergencyService.respond(emergency.id)
      const requesterPhone = response?.requesterPhone ?? emergency.requesterPhone ?? emergency.userPhone
      const volunteerPhone = response?.volunteerPhone ?? user?.phone
      setSharedContact({ requesterPhone, volunteerPhone })
      openGoogleMaps(emergency)
      toast.success('Request accepted. Opening Google Maps.')
      setNearbyRequests((prev) => prev.filter((item) => item.id !== emergency.id))
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Could not accept this request.')
    }
  }

  const refreshAll = async () => {
    await Promise.all([loadStats(), loadActivity(), loadNearby(), refreshLocation()])
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-green-600" />
            Volunteer Operations
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={refreshAll}>
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleOnline}
              className={isOnline ? 'text-green-700 border-green-300' : 'text-gray-600'}
            >
              {isOnline ? 'Online' : 'Offline'}
            </Button>
          </div>
        </div>
        <div className="text-xs text-gray-500">
          {locationLoading ? 'Fetching location...' : location ? `Current location: ${location.address}` : 'Location not available'}
        </div>
        {locationError && (
          <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2 py-1">
            {locationError}
          </div>
        )}
      </CardHeader>

      <CardContent>
        {sharedContact && (
          <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-900">
            <p className="font-medium mb-1">Contact numbers shared</p>
            <div className="flex flex-col sm:flex-row gap-2">
              {sharedContact.requesterPhone ? (
                <a href={`tel:${sharedContact.requesterPhone}`} className="inline-flex items-center gap-1 text-blue-800 underline">
                  <Phone className="h-3.5 w-3.5" />
                  Requester: {sharedContact.requesterPhone}
                </a>
              ) : (
                <span className="text-blue-700">Requester number unavailable in response.</span>
              )}
              {sharedContact.volunteerPhone && (
                <span className="text-blue-800">Your number: {sharedContact.volunteerPhone}</span>
              )}
            </div>
          </div>
        )}

        <Tabs defaultValue="nearby">
          <TabsList className="w-full grid grid-cols-3 mb-4">
            <TabsTrigger value="nearby">Nearby Emergencies</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="stats">Stats</TabsTrigger>
          </TabsList>

          <TabsContent value="nearby" className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <a href="tel:102">
                <Button size="sm" variant="danger">
                  <Phone className="h-4 w-4" />
                  Call Ambulance (102)
                </Button>
              </a>
              <a href="tel:112">
                <Button size="sm" variant="outline" className="border-red-300 text-red-700 hover:bg-red-50">
                  <Phone className="h-4 w-4" />
                  Call Emergency (112)
                </Button>
              </a>
            </div>

            {isLoadingNearby ? (
              <div className="text-sm text-gray-500">Loading nearby emergencies...</div>
            ) : nearbyRequests.length === 0 ? (
              <div className="text-sm text-gray-500 border border-dashed border-gray-300 rounded-lg p-4">
                No nearby emergencies right now.
              </div>
            ) : (
              nearbyRequests.map((req) => (
                <div key={req.id} className="p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${getSeverityColor(req.severity)}`}>
                          {getEmergencyLabel(req.type)}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(req.status)}`}>
                          {req.status.replace('_', ' ').toLowerCase()}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-900">{req.userName}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{req.location.address}</p>
                      <p className="text-xs text-gray-500 mt-1">{req.description}</p>
                    </div>
                    <Button size="sm" onClick={() => handleRespond(req)}>
                      <CheckCircle2 className="h-4 w-4" />
                      Yes, I volunteer
                    </Button>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400 mt-2">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {req.distanceKm?.toFixed(1) ?? '-'} km
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatRelativeTime(req.createdAt)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-2">
            {isLoadingActivity ? (
              <div className="text-sm text-gray-500">Loading volunteer history...</div>
            ) : activity.length === 0 ? (
              <div className="text-sm text-gray-500 border border-dashed border-gray-300 rounded-lg p-4">
                No activity history available.
              </div>
            ) : (
              activity.map((item) => (
                <div key={item.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(item.status)}`}>
                      {item.status.toLowerCase()}
                    </span>
                    <span className="text-xs text-gray-500">{formatRelativeTime(item.createdAt)}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900">{item.type}</p>
                  <p className="text-xs text-gray-600">{item.location}</p>
                  {item.description && <p className="text-xs text-gray-500 mt-1">{item.description}</p>}
                  {item.rating > 0 && <p className="text-xs text-green-700 mt-1">Thank points received: {item.rating}/5</p>}
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="stats" className="space-y-4">
            {isLoadingStats ? (
              <div className="text-sm text-gray-500">Loading stats...</div>
            ) : !stats ? (
              <div className="text-sm text-gray-500 border border-dashed border-gray-300 rounded-lg p-4">
                No stats available.
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="rounded-lg bg-blue-50 p-3 text-center">
                    <div className="text-xl font-semibold text-blue-700">{stats.totalHelped}</div>
                    <div className="text-xs text-blue-900">People Helped</div>
                  </div>
                  <div className="rounded-lg bg-green-50 p-3 text-center">
                    <div className="text-xl font-semibold text-green-700">{stats.responseTime}</div>
                    <div className="text-xs text-green-900">Avg Response</div>
                  </div>
                  <div className="rounded-lg bg-yellow-50 p-3 text-center">
                    <div className="text-xl font-semibold text-yellow-700">{stats.rating}</div>
                    <div className="text-xs text-yellow-900">Avg Thank Points (5)</div>
                  </div>
                  <div className="rounded-lg bg-purple-50 p-3 text-center">
                    <div className="text-xl font-semibold text-purple-700">{stats.completionRate}%</div>
                    <div className="text-xs text-purple-900">Completion</div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-700">Progress to {stats.nextBadge}</span>
                    <span className="inline-flex items-center gap-1 text-gray-600">
                      <Award className="h-4 w-4" />
                      {stats.currentBadge}
                    </span>
                  </div>
                  <Progress value={stats.badgeProgress} />
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
