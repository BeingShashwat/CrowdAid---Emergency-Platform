// ─── User & Auth ────────────────────────────────────────────────────────────

export type UserRole = 'USER' | 'VOLUNTEER' | 'ADMIN'

export interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  role: UserRole
  isVolunteer: boolean
  isVerified: boolean
  volunteerRating?: number
  thankPointsTotal?: number
  volunteerBadge?: 'BRONZE' | 'SILVER' | 'GOLD'
  totalHelped?: number
  completionRate?: number
  avgResponseTime?: string
  isOnline?: boolean
  createdAt: string
}

export interface AuthResponse {
  token: string
  refreshToken?: string
  user: User
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  firstName: string
  lastName: string
  email: string
  phone: string
  password: string
  isVolunteer: boolean
  otp: string
  agreeToTerms: boolean
  agreeToEmergencyContact: boolean
}

export interface RequestSignupOtpRequest {
  phone: string
}

export interface VerifySignupOtpRequest {
  phone: string
  otp: string
}

// ─── Location ───────────────────────────────────────────────────────────────

export interface Location {
  latitude: number
  longitude: number
  address: string
  city?: string
  accuracy?: number
}

// ─── Emergency ──────────────────────────────────────────────────────────────

export type EmergencyType =
  | 'MEDICAL'
  | 'FIRE'
  | 'VEHICLE_ACCIDENT'
  | 'PERSONAL_SAFETY'
  | 'NATURAL_DISASTER'
  | 'LOST_PERSON'
  | 'OTHER'

export type EmergencyStatus = 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'CANCELLED'
export type EmergencySeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export interface Emergency {
  id: string
  userId?: string | null
  userName: string
  userPhone?: string
  type: EmergencyType
  status: EmergencyStatus
  severity: EmergencySeverity
  description: string
  location: Location
  distanceKm?: number
  volunteers: number
  responseTimeMin?: number
  requesterPhone?: string
  volunteerPhone?: string
  thankPoints?: number
  createdAt: string
  updatedAt: string
}

export interface SOSRequest {
  type: EmergencyType
  location: Location
  description?: string
  sharePhone?: boolean
}

export interface RespondEmergencyResult {
  requesterPhone?: string
  volunteerPhone?: string
  emergency?: Emergency
}

export interface UserSession {
  id: string
  ipAddress?: string
  userAgent?: string
  createdAt: string
  expiresAt: string
  revoked: boolean
}

// ─── Volunteer ──────────────────────────────────────────────────────────────

export interface VolunteerActivity {
  id: string
  type: string
  location: string
  status: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING'
  rating: number
  description: string
  responseTime: string
  createdAt: string
}

export interface VolunteerStats {
  totalHelped: number
  rating: number
  responseTime: string
  completionRate: number
  badgeProgress: number
  currentBadge: string
  nextBadge: string
}

// ─── Admin ───────────────────────────────────────────────────────────────────

export interface SystemStats {
  activeEmergencies: number
  totalVolunteers: number
  onlineVolunteers: number
  responseRate: number
  avgResponseTime: string
  resolvedToday: number
  totalUsers: number
}

// ─── API ─────────────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T
  message: string
  success: boolean
}

export interface PagedResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  page: number
  size: number
}
