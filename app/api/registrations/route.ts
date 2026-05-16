import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/authMiddleware'
import { RegistrationsController } from '@/controllers/RegistrationsController'

const controller = new RegistrationsController()

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

function validateDateRangeParams(req: NextRequest): NextResponse | null {
  const { searchParams } = new URL(req.url)
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')

  // If one is provided, both must be provided
  if (startDate && !endDate) {
    return NextResponse.json({ error: 'Both startDate and endDate are required for date range' }, { status: 400 })
  }
  if (!startDate && endDate) {
    return NextResponse.json({ error: 'Both startDate and endDate are required for date range' }, { status: 400 })
  }

  // Validate format if either is present
  if (startDate && !DATE_REGEX.test(startDate)) {
    return NextResponse.json({ error: 'Invalid date format. Use YYYY-MM-DD' }, { status: 400 })
  }
  if (endDate && !DATE_REGEX.test(endDate)) {
    return NextResponse.json({ error: 'Invalid date format. Use YYYY-MM-DD' }, { status: 400 })
  }

  return null
}

export const GET = withAuth(async (req: NextRequest, userId: string, role: string) => {
  const validationError = validateDateRangeParams(req)
  if (validationError) return validationError
  return controller.getAll(req, userId)
})

export const POST = withAuth(async (req: NextRequest, userId: string, role: string) => {
  return controller.create(req, userId)
})