export type RegistrationStatus = 'eating' | 'not_eating'

export interface CreateRegistrationDTO {
  date: string
  status: RegistrationStatus
}

export interface UpdateRegistrationDTO {
  status?: RegistrationStatus
  note?: string
}

export interface RegistrationResponseDTO {
  id: string
  userId: string
  date: Date
  status: string
  note?: string
  user?: {
    name: string
    username: string
  }
}