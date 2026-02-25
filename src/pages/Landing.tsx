import { Link } from 'react-router-dom'
import { Shield, UserCircle2, UserPlus, Building2, Siren, Phone } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/primitives'
import { Button } from '@/components/ui/button'

const ACTIONS = [
  {
    title: 'User Login',
    description: 'Sign in as a citizen or existing volunteer account.',
    to: '/login',
    icon: UserCircle2,
    cta: 'Login',
  },
  {
    title: 'Sign Up',
    description: 'Create account with phone OTP verification.',
    to: '/signup',
    icon: UserPlus,
    cta: 'Create Account',
  },
  {
    title: 'Admin Login',
    description: 'Restricted access for operations administrators.',
    to: '/admin/login',
    icon: Building2,
    cta: 'Admin Login',
  },
  {
    title: 'Emergency Access',
    description: 'Raise SOS without login. Location permission is required.',
    to: '/emergency',
    icon: Siren,
    cta: 'Open Emergency',
  },
]

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <section className="px-4 pt-16 pb-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100 text-blue-800 text-xs font-medium">
            <Shield className="h-3.5 w-3.5" />
            CrowdAid Emergency Platform
          </div>
          <h1 className="mt-4 text-4xl md:text-5xl font-bold text-gray-900">
            Emergency help with role-based access
          </h1>
          <p className="mt-3 text-gray-600 max-w-2xl mx-auto">
            Choose how you want to continue: user, volunteer/admin login, or direct emergency access.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <a href="tel:102">
              <Button size="lg" variant="danger" className="w-full sm:w-auto">
                <Phone className="h-4 w-4" />
                Call Ambulance (102)
              </Button>
            </a>
            <a href="tel:112">
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-red-300 text-red-700 hover:bg-red-50">
                <Siren className="h-4 w-4" />
                Call Emergency (112)
              </Button>
            </a>
          </div>
        </div>
      </section>

      <section className="px-4 pb-16">
        <div className="max-w-5xl mx-auto grid gap-4 md:grid-cols-2">
          {ACTIONS.map(({ title, description, to, icon: Icon, cta }) => (
            <Card key={title} className="border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Icon className="h-5 w-5 text-blue-600" />
                  {title}
                </CardTitle>
                <CardDescription>{description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Link to={to}>
                  <Button className="w-full">{cta}</Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </main>
  )
}
