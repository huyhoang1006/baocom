const API_BASE = '/api'

export type Stats = {
  totalEmployees: number
  eating: number
  notEating: number
  registered: number
  notRegistered: number
  registrationRate: number
}

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

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))

    if (res.status === 401 || res.status === 403) {
      const message = (data as { error?: string })?.error || 'Unauthorized'

      if (endpoint !== '/auth/login' && window.location.pathname !== '/login') {
        window.location.href = '/login'
      }

      throw new APIError(message, res.status, data)
    }

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
    apiFetch<{ dailyMenu: unknown }>(`/daily-menus/${date}`),
  updateByDate: (date: string, mealIds: string[]) =>
    apiFetch(`/daily-menus/${date}`, {
      method: 'PUT',
      body: JSON.stringify({ mealIds }),
    }),
  create: (date: string, mealIds: string[]) =>
    apiFetch('/daily-menus', {
      method: 'POST',
      body: JSON.stringify({ date, mealIds }),
    }),
  batch: (menus: { date: string; mealIds: string[] }[]) =>
    apiFetch('/daily-menus/batch', {
      method: 'POST',
      body: JSON.stringify({ menus }),
    }),
}

// Users API (Admin)
export const usersApi = {
  getAll: () => apiFetch<{ users: Array<{
    id: string;
    username: string;
    name: string;
    role: string;
    isActive: boolean;
    createdAt: string;
    departmentId: string | null;
  }> }>('/users'),

  getOne: (id: string) => apiFetch<{ user: {
    id: string;
    username: string;
    name: string;
    role: string;
    isActive: boolean;
    createdAt: string;
    departmentId: string | null;
  } }>(`/users/${id}`),

  create: (data: { name: string; departmentId?: string }) =>
    apiFetch<{
      user: { id: string; username: string; name: string; role: string; departmentId: string | null };
      credentials: { username: string; password: string }
    }>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: { name?: string; password?: string; departmentId?: string | null }) =>
    apiFetch<{ user: { id: string; username: string; name: string; role: string; departmentId: string | null } }>(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiFetch<{ success: boolean }>(`/users/${id}`, { method: 'DELETE' }),
}

// Admin Stats API
export const adminStatsApi = {
  getToday: () => apiFetch<{ stats: Stats; dateKey: string; absences: Array<{ name: string; username: string }> }>('/admin/stats'),
  getByDate: (date: string) => apiFetch<{ stats: Stats; dateKey: string; absences: Array<{ name: string; username: string }> }>(`/admin/stats/date/${date}`),
}

// Admin Reports API
export const adminReportsApi = {
  getReport: (startDate: string, endDate: string) => {
    const params = new URLSearchParams({ startDate, endDate })
    return apiFetch<{
      rows: Array<{ stt: number; name: string; username: string; department: string; eating: number; notEating: number }>
      totals: { eating: number; notEating: number }
      workdays: number
      holidays: Array<{ dateKey: string; description: string }>
      stats: { totalEmployees: number; eating: number; notEating: number }
    }>(`/admin/reports?${params}`)
  },
  exportXlsxUrl: (startDate: string, endDate: string) => {
    const params = new URLSearchParams({ startDate, endDate })
    return `/api/admin/reports/export-xlsx?${params}`
  },
}

// Admin Settings API
export const adminSettingsApi = {
  getCutoff: () => apiFetch<{ cutoffHour: number; cutoffMinute: number }>('/admin/settings/cutoff'),
  updateCutoff: (hour: number, minute: number) =>
    apiFetch<{ success: boolean; cutoffHour: number; cutoffMinute: number }>('/admin/settings/cutoff', {
      method: 'PUT',
      body: JSON.stringify({ cutoffHour: hour, cutoffMinute: minute }),
    }),
}

// Holidays API
export const holidaysApi = {
  getAll: () => apiFetch<{ holidays: Array<{ id: string; date: string; description?: string; isActive: boolean }> }>('/holidays'),
  create: (data: { date: string; description?: string }) =>
    apiFetch<{ holiday: { id: string; date: string; description?: string } }>('/holidays', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: { date?: string; description?: string; isActive?: boolean }) =>
    apiFetch<{ holiday: { id: string; date: string; description?: string } }>(`/holidays/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    apiFetch<{ success: boolean }>(`/holidays/${id}`, { method: 'DELETE' }),
}

// Meals API
export const mealsApi = {
  findOrCreate: (name: string, type: string) =>
    apiFetch<{ meal: { id: string; name: string; type: string } }>('/meals/find-or-create', {
      method: 'POST',
      body: JSON.stringify({ name, type }),
    }),
  update: (id: string, data: { name?: string; type?: string }) =>
    apiFetch<{ meal: { id: string; name: string; type: string } }>(`/meals/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteFromDate: (date: string, mealId: string) =>
    apiFetch<{ success: boolean }>(`/daily-menus/${date}/meals/${mealId}`, {
      method: 'DELETE',
    }),
}

// Departments API
export const departmentsApi = {
  getAll: () => apiFetch<{ departments: Array<{ id: string; name: string; description?: string; isActive: boolean; createdAt: string }> }>('/departments'),
  create: (data: { name: string; description?: string }) =>
    apiFetch<{ department: { id: string; name: string; description?: string } }>('/departments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: { name?: string; description?: string }) =>
    apiFetch<{ department: { id: string; name: string; description?: string } }>(`/departments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    apiFetch<{ success: boolean }>(`/departments/${id}`, { method: 'DELETE' }),
}
