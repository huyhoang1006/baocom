'use client'

import { useEffect, useState } from 'react'
import type { BotStatus, GroupInfo } from '@/lib/zalo/types'
import type { ToastType } from './Toast'

interface Props {
  status: BotStatus
  onUpdate: () => Promise<void>
  showToast: (type: ToastType, message: string, opts?: { description?: string }) => void
}

/**
 * 🧪 TESTING MODE: chỉ cho phép chọn các group trong whitelist.
 * Để trống [] = cho phép tất cả group.
 * Sau khi test xong → xóa const này để mở lại toàn bộ group.
 */
const TESTING_ALLOWED_GROUP_IDS: string[] = []

export function GroupPicker({ status, onUpdate, showToast }: Props) {
  const [groups, setGroups] = useState<GroupInfo[]>([])
  const [config, setConfig] = useState<{ groupId: string | null } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [manualGroupId, setManualGroupId] = useState('')
  const [search, setSearch] = useState('')
  const isTestingMode = TESTING_ALLOWED_GROUP_IDS.length > 0

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
    if (status.state !== 'CONNECTED') return undefined
    const id = setTimeout(() => { void loadData() }, 0)
    return () => clearTimeout(id)
  }, [status.state])

  const filteredGroups = (() => {
    const bySearch = search
      ? groups.filter((g) => g.name.toLowerCase().includes(search.toLowerCase()) || g.groupId.includes(search))
      : groups
    if (isTestingMode) {
      return bySearch.filter((g) => TESTING_ALLOWED_GROUP_IDS.includes(g.groupId))
    }
    return bySearch
  })()

  const isManualIdAllowed = !isTestingMode || TESTING_ALLOWED_GROUP_IDS.includes(manualGroupId)

  async function patchGroup(groupId: string) {
    if (isTestingMode && !TESTING_ALLOWED_GROUP_IDS.includes(groupId)) {
      showToast('error', 'Group không được phép trong chế độ test', {
        description: `Chỉ chấp nhận: ${TESTING_ALLOWED_GROUP_IDS.join(', ')}`,
      })
      return
    }
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
      showToast('success', 'Đã chọn group!')
      await onUpdate()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Lỗi'
      setError(msg)
      showToast('error', 'Lỗi chọn group', { description: msg })
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="bg-white rounded-lg border border-hairline p-5">
      <h2 className="font-semibold text-lg mb-3">Nhóm đích</h2>

      {isTestingMode && (
        <div
          data-testid="testing-mode-banner"
          className="mb-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-800"
        >
          🧪 <strong>Chế độ kiểm thử:</strong> chỉ cho phép chọn group AT-App (ID:{' '}
          <code className="bg-amber-100 px-1 rounded">{TESTING_ALLOWED_GROUP_IDS[0]}</code>). Sau khi test
          xong, xóa constant <code>TESTING_ALLOWED_GROUP_IDS</code> trong{' '}
          <code>GroupPicker.tsx</code> để mở lại.
        </div>
      )}

      {groups.length > 2 && (
        <div className="mb-3">
          <input
            id="group-search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 Tìm kiếm group..."
            className="w-full px-3 py-2 border border-hairline rounded-md text-sm"
          />
        </div>
      )}

      {groups.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-sm text-ink-muted-48 mb-2">Bot chưa tham gia group nào.</p>
          <p className="text-xs text-ink-muted-48">
            Thêm tài khoản Zalo bot vào group trước, sau đó quay lại đây.
          </p>
        </div>
      ) : (
        <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
          {filteredGroups.map((g) => {
            const selected = config?.groupId === g.groupId
            return (
              <button
                key={g.groupId}
                onClick={() => patchGroup(g.groupId)}
                disabled={loading}
                className={`w-full text-left px-3 py-2 rounded-md border transition ${
                  selected
                    ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                    : 'border-hairline hover:bg-canvas'
                } disabled:opacity-50`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-sm">{g.name}</span>
                    <span className="text-xs text-ink-muted-48 ml-2">
                      ID: {g.groupId}
                      {g.memberCount !== undefined ? ` · ${g.memberCount} thành viên` : ''}
                    </span>
                  </div>
                  {selected && <span className="text-xs font-medium text-primary">⭐ Đã chọn</span>}
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
            id="manual-group-id"
            type="text"
            value={manualGroupId}
            onChange={(e) => setManualGroupId(e.target.value)}
            placeholder="vd: 1234567890"
            pattern="[0-9]{6,20}"
            disabled={isTestingMode}
            className="flex-1 px-3 py-2 border border-hairline rounded-md text-sm font-mono disabled:opacity-50 disabled:bg-canvas"
          />
          <button
            onClick={() => manualGroupId && patchGroup(manualGroupId)}
            disabled={loading || !manualGroupId || !isManualIdAllowed}
            title={!isManualIdAllowed ? 'GroupId không nằm trong whitelist test' : undefined}
            className="px-3 py-2 bg-canvas border border-hairline rounded-md text-sm disabled:opacity-50"
          >
            📌 Lưu
          </button>
        </div>
        {isTestingMode && (
          <p className="text-xs text-amber-700 mt-1">
            🔒 Nhập tay bị tắt trong chế độ test. Hãy bấm chọn AT-App ở danh sách trên.
          </p>
        )}
        {!isTestingMode && (
          <p className="text-xs text-ink-muted-48 mt-1">
            ℹ️ Lấy groupId: Mở group Zalo → ⋮ Menu → Group info
          </p>
        )}
      </div>

      {config?.groupId && (
        <div className="mt-3 flex items-center justify-between">
          <p className="text-xs text-green-600">
            ✓ Đang gửi đến: {groups.find((g) => g.groupId === config.groupId)?.name ?? config.groupId}
          </p>
          <button onClick={loadData} className="text-xs text-primary hover:underline">
            🔄 Refresh danh sách
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
    </section>
  )
}
