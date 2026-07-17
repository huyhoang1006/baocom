import { useState, useEffect, useCallback, useRef } from 'react'
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

function findRegistrationByDate(registrations: Registration[], dateStr: string): Registration | undefined {
  return registrations.find(r => getRegistrationDateKey(r) === dateStr)
}

/**
 * Carry-forward: trạng thái hiệu lực cho `dateStr` = bản ghi tường minh gần nhất
 * có ngày <= dateStr. Trạng thái báo cơm được giữ nguyên cho các ngày sau tới khi
 * người dùng báo lại. Không có bản ghi nào <= dateStr → null (mặc định có cơm).
 * dateKey dạng YYYY-MM-DD nên so sánh chuỗi là đúng thứ tự ngày.
 */
function findEffectiveRegistration(registrations: Registration[], dateStr: string): Registration | undefined {
  let best: Registration | undefined
  let bestKey = ''
  for (const r of registrations) {
    const k = getRegistrationDateKey(r)
    if (k <= dateStr && k > bestKey) {
      best = r
      bestKey = k
    }
  }
  return best
}

export function useRegistrations(startDate?: string, endDate?: string) {
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const saving = useRef(false)

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

  const getStatusForDate = useCallback((dateStr: string): UIStatus | null => {
    const reg = findEffectiveRegistration(registrations, dateStr)
    return reg ? toUIStatus(reg.status as 'eating' | 'not_eating') : null
  }, [registrations])

  const setStatus = useCallback(async (date: string, status: UIStatus) => {
    if (saving.current) return false
    if (status !== 'eating' && status !== 'not-eating') {
      setError('Invalid status')
      return false
    }

    const apiStatus = toAPIStatus(status)
    // Rollback dùng bản ghi tường minh của đúng ngày đó (không carry-forward)
    const prevReg = findRegistrationByDate(registrations, date)
    const prev = prevReg ? toUIStatus(prevReg.status as 'eating' | 'not_eating') : null

    // Optimistic update
    setRegistrations((current) => {
      const next = current.filter((item) => getRegistrationDateKey(item) !== date)
      const newReg: Registration = { id: `temp-${date}`, date, status: apiStatus }
      return [...next, newReg]
    })

    saving.current = true
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
      // Rollback optimistic update
      setRegistrations((current) => {
        const next = current.filter((item) => getRegistrationDateKey(item) !== date)
        if (prev) {
          const restored: Registration = { id: `prev-${date}`, date, status: toAPIStatus(prev) }
          return [...next, restored]
        }
        return next
      })
      setError(err instanceof Error ? err.message : 'Failed to update registration')
      return false
    } finally {
      saving.current = false
    }
  }, [fetchRegistrations, registrations])

  const toggle = useCallback(async (date: string, currentStatus: UIStatus) => {
    const newStatus = currentStatus === 'eating' ? 'not-eating' : 'eating'
    return setStatus(date, newStatus)
  }, [setStatus])

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
