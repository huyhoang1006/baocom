'use client'

import { useEffect, useState } from 'react'
import type { BotStatus, GroupInfo } from '@/lib/zalo/types'

interface Props {
  status: BotStatus
  onUpdate: () => Promise<void>
}

export function StatusCard({ status, onUpdate }: Props) {
  const [groups, setGroups] = useState<GroupInfo[]>([])
  const [config, setConfig] = useState<{ groupId: string | null; autoSendEnabled: boolean; cron: string; template: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [manualGroupId, setManualGroupId] = useState('')

  async function loadData() {
    try {
      const [g, c] = await Promise.all([
        fetch('/api/zalo/groups', { credentials: 'include' }).then((r) => r.ok ? r.json() : { groups: [] }),
        fetch('/api/zalo/config', { credentials: 'include' }).then((r) => r.ok ? r.json() : null),
      ])
      setGroups(g.groups ?? [])
      setConfig(c)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi tải groups/config')
    }
  }

  useEffect(() => {
    if (status.state === 'CONNECTED') loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status.state])

  async function selectGroup(groupId: string) {
    await patchGroup(groupId)
  }

  async function patchGroup(groupId: string) {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/zalo/config', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ groupId }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Lỗi')
      setConfig(await res.json())
      await onUpdate()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="bg-white rounded-lg border border-hairline p-5">
      <h2 className="font-semibold text-lg mb-3">2. Group đích</h2>

      {status.state !== 'CONNECTED' ? (
        <p className="text-sm text-ink-muted-48">Kết nối bot trước để xem danh sách group.</p>
      ) : (
        <>
          {groups.length === 0 ? (
            <p className="text-sm text-ink-muted-48 mb-3">
              Bot chưa tham gia group nào (hoặc zca-js chưa đồng bộ danh sách).
            </p>
          ) : (
            <div className="space-y-2 mb-3">
              {groups.map((g) => {
                const selected = config?.groupId === g.groupId
                return (
                  <button
                    key={g.groupId}
                    onClick={() => selectGroup(g.groupId)}
                    disabled={loading}
                    className={`w-full text-left px-3 py-2 rounded-md border transition ${
                      selected ? 'border-primary bg-primary/5' : 'border-hairline hover:bg-canvas'
                    } disabled:opacity-50`}
                  >
                    <div className="font-medium">{g.name}</div>
                    <div className="text-xs text-ink-muted-48">
                      ID: {g.groupId} {g.memberCount !== undefined ? `· ${g.memberCount} thành viên` : ''}
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          <div className="border-t border-hairline pt-3 mt-3">
            <label className="block text-xs text-ink-muted-48 mb-1">Hoặc nhập groupId thủ công</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={manualGroupId}
                onChange={(e) => setManualGroupId(e.target.value)}
                placeholder="vd: 1234567890"
                pattern="[0-9]{6,20}"
                className="flex-1 px-3 py-2 border border-hairline rounded-md text-sm font-mono"
              />
              <button
                onClick={() => manualGroupId && patchGroup(manualGroupId)}
                disabled={loading || !manualGroupId}
                className="px-3 py-2 bg-canvas border border-hairline rounded-md text-sm disabled:opacity-50"
              >
                Lưu
              </button>
            </div>
            {config?.groupId && (
              <p className="text-xs text-green-600 mt-2">✓ Đã chọn group: {config.groupId}</p>
            )}
          </div>
        </>
      )}
      {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
    </section>
  )
}
