import { ZaloBotPage } from './ZaloBotPage'

/**
 * Hub mặc định cho /admin/zalo-bot.
 * - state != CONNECTED → render SetupCard (QR / logout / error).
 * - CONNECTED → render ZaloBotPageContent với ?tab=X query string.
 *   Tab mặc định: dashboard. Click nav → router.push('?tab=X').
 *
 * Page này chỉ là thin wrapper quanh ZaloBotPage (client component)
 * để tránh lỗi `next/dynamic` ssr:false trong Server Component.
 */
export default function ZaloBotHubPage() {
  return <ZaloBotPage />
}