export interface DailyMenuMealDTO {
  mealId: string
  sortOrder: number
}

export interface CreateDailyMenuDTO {
  date: string
  mealIds: string[]
}

export interface DailyMenuResponseDTO {
  id: string
  date: Date
  meals: {
    id: string
    sortOrder: number
    meal: {
      id: string
      name: string
      type: string
    }
  }[]
}