// ─── About Page ──────────────────────────────────────────────────────────────
import { Link } from 'react-router-dom'
import { Shield, Users, Heart, Award, MapPin, Clock, Target, Globe, Lightbulb } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/primitives'
import { Button } from '@/components/ui/button'

export function AboutPage() {
  const stats = [
    { icon: Users, label: 'Active Volunteers', value: '50,000+' },
    { icon: MapPin, label: 'Cities Covered',   value: '500+' },
    { icon: Clock, label: 'Avg Response',      value: '<2 min' },
    { icon: Heart, label: 'Lives Impacted',    value: '1M+' },
  ]
  const values = [
    { icon: Heart,  title: 'Community First', desc: 'We believe in the power of community support and collective action during emergencies.' },
    { icon: Shield, title: 'Safety & Trust',  desc: 'Every volunteer is verified and trained to ensure safe, reliable emergency response.' },
    { icon: Target, title: 'Rapid Response',  desc: 'Speed saves lives. Our technology ensures help reaches you in the shortest time possible.' },
    { icon: Globe,  title: 'Inclusive Access', desc: 'Emergency help should be available to everyone, regardless of location or background.' },
  ]
  const team = [
    { name: 'Dr. Priya Sharma', role: 'Founder & CEO',       bio: 'Emergency medicine specialist with 15+ years in disaster response.' },
    { name: 'Rajesh Kumar',     role: 'CTO',                 bio: 'Former Google engineer specializing in location-based emergency systems.' },
    { name: 'Anita Patel',      role: 'Head of Operations',  bio: 'Ex-disaster management official with expertise in volunteer coordination.' },
  ]

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-4 animate-fade-in">About CrowdAid</h1>
          <p className="text-xl text-gray-500 animate-fade-in delay-100">Empowering communities with technology-driven emergency response</p>
        </div>
      </section>

      <section className="py-12 px-4 bg-white">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Mission</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">Founded in 2020, CrowdAid was born from a simple belief: in emergencies, every second counts, and communities are strongest when they help one another. Today we're India's largest crowd-sourced emergency platform, connecting verified volunteers with people in crisis across 500+ cities.</p>
            <div className="flex items-center gap-3">
              <Lightbulb className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="font-semibold text-gray-800">Innovation for Good</p>
                <p className="text-sm text-gray-500">Using technology to save lives and strengthen communities</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {stats.map(({ icon: Icon, label, value }) => (
              <Card key={label} className="text-center p-4">
                <CardContent className="p-0 pt-4">
                  <Icon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">{value}</div>
                  <div className="text-sm text-gray-500 mt-0.5">{label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Our Values</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map(({ icon: Icon, title, desc }) => (
              <Card key={title} className="text-center hover:shadow-medium transition-shadow">
                <CardContent className="p-6">
                  <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="h-7 w-7 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Leadership Team</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {team.map(({ name, role, bio }) => (
              <Card key={name} className="text-center hover:shadow-medium transition-shadow">
                <CardContent className="p-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-white text-xl font-bold">{name[0]}</span>
                  </div>
                  <h3 className="font-semibold text-gray-900">{name}</h3>
                  <p className="text-blue-600 text-sm font-medium mt-0.5">{role}</p>
                  <p className="text-gray-500 text-sm mt-2 leading-relaxed">{bio}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4 gradient-primary text-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Join Our Mission</h2>
          <p className="text-blue-100 mb-8">Help us build a safer, more connected India</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup"><Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50"><Users className="h-5 w-5" /> Become a Volunteer</Button></Link>
            <Link to="/contact"><Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10"><Heart className="h-5 w-5" /> Partner With Us</Button></Link>
          </div>
        </div>
      </section>
    </main>
  )
}

// ─── How It Works ─────────────────────────────────────────────────────────────
import { AlertTriangle, CheckCircle, ArrowRight, Phone } from 'lucide-react'

export function HowItWorksPage() {
  const steps = [
    { icon: AlertTriangle, title: 'Report Emergency', desc: 'Quickly report via app, website, or helpline.', details: ['One-click SOS button', 'Voice-activated reporting', 'Location auto-detection', 'SMS alerts'] },
    { icon: MapPin,        title: 'Location Detection', desc: 'GPS detects your location & nearby volunteers.', details: ['GPS-based location', 'Indoor positioning', 'Manual entry', 'Landmark reporting'] },
    { icon: Users,         title: 'Volunteer Dispatch', desc: 'Verified volunteers receive instant notifications.', details: ['Real-time push via Twilio', 'Skill-based matching', 'Distance optimization', 'Multi-volunteer coord'] },
    { icon: CheckCircle,   title: 'Help Arrives', desc: 'Get connected with volunteers & emergency services.', details: ['Live tracking', 'Direct communication', 'Professional backup', 'Follow-up support'] },
  ]

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <section className="py-20 px-4 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">How CrowdAid Works</h1>
        <p className="text-xl text-gray-500">From crisis to resolution in minutes</p>
      </section>

      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-10 text-center">Emergency Response Process</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map(({ icon: Icon, title, desc, details }, i) => (
              <div key={title} className="relative">
                <Card className="h-full hover:shadow-medium transition-shadow">
                  <CardContent className="p-6 text-center">
                    <div className="absolute -top-3 -right-3 w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xs">{i + 1}</div>
                    <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Icon className="h-7 w-7 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                    <p className="text-sm text-gray-500 mb-4">{desc}</p>
                    <ul className="text-xs text-gray-400 space-y-1">
                      {details.map(d => (
                        <li key={d} className="flex items-center justify-center gap-1.5">
                          <CheckCircle className="h-3 w-3 text-green-500" />{d}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
                {i < steps.length - 1 && <ArrowRight className="hidden lg:block absolute top-1/2 -right-4 -translate-y-1/2 h-5 w-5 text-blue-300" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4 gradient-primary text-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Ready to Join?</h2>
          <p className="text-blue-100 mb-8">Be part of India's largest emergency response community</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup"><Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50"><Users className="h-5 w-5" /> Become a Volunteer</Button></Link>
            <Link to="/signup"><Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10"><Shield className="h-5 w-5" /> Get Protected</Button></Link>
          </div>
        </div>
      </section>
    </main>
  )
}

// ─── Contact Page ─────────────────────────────────────────────────────────────
import { useState } from 'react'
import { Mail, Building, MessageSquare } from 'lucide-react'
import { Input as InputComp, Textarea, Label as LabelComp } from '@/components/ui/primitives'

export function ContactPage() {
  const [form, setForm] = useState({ name:'', email:'', phone:'', subject:'', message:'', type:'general' })
  const [sent, setSent] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSent(true)
  }

  const contactCards = [
    { icon: Phone,  title: 'Emergency', items: ['24/7: 112', 'CrowdAid: 1800-CROWDAID'], color: 'text-red-600' },
    { icon: Mail,   title: 'Email',     items: ['help@crowdaid.in', 'volunteers@crowdaid.in'], color: 'text-blue-600' },
    { icon: MapPin, title: 'Office',    items: ['Connaught Place', 'New Delhi - 110001'], color: 'text-green-600' },
    { icon: Clock,  title: 'Hours',     items: ['Emergency: 24/7', 'Support: 9 AM–9 PM'], color: 'text-purple-600' },
  ]

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <section className="py-20 px-4 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">Contact CrowdAid</h1>
        <p className="text-xl text-gray-500">Get in touch with our team</p>
      </section>

      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
            {contactCards.map(({ icon: Icon, title, items, color }) => (
              <Card key={title} className="text-center hover:shadow-medium transition-shadow">
                <CardContent className="p-5">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Icon className={`h-6 w-6 ${color}`} />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                  {items.map(i => <p key={i} className="text-sm text-gray-500">{i}</p>)}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="max-w-2xl mx-auto">
            <Card className="shadow-medium">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Send a Message</h2>
                {sent ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-14 w-14 text-green-500 mx-auto mb-3" />
                    <h3 className="text-xl font-semibold text-gray-900">Message Sent!</h3>
                    <p className="text-gray-500 mt-2">We'll get back to you within 24 hours.</p>
                    <Button onClick={() => setSent(false)} variant="outline" className="mt-4">Send Another</Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div><LabelComp>Full Name</LabelComp><InputComp className="mt-1" placeholder="John Doe" value={form.name} onChange={e => setForm({...form,name:e.target.value})} required /></div>
                      <div><LabelComp>Phone</LabelComp><InputComp className="mt-1" placeholder="+91..." value={form.phone} onChange={e => setForm({...form,phone:e.target.value})} /></div>
                    </div>
                    <div><LabelComp>Email</LabelComp><InputComp className="mt-1" type="email" placeholder="you@example.com" value={form.email} onChange={e => setForm({...form,email:e.target.value})} required /></div>
                    <div><LabelComp>Subject</LabelComp><InputComp className="mt-1" placeholder="Subject" value={form.subject} onChange={e => setForm({...form,subject:e.target.value})} required /></div>
                    <div><LabelComp>Message</LabelComp><Textarea className="mt-1" rows={5} placeholder="How can we help?" value={form.message} onChange={e => setForm({...form,message:e.target.value})} required /></div>
                    <Button type="submit" className="w-full gap-2"><MessageSquare className="h-4 w-4" /> Send Message</Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </main>
  )
}

// ─── Support Page ─────────────────────────────────────────────────────────────
export function SupportPage() {
  const [search, setSearch]         = useState('')
  const [openFaq, setOpenFaq]       = useState<number | null>(null)
  const [category, setCategory]     = useState('all')

  const faqs = [
    { q: 'How do I report an emergency?', a: 'Press the red SOS button on the home page, select your emergency type, and help will be dispatched immediately. Your location is auto-detected.', cat: 'emergency' },
    { q: 'How are volunteers verified?', a: 'All volunteers undergo background checks, identity verification, and emergency response training before being approved. Re-verification happens regularly.', cat: 'volunteer' },
    { q: 'Is CrowdAid free?', a: 'Yes! CrowdAid emergency services are completely free for users. We believe emergency help should be accessible to everyone.', cat: 'general' },
    { q: 'How do I cancel a false alarm?', a: 'Cancel within 30 seconds via the app or call 1800-CROWDAID immediately to prevent unnecessary emergency response.', cat: 'emergency' },
    { q: 'How do I become a volunteer?', a: 'Sign up and check the "Register as a Volunteer" box. Complete the application, background verification, and training. The process takes 5–7 days.', cat: 'volunteer' },
    { q: 'What types of emergencies do you handle?', a: 'Medical, fire, vehicle accidents, personal safety, natural disasters, lost persons, and other crisis situations.', cat: 'emergency' },
    { q: 'How do I update my profile?', a: 'Go to Settings > Profile after login. Phone and email changes require verification for security.', cat: 'account' },
    { q: 'How do push notifications work?', a: 'We use Twilio to send SMS and push notifications to nearby volunteers when an SOS is triggered in their area.', cat: 'general' },
  ]

  const filtered = faqs.filter(f =>
    (category === 'all' || f.cat === category) &&
    (f.q.toLowerCase().includes(search.toLowerCase()) || f.a.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <section className="py-20 px-4 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">Support Center</h1>
        <p className="text-xl text-gray-500 mb-8">Find answers and get help</p>
        <div className="max-w-xl mx-auto relative">
          <AlertTriangle className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <InputComp className="pl-10 h-12 text-base shadow-soft" placeholder="Search FAQs…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </section>

      <section className="py-12 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Category filter */}
          <div className="flex gap-2 flex-wrap justify-center mb-8">
            {['all','emergency','volunteer','account','general'].map(c => (
              <Button key={c} size="sm" variant={category === c ? 'default' : 'outline'} onClick={() => setCategory(c)} className="capitalize text-xs">
                {c}
              </Button>
            ))}
          </div>

          {/* FAQ accordion */}
          <div className="space-y-3">
            {filtered.map((faq, i) => (
              <Card key={i} className="overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full p-5 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <span className="font-medium text-gray-900 pr-4">{faq.q}</span>
                  <span className="text-gray-400 text-lg shrink-0">{openFaq === i ? '−' : '+'}</span>
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 text-sm text-gray-600 border-t border-gray-100 pt-4 leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </Card>
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <MessageSquare className="h-12 w-12 mx-auto mb-3" />
                <p>No results for "{search}"</p>
              </div>
            )}
          </div>

          {/* Contact CTA */}
          <Card className="mt-8 text-center shadow-medium">
            <CardContent className="p-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Still need help?</h3>
              <p className="text-gray-500 mb-5">Our team is ready to assist you</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/contact"><Button gap-2><MessageSquare className="h-4 w-4" /> Contact Support</Button></Link>
                <a href="tel:1800-CROWDAID"><Button variant="outline" className="gap-2"><Phone className="h-4 w-4" /> Call 1800-CROWDAID</Button></a>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  )
}
