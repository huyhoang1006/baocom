import { NextResponse } from 'next/server'
import { withAdmin } from '@/lib/authMiddleware'
import { bot } from '@/lib/zalo/bot'
import { loadCredentials } from '@/lib/zalo/credentials'

export const GET = withAdmin(async () => {
  // Auto-connect: nếu bot DISCONNECTED và credentials tồn tại → thử login
  const status = bot.status()
  if (status.state === 'DISCONNECTED') {
    try {
      const creds = loadCredentials()
      if (creds) {
        await bot.ensureLoggedIn()
      }
    } catch {
      // ignore — credentials corrupt hoặc login fail → trả state hiện tại
    }
  }
  return NextResponse.json(bot.status())
})
