'use client'

import type { ReactNode } from 'react'

export type StatTone = 'neutral' | 'green' | 'red' | 'blue' | 'amber'

interface StatCardProps {
  icon: string
  label: string
  value: ReactNode
  tone?: StatTone
  loading?: boolean
}

const TONE_CLASSES: Record<StatTone, string> = {
  neutral: 'border-hairline bg-white',
  green: 'border-green-200 bg-green-50',
  red: 'border-red-200 bg-red-50',
  blue: 'border-blue-200 bg-blue-50',
  amber: 'border-amber-200 bg-amber-50',
}

const VALUE_TONE: Record<StatTone, string> = {
  neutral: 'text-ink',
  green: 'text-green-700',
  red: 'text-red-700',
  blue: 'text-blue-700',
  amber: 'text-amber-700',
}

export function StatCard({ icon, label, value, tone = 'neutral', loading }: StatCardProps) {
  return (
    <div
      data-testid={`stat-card-${label.toLowerCase().replace(/\s+/g, '-')}`}
      className={`rounded-lg border p-4 ${TONE_CLASSES[tone]}`}
    >
      <div className="text-2xl mb-1" aria-hidden="true">
        {icon}
      </div>
      <div className="text-xs text-ink-muted-48">{label}</div>
      <div className={`text-2xl font-semibold mt-1 ${VALUE_TONE[tone]}`}>
        {loading ? (
          <span className="inline-block w-12 h-6 bg-hairline/40 rounded animate-pulse" />
        ) : (
          value
        )}
      </div>
    </div>
  )
}