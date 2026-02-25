import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Shield, Phone, Menu, X, LogOut, User, ChevronDown } from 'lucide-react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  { label: 'How It Works', to: '/how-it-works' },
  { label: 'About', to: '/about' },
  { label: 'Contact', to: '/contact' },
  { label: 'Support', to: '/support' },
]

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { user, logout, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const dashboardPath = user?.role === 'ADMIN' ? '/admin' : '/dashboard'
  const profilePath = '/profile'

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const isActive = (to: string) => location.pathname === to

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 gradient-primary rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">CrowdAid</span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map(({ label, to }) => (
              <Link
                key={to}
                to={to}
                className={cn(
                  'text-sm font-medium transition-colors',
                  isActive(to) ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'
                )}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Desktop right side */}
          <div className="hidden md:flex items-center gap-3">
            <a href="tel:112">
              <Button variant="outline" size="sm" className="text-red-600 border-red-300 hover:bg-red-50 hover:border-red-500">
                <Phone className="h-3.5 w-3.5" />
                Emergency: 112
              </Button>
            </a>
            <a href="tel:102">
              <Button variant="outline" size="sm" className="text-red-600 border-red-300 hover:bg-red-50 hover:border-red-500">
                <Phone className="h-3.5 w-3.5" />
                Ambulance: 102
              </Button>
            </a>

            {isAuthenticated && user ? (
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <button className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-blue-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">{user.firstName}</span>
                    <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
                  </button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content
                    className="min-w-[180px] bg-white rounded-lg shadow-medium border border-gray-100 p-1 z-50 animate-slide-up"
                    sideOffset={4}
                  >
                    <DropdownMenu.Label className="px-3 py-2 text-xs text-gray-500">
                      <div>{user.firstName} {user.lastName}</div>
                      <div>{user.phone}</div>
                      <div>{user.email}</div>
                      <div>Thank points: {user.thankPointsTotal ?? 0}</div>
                    </DropdownMenu.Label>
                    <DropdownMenu.Separator className="my-1 h-px bg-gray-100" />
                    <DropdownMenu.Item
                      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-50 cursor-pointer outline-none"
                      onSelect={() => navigate(profilePath)}
                    >
                      <User className="h-4 w-4" /> Profile
                    </DropdownMenu.Item>
                    <DropdownMenu.Item
                      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-50 cursor-pointer outline-none"
                      onSelect={() => navigate(dashboardPath)}
                    >
                      <User className="h-4 w-4" /> Dashboard
                    </DropdownMenu.Item>
                    <DropdownMenu.Item
                      className="flex items-center gap-2 px-3 py-2 text-sm text-red-700 rounded-md hover:bg-red-50 cursor-pointer outline-none"
                      onSelect={() => navigate(profilePath)}
                    >
                      <User className="h-4 w-4" /> Delete Account
                    </DropdownMenu.Item>
                    <DropdownMenu.Separator className="my-1 h-px bg-gray-100" />
                    <DropdownMenu.Item
                      className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 rounded-md hover:bg-red-50 cursor-pointer outline-none"
                      onSelect={handleLogout}
                    >
                      <LogOut className="h-4 w-4" /> Sign Out
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="outline" size="sm">Login</Button>
                </Link>
                <Link to="/signup">
                  <Button size="sm">Sign Up</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-md hover:bg-gray-100"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div className="md:hidden border-t border-gray-100 py-3 space-y-1">
            {NAV_LINKS.map(({ label, to }) => (
              <Link
                key={to}
                to={to}
                className="block px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-50"
                onClick={() => setMenuOpen(false)}
              >
                {label}
              </Link>
            ))}
            <div className="pt-2 border-t border-gray-100 mt-2 space-y-2 px-3">
              <a href="tel:112" className="block">
                <Button variant="outline" size="sm" className="w-full text-red-600 border-red-300">
                  <Phone className="h-3.5 w-3.5" /> Emergency: 112
                </Button>
              </a>
              <a href="tel:102" className="block">
                <Button variant="outline" size="sm" className="w-full text-red-600 border-red-300">
                  <Phone className="h-3.5 w-3.5" /> Ambulance: 102
                </Button>
              </a>
              {isAuthenticated ? (
                <div className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full" onClick={() => { navigate(dashboardPath); setMenuOpen(false) }}>
                    <User className="h-3.5 w-3.5" /> Dashboard
                  </Button>
                  <Button variant="outline" size="sm" className="w-full" onClick={() => { navigate(profilePath); setMenuOpen(false) }}>
                    <User className="h-3.5 w-3.5" /> Profile
                  </Button>
                  <Button variant="ghost" size="sm" className="w-full text-red-600" onClick={handleLogout}>
                    <LogOut className="h-3.5 w-3.5" /> Sign Out
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Link to="/login" className="flex-1" onClick={() => setMenuOpen(false)}>
                    <Button variant="outline" size="sm" className="w-full">Login</Button>
                  </Link>
                  <Link to="/signup" className="flex-1" onClick={() => setMenuOpen(false)}>
                    <Button size="sm" className="w-full">Sign Up</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
