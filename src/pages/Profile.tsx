import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, Input, Label } from '@/components/ui/primitives'
import { Button } from '@/components/ui/button'
import { authService } from '@/services/api'
import { useAuth } from '@/hooks/useAuth'
import type { User, UserSession } from '@/types'
import { toast } from 'sonner'

export default function ProfilePage() {
  const navigate = useNavigate()
  const { user: cachedUser, logout } = useAuth()
  const [user, setUser] = useState<User | null>(cachedUser)
  const [sessions, setSessions] = useState<UserSession[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [password, setPassword] = useState('')
  const [confirmDelete, setConfirmDelete] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      try {
        const [me, sessionRows] = await Promise.all([
          authService.getMe(),
          authService.getSessions(),
        ])
        setUser(me)
        setSessions(sessionRows)
        localStorage.setItem('crowdaid_user', JSON.stringify(me))
      } catch (err: any) {
        toast.error(err?.response?.data?.message ?? 'Could not load profile data.')
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [])

  const handleLogoutAll = async () => {
    try {
      await authService.logoutAll()
      await logout()
      toast.success('Logged out from all devices.')
      navigate('/login')
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Could not logout all devices.')
    }
  }

  const handleDeleteAccount = async () => {
    if (confirmDelete !== 'DELETE') {
      toast.error('Type DELETE to confirm account deletion.')
      return
    }
    if (!password.trim()) {
      toast.error('Enter your password to delete account.')
      return
    }

    setIsDeleting(true)
    try {
      await authService.deleteAccount(password.trim())
      await logout()
      toast.success('Your account has been deleted.')
      navigate('/')
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Could not delete account.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-10 px-4">
      <div className="max-w-4xl mx-auto space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-gray-500">Loading profile...</p>
            ) : !user ? (
              <p className="text-sm text-gray-500">Profile data not available.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-gray-500">Name</p>
                  <p className="text-sm font-medium text-gray-900">{user.firstName} {user.lastName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="text-sm font-medium text-gray-900">{user.phone}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-sm font-medium text-gray-900">{user.email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Thank Points</p>
                  <p className="text-sm font-medium text-gray-900">{user.thankPointsTotal ?? 0}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Sessions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {sessions.length === 0 ? (
              <p className="text-sm text-gray-500">No recent sessions found.</p>
            ) : (
              sessions.map((session) => (
                <div key={session.id} className="rounded-lg border border-gray-200 p-3">
                  <p className="text-sm font-medium text-gray-900">{session.ipAddress || 'Unknown IP'}</p>
                  <p className="text-xs text-gray-500 mt-1">{session.userAgent || 'Unknown device'}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Started: {new Date(session.createdAt).toLocaleString()} | Expires: {new Date(session.expiresAt).toLocaleString()}
                  </p>
                </div>
              ))
            )}
            <Button variant="outline" onClick={handleLogoutAll}>
              Logout All Devices
            </Button>
          </CardContent>
        </Card>

        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-700">Delete Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-gray-700">
              This permanently removes your account. Active SOS or active volunteer assignments must be completed first.
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="delete-password">Password</Label>
              <Input
                id="delete-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your current password"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="delete-confirm">Type DELETE to confirm</Label>
              <Input
                id="delete-confirm"
                value={confirmDelete}
                onChange={(e) => setConfirmDelete(e.target.value)}
                placeholder="DELETE"
              />
            </div>
            <Button variant="danger" onClick={handleDeleteAccount} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete Account'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
