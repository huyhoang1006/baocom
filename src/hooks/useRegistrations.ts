import { useState, useEffect, useCallback } from 'react'
import { registrationsApi } from '@/lib/api'
import { toAPIStatus, toUIStatus, type UIStatus } from '@/lib/statusUtils'

interface Registration {
  id: string
  date: string
  status: string
  note?: string
}

export function useRegistrations(startDate?: string, endDate?: string) {
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRegistrations = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await registrationsApi.getAll(startDate, endDate)
      setRegistrations(data.registrations || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load registrations')
    } finally {
      setLoading(false)
    }
  }, [startDate, endDate])

  useEffect(() => {
    fetchRegistrations()
  }, [fetchRegistrations])

  const setStatus = useCallback(async (date: string, status: UIStatus) => {
    if (status !== 'eating' && status !== 'not-eating') {
      setError('Invalid status')
      return false
    }

    const apiStatus = toAPIStatus(status)

    try {
      await registrationsApi.create(date, apiStatus)
      await fetchRegistrations()
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update registration')
      return false
    }
  }, [fetchRegistrations])

  const getStatusForDate = useCallback((dateStr: string): UIStatus | null => {
    const reg = registrations.find(r => {
      const regDate = new Date(r.date).toISOString().split('T')[0]
      return regDate === dateStr
    })
    return reg ? toUIStatus(reg.status as 'eating' | 'not_eating') : null
  }, [registrations])

  return {
    registrations,
    loading,
    error,
    setStatus,
    getStatusForDate,
    refetch: fetchRegistrations,
  }
}
