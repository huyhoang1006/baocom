// Status conversion between API and UI formats
// API uses: 'eating' | 'not_eating' (underscore)
// UI uses: 'eating' | 'not-eating' (hyphen)

export type APIStatus = 'eating' | 'not_eating'
export type UIStatus = 'eating' | 'not-eating'

export function toAPIStatus(status: UIStatus): APIStatus {
  if (status === 'eating') return 'eating'
  return 'not_eating'
}

export function toUIStatus(status: APIStatus): UIStatus {
  if (status === 'eating') return 'eating'
  return 'not-eating'
}

export function isValidAPISatus(status: string): status is APIStatus {
  return status === 'eating' || status === 'not_eating'
}