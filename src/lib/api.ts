const API_BASE = '/api'

export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message)
    this.name = 'APIError'
  }
}

export async function apiFetch<T = unknown>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    credentials: 'include',
  })

  if (res.status === 401 || res.status === 403) {
    window.location.href = '/login'
    throw new APIError('Unauthorized', res.status)
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new APIError(
      (data as { error?: string })?.error || `Request failed: ${res.status}`,
      res.status,
      data
    )
  }

  return res.json() as Promise<T>
}

// Auth API
export const authApi = {
  me: () => apiFetch<{ user: { id: string; username: string; name: string; role: string } }>('/auth/me'),
  login: (username: string, password: string) =>
    apiFetch<{ user: { id: string; username: string; name: string; role: string } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  logout: () => apiFetch('/auth/logout', { method: 'POST' }),
}

// Registrations API
export const registrationsApi = {
  getAll: (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams()
    if (startDate) params.set('startDate', startDate)
    if (endDate) params.set('endDate', endDate)
    const query = params.toString() ? `?${params.toString()}` : ''
    return apiFetch<{ registrations: Array<{ id: string; date: string; status: string; note?: string; user?: { name: string; username: string } }> }>(`/registrations${query}`)
  },
  create: (date: string, status: 'eating' | 'not_eating') =>
    apiFetch<{ registration: unknown }>('/registrations', {
      method: 'POST',
      body: JSON.stringify({ date, status }),
    }),
}

// Daily Menus API
export const dailyMenusApi = {
  getAll: (take?: number) => {
    const params = take ? `?take=${take}` : ''
    return apiFetch<{ menus: unknown[] }>(`/daily-menus${params}`)
  },
  getByDate: (date: string) =>
    apiFetch<{ menu: unknown }>(`/daily-menus/${date}`),
}

// Users API (Admin)
export const usersApi = {
  getAll: () => apiFetch<{ users: Array<{ id: string; username: string; name: string; role: string; createdAt: string }> }>('/users'),
  create: (data: { username: string; password?: string; name: string; role?: string }) =>
    apiFetch<{ user: { id: string; username: string; name: string; role: string } }>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: { name?: string; role?: string; isActive?: boolean }) =>
    apiFetch<{ user: { id: string; username: string; name: string; role: string } }>(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    apiFetch<{ success: boolean }>(`/users/${id}`, { method: 'DELETE' }),
}

// Admin Stats API
export const adminStatsApi = {
  getToday: () => apiFetch<{ stats: { totalEmployees: number; eating: number; notEating: number; eatingToday: number; notEatingToday: number; registered: number; notRegistered: number; registrationRate: number } }>('/admin/stats'),
}

// Admin Reports API
export const adminReportsApi = {
  getReport: (startDate: string, endDate: string, includeSundays?: boolean) => {
    const params = new URLSearchParams({ startDate, endDate })
    if (includeSundays) params.set('includeSundays', 'true')
    return apiFetch<{ reportData: Array<{ stt: number; name: string; phone: string; date: string }>; stats: { total: number; byDate: Record<string, number> } }>(`/admin/reports?${params}`)
  },
}