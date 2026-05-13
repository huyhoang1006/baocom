export interface CreateHolidayDTO {
  date: string
  description?: string
}

export interface UpdateHolidayDTO {
  date?: string
  description?: string
  isActive?: boolean
}

export interface HolidayResponseDTO {
  id: string
  date: Date
  description?: string
  isActive: boolean
}