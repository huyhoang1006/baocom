'use client'

import { useState, useCallback, type ReactNode, type KeyboardEvent } from 'react'

export interface TabDescriptor {
  id: string
  label: string
  content?: ReactNode
}

interface TabsProps {
  tabs: TabDescriptor[]
  defaultActive?: string
  onChange?: (tabId: string) => void
}

export function Tabs({ tabs, defaultActive, onChange }: TabsProps) {
  const [activeId, setActiveId] = useState<string>(defaultActive ?? tabs[0]?.id ?? '')
  const activeTab = tabs.find((t) => t.id === activeId) ?? tabs[0]

  const select = useCallback(
    (id: string) => {
      setActiveId(id)
      onChange?.(id)
    },
    [onChange]
  )

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLButtonElement>, currentIdx: number) => {
      let nextIdx: number | null = null
      if (e.key === 'ArrowRight') {
        nextIdx = (currentIdx + 1) % tabs.length
      } else if (e.key === 'ArrowLeft') {
        nextIdx = (currentIdx - 1 + tabs.length) % tabs.length
      } else if (e.key === 'Home') {
        nextIdx = 0
      } else if (e.key === 'End') {
        nextIdx = tabs.length - 1
      }
      if (nextIdx !== null) {
        e.preventDefault()
        const nextTab = tabs[nextIdx]
        select(nextTab.id)
        const btn = document.querySelector<HTMLButtonElement>(`[data-tab-id="${nextTab.id}"]`)
        btn?.focus()
      }
    },
    [tabs, select]
  )

  return (
    <div data-testid="tabs" className="border border-hairline rounded-lg overflow-hidden">
      <div role="tablist" className="flex border-b border-hairline bg-canvas">
        {tabs.map((tab, idx) => (
          <button
            key={tab.id}
            role="tab"
            data-tab-id={tab.id}
            aria-selected={tab.id === activeId}
            aria-controls={`panel-${tab.id}`}
            data-state={tab.id === activeId ? 'active' : 'inactive'}
            onClick={() => select(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            className={`px-4 py-2.5 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              tab.id === activeId
                ? 'bg-white text-primary border-b-2 border-primary -mb-px'
                : 'text-ink-muted-48 hover:text-ink'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        id={`panel-${activeTab?.id}`}
        aria-labelledby={activeTab?.id}
        className="p-4 bg-white"
      >
        {activeTab?.content ?? (
          <p className="text-sm text-ink-muted-48">Tab content placeholder — sẽ được implement ở Phase 3.</p>
        )}
      </div>
    </div>
  )
}