import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Shield, Eye, EyeOff, Loader2, AlertCircle, Building2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Input, Label } from '@/components/ui/primitives'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'

const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type FormData = z.infer<typeof schema>

interface LoginPageProps {
  adminOnly?: boolean
}

export default function LoginPage({ adminOnly = false }: LoginPageProps) {
  const [showPw, setShowPw] = useState(false)
  const { login, logout } = useAuth()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    try {
      const user = await login(data)
      if (adminOnly && user.role !== 'ADMIN') {
        await logout()
        toast.error('This account does not have admin access.')
        return
      }
      toast.success('Login successful.')
      if (user.role === 'ADMIN') navigate('/admin')
      else navigate('/dashboard')
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Login failed. Check your credentials.')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">CrowdAid</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            {adminOnly ? 'Admin Login' : 'Sign In'}
          </h1>
          <p className="text-gray-500 mt-1">
            {adminOnly ? 'Restricted access for admins only.' : 'Login to access SOS and dashboard.'}
          </p>
        </div>

        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {adminOnly && <Building2 className="h-4 w-4 text-blue-700" />}
              {adminOnly ? 'Admin Access' : 'Account Login'}
            </CardTitle>
            <CardDescription>Use your registered email and password.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  {...register('email')}
                  aria-invalid={!!errors.email}
                />
                {errors.email && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPw ? 'text' : 'password'}
                    placeholder="Enter your password"
                    {...register('password')}
                    className="pr-10"
                    aria-invalid={!!errors.password}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPw((prev) => !prev)}
                    tabIndex={-1}
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.password.message}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  adminOnly ? 'Login as Admin' : 'Sign In'
                )}
              </Button>
            </form>

            {!adminOnly && (
              <p className="mt-6 text-center text-sm text-gray-500">
                Don't have an account?{' '}
                <Link to="/signup" className="text-blue-600 hover:text-blue-500 font-medium">
                  Sign up here
                </Link>
              </p>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <Link to="/emergency">
            <Button variant="outline" className="text-red-600 border-red-300 hover:bg-red-50 text-sm">
              Emergency Access (No Login)
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
