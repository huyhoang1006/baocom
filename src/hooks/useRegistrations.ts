import { useState, useEffect, useCallback } from 'react'
import { registrationsApi } from '@/lib/api'
import { toAPIStatus, toUIStatus, type UIStatus } from '@/lib/statusUtils'
import { parseLocalDate, toDateKey } from '@/lib/registrationWindow'

interface Registration {
  id: string
  date: string
  dateKey?: string
  status: string
  note?: string
}

function getRegistrationDateKey(registration: Registration): string {
  if (registration.dateKey) return registration.dateKey
  return toDateKey(parseLocalDate(registration.date.split('T')[0]))
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
      const response = await registrationsApi.create(date, apiStatus)
      const registration = response.registration as Registration | undefined

      if (registration) {
        setRegistrations((current) => {
          const next = current.filter((item) => getRegistrationDateKey(item) !== getRegistrationDateKey(registration))
          return [...next, registration]
        })
      }

      await fetchRegistrations()
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update registration')
      return false
    }
  }, [fetchRegistrations])

  const toggle = useCallback(async (date: string, currentStatus: UIStatus) => {
    const newStatus = currentStatus === 'eating' ? 'not-eating' : 'eating'
    return setStatus(date, newStatus)
  }, [setStatus])

  const getStatusForDate = useCallback((dateStr: string): UIStatus | null => {
    const reg = registrations.find(r => getRegistrationDateKey(r) === dateStr)
    return reg ? toUIStatus(reg.status as 'eating' | 'not_eating') : null
  }, [registrations])

  return {
    registrations,
    loading,
    error,
    setStatus,
    toggle,
    getStatusForDate,
    refetch: fetchRegistrations,
  }
}
