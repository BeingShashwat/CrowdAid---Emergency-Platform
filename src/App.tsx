import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { Toaster } from 'sonner'
import { AuthProvider, useAuth } from '@/hooks/useAuth'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { FloatingCallButton } from '@/components/layout/FloatingCallButton'

import LandingPage from '@/pages/Landing'
import EmergencyAccessPage from '@/pages/EmergencyAccess'
import UserDashboardPage from '@/pages/UserDashboard'
import VolunteerDashboardPage from '@/pages/VolunteerDashboardPage'
import AdminDashboardPage from '@/pages/AdminDashboard'
import ProfilePage from '@/pages/Profile'
import LoginPage from '@/pages/Login'
import SignupPage from '@/pages/Signup'
import { AboutPage, HowItWorksPage, ContactPage, SupportPage } from '@/pages/InfoPages'

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  )
}

function ProtectedRoute({ children, redirectTo }: { children: ReactNode; redirectTo?: string }) {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) return <LoadingScreen />
  return isAuthenticated ? <>{children}</> : <Navigate to={redirectTo ?? '/login'} replace />
}

function AdminRoute({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth()
  if (isLoading) return <LoadingScreen />
  return user?.role === 'ADMIN' ? <>{children}</> : <Navigate to="/dashboard" replace />
}

function UserOrVolunteerDashboard() {
  const { user, isLoading } = useAuth()
  if (isLoading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  const isVolunteer = user.role === 'VOLUNTEER' || user.isVolunteer
  if (user.role === 'ADMIN') return <Navigate to="/admin" replace />
  return isVolunteer ? <VolunteerDashboardPage /> : <UserDashboardPage />
}

function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <Navbar />
      {children}
      <Footer />
      <FloatingCallButton />
    </>
  )
}

function AuthLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Layout><LandingPage /></Layout>} />
      <Route path="/emergency" element={<Layout><EmergencyAccessPage /></Layout>} />

      <Route path="/about" element={<Layout><AboutPage /></Layout>} />
      <Route path="/how-it-works" element={<Layout><HowItWorksPage /></Layout>} />
      <Route path="/contact" element={<Layout><ContactPage /></Layout>} />
      <Route path="/support" element={<Layout><SupportPage /></Layout>} />

      <Route path="/login" element={<AuthLayout><LoginPage /></AuthLayout>} />
      <Route path="/admin/login" element={<AuthLayout><LoginPage adminOnly /></AuthLayout>} />
      <Route path="/signup" element={<AuthLayout><SignupPage /></AuthLayout>} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout>
              <UserOrVolunteerDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Layout>
              <ProfilePage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute redirectTo="/admin/login">
            <AdminRoute>
              <Layout>
                <AdminDashboardPage />
              </Layout>
            </AdminRoute>
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster
          position="top-right"
          richColors
          toastOptions={{
            classNames: {
              toast: 'shadow-medium',
            },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  )
}
