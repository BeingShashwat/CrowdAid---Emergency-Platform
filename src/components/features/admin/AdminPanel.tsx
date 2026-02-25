import { useEffect, useState } from 'react'
import { Settings, AlertTriangle, Users, Clock, RefreshCw, Download, Search, MapPin } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, Input } from '@/components/ui/primitives'
import { Button } from '@/components/ui/button'
import { adminService, emergencyService } from '@/services/api'
import { getSeverityColor, getStatusColor, formatRelativeTime } from '@/lib/utils'
import type { SystemStats, Emergency } from '@/types'
import { toast } from 'sonner'

export function AdminPanel() {
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [emergencies, setEmergencies] = useState<Emergency[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [statsData, emergencyData] = await Promise.all([
        adminService.getSystemStats(),
        emergencyService.getAll(0, 50, statusFilter === 'all' ? undefined : statusFilter.toUpperCase()),
      ])
      setStats(statsData)
      setEmergencies(emergencyData.content)
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Could not load admin panel data.')
      setStats(null)
      setEmergencies([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter])

  const filteredEmergencies = emergencies.filter((item) => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return (
      item.userName.toLowerCase().includes(q) ||
      item.type.toLowerCase().includes(q) ||
      item.location.address.toLowerCase().includes(q)
    )
  })

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const blob = await emergencyService.exportCsv()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `crowdaid-emergencies-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('CSV export downloaded.')
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Could not export CSV.')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-blue-700" />
            Admin Operations
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={loadData}>
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport} disabled={isExporting}>
              <Download className="h-4 w-4" />
              {isExporting ? 'Exporting...' : 'Export CSV'}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="text-sm text-gray-500">Loading admin data...</div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertTriangle className="h-4 w-4" />
                  Active Emergencies
                </div>
                <p className="mt-2 text-2xl font-bold text-red-800">{stats?.activeEmergencies ?? '-'}</p>
              </div>
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <div className="flex items-center gap-2 text-blue-700">
                  <Users className="h-4 w-4" />
                  Online Volunteers
                </div>
                <p className="mt-2 text-2xl font-bold text-blue-800">{stats?.onlineVolunteers ?? '-'}</p>
              </div>
              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <div className="flex items-center gap-2 text-green-700">
                  <Clock className="h-4 w-4" />
                  Avg Response Time
                </div>
                <p className="mt-2 text-2xl font-bold text-green-800">{stats?.avgResponseTime ?? '-'}</p>
              </div>
              <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
                <div className="flex items-center gap-2 text-purple-700">
                  <Users className="h-4 w-4" />
                  Total Users
                </div>
                <p className="mt-2 text-2xl font-bold text-purple-800">{stats?.totalUsers ?? '-'}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <div className="relative flex-1 min-w-56">
                <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  className="pl-9"
                  placeholder="Search by user, type, location..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-sm border border-input rounded-md bg-background"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="space-y-3">
              {filteredEmergencies.length === 0 ? (
                <div className="text-sm text-gray-500 border border-dashed border-gray-300 rounded-lg p-4">
                  No emergency records available for current filters.
                </div>
              ) : (
                filteredEmergencies.map((item) => (
                  <div key={item.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          <span className="font-mono text-xs text-gray-500">{item.id}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(item.status)}`}>
                            {item.status.replace('_', ' ').toLowerCase()}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${getSeverityColor(item.severity)}`}>
                            {item.severity.toLowerCase()}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-gray-900">{item.userName} - {item.type.replace('_', ' ')}</p>
                        <p className="text-xs text-gray-600 mt-1">{item.description}</p>
                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {item.location.address}
                        </p>
                      </div>
                      <div className="text-right text-xs text-gray-500 shrink-0">
                        <p>{formatRelativeTime(item.createdAt)}</p>
                        <p className="mt-1">{item.volunteers} volunteer(s)</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
