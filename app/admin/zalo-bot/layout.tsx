import { ZaloBotLayoutClient } from './ZaloBotLayoutClient'

/**
 * Shared layout cho tất cả page trong /admin/zalo-bot.
 * Status polling, toasts, sticky StatusBar, nav ngang — đặt ở client wrapper.
 * Admin role đã được guard ở app/admin/layout.tsx.
 */
export default function ZaloBotLayout({ children }: { children: React.ReactNode }) {
  return <ZaloBotLayoutClient>{children}</ZaloBotLayoutClient>
}