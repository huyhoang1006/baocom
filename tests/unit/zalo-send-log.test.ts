import { describe, it, expect, vi, beforeEach } from 'vitest'
import path from 'path'

const existsSyncMock = vi.fn()
const appendFileSyncMock = vi.fn()
const readFileSyncMock = vi.fn()
const mkdirSyncMock = vi.fn()

vi.mock('fs', () => ({
  default: {
    existsSync: existsSyncMock,
    appendFileSync: appendFileSyncMock,
    readFileSync: readFileSyncMock,
    mkdirSync: mkdirSyncMock,
  },
  existsSync: existsSyncMock,
  appendFileSync: appendFileSyncMock,
  readFileSync: readFileSyncMock,
  mkdirSync: mkdirSyncMock,
}))

const LOG_PATH = path.join(process.cwd(), 'data', 'zalo-bot-send-log.jsonl')

describe('zalo send-log', () => {
  beforeEach(() => {
    existsSyncMock.mockReset()
    appendFileSyncMock.mockReset()
    readFileSyncMock.mockReset()
    mkdirSyncMock.mockReset()
    existsSyncMock.mockReturnValue(false)
    appendFileSyncMock.mockImplementation(() => undefined)
    readFileSyncMock.mockReturnValue('')
  })

  it('appendSend writes JSON line to data/zalo-bot-send-log.jsonl', async () => {
    const { appendSend } = await import('../../src/lib/zalo/send-log')
    appendSend({
      timestamp: '2026-06-26T08:00:00Z',
      kind: 'auto',
      status: 'success',
      threadId: '123',
      preview: 'Báo cơm',
    })
    expect(appendFileSyncMock).toHaveBeenCalledWith(
      LOG_PATH,
      expect.stringContaining('"kind":"auto"'),
      'utf8'
    )
  })

  it('readRecent returns last N entries sorted desc by timestamp', async () => {
    existsSyncMock.mockReturnValue(true)
    readFileSyncMock.mockReturnValue(
      [
        '{"timestamp":"2026-06-26T07:00:00Z","kind":"manual","status":"success","threadId":"1","preview":"a"}',
        '{"timestamp":"2026-06-26T08:00:00Z","kind":"auto","status":"success","threadId":"2","preview":"b"}',
        '{"timestamp":"2026-06-26T09:00:00Z","kind":"auto","status":"fail","threadId":"3","preview":"c"}',
      ].join('\n')
    )
    const { readRecent } = await import('../../src/lib/zalo/send-log')
    const result = readRecent(2)
    expect(result).toHaveLength(2)
    expect(result[0]?.timestamp).toBe('2026-06-26T09:00:00Z')
    expect(result[1]?.timestamp).toBe('2026-06-26T08:00:00Z')
  })

  it('readRecent returns [] when file does not exist', async () => {
    existsSyncMock.mockReturnValue(false)
    const { readRecent } = await import('../../src/lib/zalo/send-log')
    const result = readRecent(10)
    expect(result).toEqual([])
  })

  it('readRecent skips malformed lines', async () => {
    existsSyncMock.mockReturnValue(true)
    readFileSyncMock.mockReturnValue(
      [
        '{"timestamp":"2026-06-26T07:00:00Z","kind":"manual","status":"success","threadId":"1","preview":"a"}',
        'not-json',
        '{"timestamp":"2026-06-26T08:00:00Z","kind":"auto","status":"success","threadId":"2","preview":"b"}',
      ].join('\n')
    )
    const { readRecent } = await import('../../src/lib/zalo/send-log')
    const result = readRecent(10)
    expect(result).toHaveLength(2)
  })
})