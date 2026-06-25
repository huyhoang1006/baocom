import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth-server'
import { ZaloBotClient } from './ZaloBotClient'

export default async function ZaloBotPage() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'admin') redirect('/login')

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Zalo Bot</h1>
        <p className="text-sm text-ink-muted-48 mt-1">
          Kết nối tài khoản Zalo để gửi thông báo &quot;báo cơm&quot; vào group nội bộ.
        </p>
      </header>
      <ZaloBotClient />
    </div>
  )
}
