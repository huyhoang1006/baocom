import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/authMiddleware'
import { AdminReportsController } from '@/controllers/AdminReportsController'

const controller = new AdminReportsController()

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

function validateDateRangeParams(req: NextRequest): NextResponse | null {
  const { searchParams } = new URL(req.url)
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')

  if (startDate && !endDate) {
    return NextResponse.json({ error: 'Both startDate and endDate are required for date range' }, { status: 400 })
  }
  if (!startDate && endDate) {
    return NextResponse.json({ error: 'Both startDate and endDate are required for date range' }, { status: 400 })
  }

  if (startDate && !DATE_REGEX.test(startDate)) {
    return NextResponse.json({ error: 'Invalid date format. Use YYYY-MM-DD' }, { status: 400 })
  }
  if (endDate && !DATE_REGEX.test(endDate)) {
    return NextResponse.json({ error: 'Invalid date format. Use YYYY-MM-DD' }, { status: 400 })
  }
  if (startDate && endDate && startDate > endDate) {
    return NextResponse.json({ error: 'startDate must be before or equal to endDate' }, { status: 400 })
  }

  return null
}

export const GET = withAdmin(async (req: NextRequest) => {
  const validationError = validateDateRangeParams(req)
  if (validationError) return validationError
  return controller.getReport(req)
})