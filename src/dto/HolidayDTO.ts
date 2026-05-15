export interface CreateHolidayDTO {
  date: string  // YYYY-MM-DD
  description?: string
}

export interface UpdateHolidayDTO {
  date?: string
  description?: string
  isActive?: boolean
}