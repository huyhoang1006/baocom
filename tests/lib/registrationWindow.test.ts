import { describe, expect, it } from 'vitest'
import {
  getCurrentWeekFutureWeekdays,
  getCurrentWeekWeekdays,
  getCutoffAt,
  getRegistrationDayState,
  isAllowedRegistrationDate,
} from '@/lib/registrationWindow'

describe('registrationWindow', () => {
  it('returns Tuesday through Friday for Monday before cutoff', () => {
    const now = new Date('2026-05-11T10:00:00+07:00')

    const days = getCurrentWeekFutureWeekdays(now)

    expect(days.map((day) => day.dateKey)).toEqual([
      '2026-05-12',
      '2026-05-13',
      '2026-05-14',
      '2026-05-15',
    ])
  })

  it('excludes today and weekend days', () => {
    const now = new Date('2026-05-15T10:00:00+07:00')

    const days = getCurrentWeekFutureWeekdays(now)

    expect(days).toEqual([])
  })

  it('calculates cutoff as 23:00 on previous day', () => {
    const targetDate = new Date('2026-05-12T00:00:00+07:00')

    expect(getCutoffAt(targetDate).toISOString()).toBe(new Date('2026-05-11T23:00:00+07:00').toISOString())
  })

  it('locks Tuesday at Monday 23:00 but keeps Wednesday through Friday open', () => {
    const now = new Date('2026-05-11T23:00:00+07:00')

    const states = getCurrentWeekFutureWeekdays(now).map((day) => getRegistrationDayState(day.date, now))

    expect(states.map((state) => ({ dateKey: state.dateKey, locked: state.locked }))).toEqual([
      { dateKey: '2026-05-12', locked: true },
      { dateKey: '2026-05-13', locked: false },
      { dateKey: '2026-05-14', locked: false },
      { dateKey: '2026-05-15', locked: false },
    ])
  })

  it('locks Wednesday at Tuesday 23:00 but keeps Thursday and Friday open', () => {
    const now = new Date('2026-05-12T23:00:00+07:00')

    const states = getCurrentWeekFutureWeekdays(now).map((day) => getRegistrationDayState(day.date, now))

    expect(states.map((state) => ({ dateKey: state.dateKey, locked: state.locked }))).toEqual([
      { dateKey: '2026-05-13', locked: true },
      { dateKey: '2026-05-14', locked: false },
      { dateKey: '2026-05-15', locked: false },
    ])
  })

  it('rejects today, weekend, past date, and next week date', () => {
    const now = new Date('2026-05-11T10:00:00+07:00')

    expect(isAllowedRegistrationDate(new Date('2026-05-11T00:00:00+07:00'), now)).toEqual({ ok: false, reason: 'DATE_NOT_FUTURE' })
    expect(isAllowedRegistrationDate(new Date('2026-05-10T00:00:00+07:00'), now)).toEqual({ ok: false, reason: 'DATE_NOT_FUTURE' })
    expect(isAllowedRegistrationDate(new Date('2026-05-16T00:00:00+07:00'), now)).toEqual({ ok: false, reason: 'WEEKEND' })
    expect(isAllowedRegistrationDate(new Date('2026-05-18T00:00:00+07:00'), now)).toEqual({ ok: false, reason: 'OUTSIDE_CURRENT_WEEK' })
  })

  it('returns Monday through Friday for the current week when today is Monday', () => {
    const now = new Date('2026-05-11T10:00:00+07:00')

    const days = getCurrentWeekWeekdays(now)

    expect(days.map((day) => day.dateKey)).toEqual([
      '2026-05-11',
      '2026-05-12',
      '2026-05-13',
      '2026-05-14',
      '2026-05-15',
    ])
  })

  it('returns Monday through Friday for the current week when today is Friday', () => {
    const now = new Date('2026-05-15T10:00:00+07:00')

    const days = getCurrentWeekWeekdays(now)

    expect(days.map((day) => day.dateKey)).toEqual([
      '2026-05-11',
      '2026-05-12',
      '2026-05-13',
      '2026-05-14',
      '2026-05-15',
    ])
  })

  it('returns Monday through Friday for the same current week when today is Saturday', () => {
    const now = new Date('2026-05-16T10:00:00+07:00')

    const days = getCurrentWeekWeekdays(now)
    expect(days.map((day) => day.dateKey)).toEqual([
      '2026-05-11',
      '2026-05-12',
      '2026-05-13',
      '2026-05-14',
      '2026-05-15',
    ])
  })

  it('returns Monday through Friday for the same current week when today is Sunday', () => {
    const now = new Date('2026-05-17T10:00:00+07:00')

    const days = getCurrentWeekWeekdays(now)
    expect(days.map((day) => day.dateKey)).toEqual([
      '2026-05-11',
      '2026-05-12',
      '2026-05-13',
      '2026-05-14',
      '2026-05-15',
    ])
  })
})
