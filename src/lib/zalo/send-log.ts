import fs from 'fs'
import path from 'path'

export interface SendLogEntry {
  timestamp: string // ISO 8601
  kind: 'auto' | 'manual'
  status: 'success' | 'fail'
  threadId: string
  preview: string
  error?: string
}

const LOG_PATH = path.join(process.cwd(), 'data', 'zalo-bot-send-log.jsonl')

export function appendSend(entry: SendLogEntry): void {
  try {
    const dir = path.dirname(LOG_PATH)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    fs.appendFileSync(LOG_PATH, JSON.stringify(entry) + '\n', 'utf8')
  } catch {
    // Log append failures should not break the send flow
  }
}

export function readRecent(limit = 10): SendLogEntry[] {
  if (!fs.existsSync(LOG_PATH)) return []
  let raw: string
  try {
    raw = fs.readFileSync(LOG_PATH, 'utf8')
  } catch {
    return []
  }
  const lines = raw.split('\n').filter(Boolean)
  const entries: SendLogEntry[] = []
  for (const line of lines) {
    try {
      entries.push(JSON.parse(line) as SendLogEntry)
    } catch {
      // skip malformed lines
    }
  }
  return entries
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, limit)
}