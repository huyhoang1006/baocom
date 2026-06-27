'use client'

import { Suspense } from 'react'
import { ZaloBotContentSwitcher } from './ZaloBotContentSwitcher'

/**
 * Client wrapper cho ZaloBotHubPage.
 * Dùng Suspense để handle useSearchParams() trong ZaloBotPageContent.
 */
export function ZaloBotPage() {
  return (
    <Suspense fallback={<div className="text-sm text-ink-muted-48">Đang tải...</div>}>
      <ZaloBotContentSwitcher />
    </Suspense>
  )
}