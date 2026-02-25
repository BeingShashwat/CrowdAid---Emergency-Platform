import { Link } from 'react-router-dom'
import { Shield, Phone, Mail, MapPin } from 'lucide-react'

const EMERGENCY_NUMBERS = [
  { label: 'Police', number: '100' },
  { label: 'Fire', number: '101' },
  { label: 'Ambulance', number: '102' },
  { label: 'Emergency', number: '112', highlight: true },
]

const QUICK_LINKS = [
  { label: 'How It Works', to: '/how-it-works' },
  { label: 'About Us', to: '/about' },
  { label: 'Contact', to: '/contact' },
  { label: 'Support', to: '/support' },
  { label: 'Privacy Policy', to: '/privacy' },
  { label: 'Terms of Service', to: '/terms' },
]

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 gradient-primary rounded-lg flex items-center justify-center">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold">CrowdAid</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Connecting communities for emergency assistance across India.
              Fast, reliable help when you need it most.
            </p>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              System Operational
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4 text-gray-100">Quick Links</h3>
            <ul className="space-y-2">
              {QUICK_LINKS.map(({ label, to }) => (
                <li key={to}>
                  <Link to={to} className="text-gray-400 hover:text-white text-sm transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Emergency Services */}
          <div>
            <h3 className="font-semibold mb-4 text-gray-100">Emergency Services</h3>
            <ul className="space-y-2">
              {EMERGENCY_NUMBERS.map(({ label, number, highlight }) => (
                <li key={number}>
                  <a
                    href={`tel:${number}`}
                    className={`flex items-center gap-2 text-sm transition-colors ${
                      highlight ? 'text-red-400 font-semibold hover:text-red-300' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <Phone className="h-3.5 w-3.5" />
                    {label}: {number}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold mb-4 text-gray-100">Contact Info</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-gray-400 text-sm">
                <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                help@crowdaid.in
              </li>
              <li className="flex items-center gap-2 text-gray-400 text-sm">
                <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                1800-CROWDAID
              </li>
              <li className="flex items-start gap-2 text-gray-400 text-sm">
                <MapPin className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                Emergency Response Center,<br />New Delhi, India
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm">© 2024 CrowdAid. All rights reserved. Made with ❤️ for India</p>
          <p className="text-gray-600 text-xs">
            Powered by React + Vite · Spring Boot · PostgreSQL · Google Maps · Twilio
          </p>
        </div>
      </div>
    </footer>
  )
}
