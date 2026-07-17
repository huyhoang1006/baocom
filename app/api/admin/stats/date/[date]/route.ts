import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/authMiddleware'
import { AdminStatsController } from '@/controllers/AdminStatsController'

const controller = new AdminStatsController()

export const GET = withAdmin(async (req: NextRequest, userId: string, role: string, context: { params: Promise<{ date: string }> }) => {
  const { date } = await context.params
  const parsedDate = new Date(date)
  if (isNaN(parsedDate.getTime())) {
    return NextResponse.json({ error: 'Invalid date' }, { status: 400 })
  }
  // KHÔNG materialize bản ghi mặc định nữa: thống kê dùng trạng thái hiệu lực
  // (carry-forward) tính trực tiếp. Materialize sẽ ghi đè trạng thái "không ăn"
  // đã carry-forward bằng bản ghi "có ăn" mới → sai nghiệp vụ.
  return controller.getStatsForDate(parsedDate)
})
