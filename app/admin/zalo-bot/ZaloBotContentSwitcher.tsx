'use client'

import { useZaloBot } from './ZaloBotContext'
import { ZaloBotHubClient } from './ZaloBotHubClient'
import { ZaloBotPageContent } from './ZaloBotPageContent'

/**
 * Switcher: chọn Hub (SetupCard) hay Tab-based content tùy state.
 */
export function ZaloBotContentSwitcher() {
  const { status } = useZaloBot()
  if (!status || status.state !== 'CONNECTED') {
    return <ZaloBotHubClient />
  }
  return <ZaloBotPageContent />
}