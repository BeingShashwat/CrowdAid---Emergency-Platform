import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Shield, Eye, EyeOff, Loader2, AlertCircle, CheckCircle, Users, Smartphone } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Input, Label, Separator } from '@/components/ui/primitives'
import { Button } from '@/components/ui/button'
import * as Checkbox from '@radix-ui/react-checkbox'
import { useAuth } from '@/hooks/useAuth'
import { authService } from '@/services/api'
import { toast } from 'sonner'

const schema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^\d{10}$/, 'Enter 10-digit mobile number'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  otp: z.string().min(4, 'Enter the OTP sent to your phone'),
  isVolunteer: z.boolean().default(false),
  agreeToTerms: z.boolean().refine((v) => v, 'You must agree to the Terms'),
  agreeToEmergencyContact: z.boolean().refine((v) => v, 'Emergency contact consent required'),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

type FormData = z.infer<typeof schema>

function normalizeIndianPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '').slice(0, 10)
  return `+91${digits}`
}

export default function SignupPage() {
  const [showPw, setShowPw] = useState(false)
  const [showCPw, setShowCPw] = useState(false)
  const [otpRequested, setOtpRequested] = useState(false)
  const [otpVerified, setOtpVerified] = useState(false)
  const [isSendingOtp, setIsSendingOtp] = useState(false)
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false)
  const { register: authRegister } = useAuth()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    watch,
    getValues,
    trigger,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      isVolunteer: false,
      agreeToTerms: false,
      agreeToEmergencyContact: false,
      otp: '',
    },
  })

  const phone = watch('phone')
  const isVolunteer = watch('isVolunteer')
  const agreeTerms = watch('agreeToTerms')
  const agreeEmerg = watch('agreeToEmergencyContact')

  useEffect(() => {
    setOtpRequested(false)
    setOtpVerified(false)
  }, [phone])

  const handleSendOtp = async () => {
    const phoneValid = await trigger('phone')
    if (!phoneValid) return
    setIsSendingOtp(true)
    try {
      await authService.requestSignupOtp({ phone: normalizeIndianPhone(getValues('phone')) })
      setOtpRequested(true)
      setOtpVerified(false)
      toast.success('OTP sent to your phone number.')
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Could not send OTP.')
    } finally {
      setIsSendingOtp(false)
    }
  }

  const handleVerifyOtp = async () => {
    const valid = await trigger(['phone', 'otp'])
    if (!valid) return
    setIsVerifyingOtp(true)
    try {
      await authService.verifySignupOtp({
        phone: normalizeIndianPhone(getValues('phone')),
        otp: getValues('otp'),
      })
      setOtpVerified(true)
      toast.success('Phone number verified successfully.')
    } catch (err: any) {
      setOtpVerified(false)
      toast.error(err?.response?.data?.message ?? 'OTP verification failed.')
    } finally {
      setIsVerifyingOtp(false)
    }
  }

  const onSubmit = async (data: FormData) => {
    if (!otpVerified) {
      toast.error('Verify OTP before creating account.')
      return
    }

    try {
      const user = await authRegister({
        ...data,
        phone: normalizeIndianPhone(data.phone),
      })
      toast.success('Account created successfully.')
      if (user.role === 'ADMIN') navigate('/admin')
      else navigate('/dashboard')
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Registration failed.')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">CrowdAid</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Create Account</h1>
          <p className="text-gray-500 mt-1">Phone OTP verification is required.</p>
        </div>

        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle>Sign Up</CardTitle>
            <CardDescription>User and volunteer registration in one flow</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" placeholder="John" {...register('firstName')} />
                  {errors.firstName && <p className="text-xs text-red-500">{errors.firstName.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" placeholder="Doe" {...register('lastName')} />
                  {errors.lastName && <p className="text-xs text-red-500">{errors.lastName.message}</p>}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" placeholder="john@example.com" {...register('email')} />
                {errors.email && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="flex gap-2">
                  <div className="flex flex-1 rounded-md border border-input bg-background">
                    <span className="inline-flex items-center px-3 text-sm text-gray-600 border-r border-input bg-gray-50 rounded-l-md">
                      +91
                    </span>
                    <Input
                      id="phone"
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      placeholder="9876543210"
                      className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-l-none"
                      {...register('phone', {
                        onChange: (e) => {
                          const digits = (e.target.value as string).replace(/\D/g, '').slice(0, 10)
                          setValue('phone', digits, { shouldValidate: true })
                        },
                      })}
                    />
                  </div>
                  <Button type="button" variant="outline" onClick={handleSendOtp} disabled={isSendingOtp}>
                    {isSendingOtp ? <Loader2 className="h-4 w-4 animate-spin" /> : <Smartphone className="h-4 w-4" />}
                    {otpRequested ? 'Resend OTP' : 'Send OTP'}
                  </Button>
                </div>
                {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
                <p className="text-xs text-gray-500">Country code +91 is automatically added.</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="otp">OTP</Label>
                <div className="flex gap-2">
                  <Input id="otp" placeholder="Enter OTP" {...register('otp')} />
                  <Button type="button" variant="outline" onClick={handleVerifyOtp} disabled={!otpRequested || isVerifyingOtp}>
                    {isVerifyingOtp ? <Loader2 className="h-4 w-4 animate-spin" /> : otpVerified ? <CheckCircle className="h-4 w-4 text-green-600" /> : 'Verify OTP'}
                  </Button>
                </div>
                {errors.otp && <p className="text-xs text-red-500">{errors.otp.message}</p>}
                {otpVerified && <p className="text-xs text-green-600">Phone number verified.</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input id="password" type={showPw ? 'text' : 'password'} placeholder="Create a password" {...register('password')} className="pr-10" />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" onClick={() => setShowPw(!showPw)} tabIndex={-1}>
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input id="confirmPassword" type={showCPw ? 'text' : 'password'} placeholder="Confirm password" {...register('confirmPassword')} className="pr-10" />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" onClick={() => setShowCPw(!showCPw)} tabIndex={-1}>
                    {showCPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>}
              </div>

              <Separator />

              <div className={`p-4 rounded-xl border-2 transition-all ${isVolunteer ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-gray-50'}`}>
                <div className="flex items-start gap-3">
                  <Checkbox.Root
                    id="isVolunteer"
                    checked={isVolunteer}
                    onCheckedChange={(v) => setValue('isVolunteer', v === true)}
                    className="w-5 h-5 mt-0.5 rounded border-2 border-blue-400 bg-white data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 flex items-center justify-center"
                  >
                    <Checkbox.Indicator>
                      <CheckCircle className="h-3.5 w-3.5 text-white" />
                    </Checkbox.Indicator>
                  </Checkbox.Root>
                  <div>
                    <Label htmlFor="isVolunteer" className="flex items-center gap-2 cursor-pointer font-semibold text-gray-800">
                      <Users className="h-4 w-4 text-blue-600" />
                      Register as Volunteer
                    </Label>
                    <p className="text-xs text-gray-500 mt-0.5">Volunteer accounts can receive and respond to nearby emergencies.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Checkbox.Root
                    id="agreeToTerms"
                    checked={agreeTerms}
                    onCheckedChange={(v) => setValue('agreeToTerms', v === true)}
                    className="w-4 h-4 mt-0.5 rounded border border-gray-300 bg-white data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 flex items-center justify-center"
                  >
                    <Checkbox.Indicator>
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 10">
                        <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </Checkbox.Indicator>
                  </Checkbox.Root>
                  <Label htmlFor="agreeToTerms" className="text-sm text-gray-600 font-normal">
                    I agree to Terms of Service and Privacy Policy.
                  </Label>
                </div>

                <div className="flex items-start gap-3">
                  <Checkbox.Root
                    id="agreeToEmergencyContact"
                    checked={agreeEmerg}
                    onCheckedChange={(v) => setValue('agreeToEmergencyContact', v === true)}
                    className="w-4 h-4 mt-0.5 rounded border border-gray-300 bg-white data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 flex items-center justify-center"
                  >
                    <Checkbox.Indicator>
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 10">
                        <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </Checkbox.Indicator>
                  </Checkbox.Root>
                  <Label htmlFor="agreeToEmergencyContact" className="text-sm text-gray-600 font-normal">
                    I consent to sharing contact number during active emergencies.
                  </Label>
                </div>

                {(errors.agreeToTerms || errors.agreeToEmergencyContact) && (
                  <p className="text-xs text-red-500">Please check all required boxes.</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting || !otpVerified || !agreeTerms || !agreeEmerg}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>
            </form>

            <p className="mt-5 text-center text-sm text-gray-500">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 hover:text-blue-500 font-medium">
                Sign in here
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
