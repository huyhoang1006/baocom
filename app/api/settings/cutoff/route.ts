import { NextResponse } from 'next/server'
import { getCutoffConfig } from '@/lib/cutoffConfig'

export const GET = async () => {
  try {
    const config = await getCutoffConfig()
    return NextResponse.json({
      cutoffHour: config.cutoffHour,
      cutoffMinute: config.cutoffMinute,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch cutoff config' }, { status: 500 })
  }
}
