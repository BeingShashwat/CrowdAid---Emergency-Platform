import axios from 'axios'
import type {
  AuthResponse, LoginRequest, RegisterRequest,
  Emergency, SOSRequest, SystemStats, VolunteerStats,
  VolunteerActivity, User, ApiResponse, PagedResponse, Location, UserSession,
  RequestSignupOtpRequest, VerifySignupOtpRequest, RespondEmergencyResult,
} from '@/types'

// ─── Axios instance ──────────────────────────────────────────────────────────

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL?.trim() || '/api').replace(/\/+$/, '')

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
})

const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
})

const ACCESS_TOKEN_KEY = 'crowdaid_token'
const REFRESH_TOKEN_KEY = 'crowdaid_refresh_token'
const USER_CACHE_KEY = 'crowdaid_user'

let refreshPromise: Promise<string | null> | null = null

function setStoredAuth(response: AuthResponse) {
  localStorage.setItem(ACCESS_TOKEN_KEY, response.token)
  if (response.refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken)
  }
  localStorage.setItem(USER_CACHE_KEY, JSON.stringify(response.user))
}

function clearStoredAuth() {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(USER_CACHE_KEY)
}

function createIdempotencyKey() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function unwrapApiData<T>(payload: unknown): T {
  if (
    payload &&
    typeof payload === 'object' &&
    'data' in payload &&
    ('success' in payload || 'message' in payload)
  ) {
    return (payload as ApiResponse<T>).data
  }
  return payload as T
}

// Attach JWT on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY)
  if (token) config.headers.Authorization = `Bearer ${token}`

  const method = (config.method || 'get').toLowerCase()
  const url = config.url || ''
  const isSos = method === 'post' && url.includes('/emergencies/sos')
  const isRespond = method === 'post' && /\/emergencies\/[^/]+\/respond$/.test(url)
  if ((isSos || isRespond) && !config.headers['Idempotency-Key']) {
    config.headers['Idempotency-Key'] = createIdempotencyKey()
  }

  return config
})

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)
  if (!refreshToken) return null

  if (!refreshPromise) {
    refreshPromise = refreshClient
      .post<AuthResponse | ApiResponse<AuthResponse>>('/auth/refresh', { refreshToken })
      .then((res) => {
        const payload = unwrapApiData<AuthResponse>(res.data)
        setStoredAuth(payload)
        return payload.token
      })
      .catch(() => {
        clearStoredAuth()
        return null
      })
      .finally(() => {
        refreshPromise = null
      })
  }

  return refreshPromise
}

// Refresh on 401, then retry once.
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config as (typeof err.config & { _retry?: boolean }) | undefined
    const requestUrl = originalRequest?.url || ''
    const canAttemptRefresh = !requestUrl.includes('/auth/login')
      && !requestUrl.includes('/auth/register')
      && !requestUrl.includes('/auth/refresh')

    if (
      err.response?.status === 401
      && originalRequest
      && !originalRequest._retry
      && canAttemptRefresh
      && localStorage.getItem(ACCESS_TOKEN_KEY)
    ) {
      originalRequest._retry = true
      const token = await refreshAccessToken()
      if (token) {
        originalRequest.headers = originalRequest.headers || {}
        originalRequest.headers.Authorization = `Bearer ${token}`
        return api.request(originalRequest)
      }
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

// ─── Auth ────────────────────────────────────────────────────────────────────

export const authService = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse | ApiResponse<AuthResponse>>('/auth/login', data)
    const payload = unwrapApiData<AuthResponse>(res.data)
    setStoredAuth(payload)
    return payload
  },

  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse | ApiResponse<AuthResponse>>('/auth/register', data)
    const payload = unwrapApiData<AuthResponse>(res.data)
    setStoredAuth(payload)
    return payload
  },

  refresh: async (refreshToken: string): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse | ApiResponse<AuthResponse>>('/auth/refresh', { refreshToken })
    const payload = unwrapApiData<AuthResponse>(res.data)
    setStoredAuth(payload)
    return payload
  },

  requestSignupOtp: async (data: RequestSignupOtpRequest): Promise<void> => {
    await api.post('/auth/register/request-otp', data)
  },

  verifySignupOtp: async (data: VerifySignupOtpRequest): Promise<void> => {
    await api.post('/auth/register/verify-otp', data)
  },

  logout: async (): Promise<void> => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)
    await api.post('/auth/logout', { refreshToken })
    clearStoredAuth()
  },

  logoutAll: async (): Promise<void> => {
    await api.post('/auth/logout-all')
    clearStoredAuth()
  },

  getMe: async (): Promise<User> => {
    const res = await api.get<ApiResponse<User> | User>('/auth/me')
    return unwrapApiData<User>(res.data)
  },

  getSessions: async (): Promise<UserSession[]> => {
    const res = await api.get<ApiResponse<UserSession[]> | UserSession[]>('/auth/sessions')
    return unwrapApiData<UserSession[]>(res.data)
  },

  deleteAccount: async (password: string): Promise<void> => {
    await api.delete('/auth/me', { data: { password } })
    clearStoredAuth()
  },
}

// ─── Emergency ───────────────────────────────────────────────────────────────

export const emergencyService = {
  sendSOS: async (data: SOSRequest): Promise<Emergency> => {
    const res = await api.post<ApiResponse<Emergency> | Emergency>('/emergencies/sos', data, {
      headers: { 'Idempotency-Key': createIdempotencyKey() },
    })
    return unwrapApiData<Emergency>(res.data)
  },

  getNearby: async (lat: number, lng: number, radiusKm = 5): Promise<Emergency[]> => {
    const res = await api.get<ApiResponse<Emergency[]> | Emergency[]>('/emergencies/nearby', {
      params: { lat, lng, radiusKm },
    })
    return unwrapApiData<Emergency[]>(res.data)
  },

  getAll: async (page = 0, size = 20, status?: string): Promise<PagedResponse<Emergency>> => {
    const res = await api.get<ApiResponse<PagedResponse<Emergency>> | PagedResponse<Emergency>>('/emergencies', {
      params: { page, size, status },
    })
    return unwrapApiData<PagedResponse<Emergency>>(res.data)
  },

  getMy: async (activeOnly = false): Promise<Emergency[]> => {
    const res = await api.get<ApiResponse<Emergency[]> | Emergency[]>('/emergencies/my', {
      params: { activeOnly },
    })
    return unwrapApiData<Emergency[]>(res.data)
  },

  respond: async (emergencyId: string): Promise<RespondEmergencyResult | null> => {
    const res = await api.post(`/emergencies/${emergencyId}/respond`, { confirmVolunteer: true }, {
      headers: { 'Idempotency-Key': createIdempotencyKey() },
    })
    const payload = res.data as unknown
    if (
      payload &&
      typeof payload === 'object' &&
      ('requesterPhone' in payload || 'volunteerPhone' in payload || 'emergency' in payload)
    ) {
      return payload as RespondEmergencyResult
    }
    if (
      payload &&
      typeof payload === 'object' &&
      'data' in payload &&
      (payload as { data?: unknown }).data &&
      typeof (payload as { data?: unknown }).data === 'object'
    ) {
      return (payload as { data: RespondEmergencyResult }).data
    }
    return null
  },

  resolve: async (emergencyId: string): Promise<void> => {
    await api.post(`/emergencies/${emergencyId}/resolve`)
  },

  cancel: async (emergencyId: string): Promise<void> => {
    await api.post(`/emergencies/${emergencyId}/cancel`)
  },

  thankVolunteer: async (emergencyId: string, points: number): Promise<Emergency> => {
    const res = await api.post<ApiResponse<Emergency> | Emergency>(`/emergencies/${emergencyId}/thank`, { points })
    return unwrapApiData<Emergency>(res.data)
  },

  exportCsv: async (): Promise<Blob> => {
    const res = await api.get('/emergencies/export', { responseType: 'blob' })
    return res.data
  },
}

// ─── Volunteer ───────────────────────────────────────────────────────────────

export const volunteerService = {
  getStats: async (): Promise<VolunteerStats> => {
    const res = await api.get<ApiResponse<VolunteerStats> | VolunteerStats>('/volunteers/me/stats')
    return unwrapApiData<VolunteerStats>(res.data)
  },

  getActivity: async (): Promise<VolunteerActivity[]> => {
    const res = await api.get<ApiResponse<VolunteerActivity[]> | VolunteerActivity[]>('/volunteers/me/activity')
    return unwrapApiData<VolunteerActivity[]>(res.data)
  },

  setOnline: async (isOnline: boolean): Promise<void> => {
    await api.patch('/volunteers/me/status', { isOnline })
  },

  getLeaderboard: async (): Promise<User[]> => {
    const res = await api.get<ApiResponse<User[]> | User[]>('/volunteers/leaderboard')
    return unwrapApiData<User[]>(res.data)
  },
}

// ─── Admin ───────────────────────────────────────────────────────────────────

export const adminService = {
  getSystemStats: async (): Promise<SystemStats> => {
    const res = await api.get<ApiResponse<SystemStats> | SystemStats>('/admin/stats')
    return unwrapApiData<SystemStats>(res.data)
  },
}

// ─── Google Maps / Location ───────────────────────────────────────────────────

export const locationService = {
  reverseGeocode: async (lat: number, lng: number): Promise<string> => {
    const res = await api.get<ApiResponse<{ address: string }> | { address: string }>('/location/reverse-geocode', {
      params: { lat, lng },
    })
    return unwrapApiData<{ address: string }>(res.data).address
  },

  getCurrentPosition: (): Promise<Location> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'))
        return
      }
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords
          try {
            const address = await locationService.reverseGeocode(latitude, longitude)
            resolve({ latitude, longitude, address, accuracy: pos.coords.accuracy })
          } catch {
            resolve({ latitude, longitude, address: 'Current Location', accuracy: pos.coords.accuracy })
          }
        },
        (error) => {
          reject(new Error(error.message || 'Location permission is required'))
        },
        { enableHighAccuracy: true, timeout: 8000 }
      )
    })
  },
}

export default api
