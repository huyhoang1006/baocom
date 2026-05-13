export type MealType = 'main' | 'vegetable' | 'dessert'

export interface CreateMealDTO {
  name: string
  type: MealType
}

export interface UpdateMealDTO {
  name?: string
  type?: MealType
  isActive?: boolean
}

export interface MealResponseDTO {
  id: string
  name: string
  type: string
  isActive: boolean
  createdAt: Date
}