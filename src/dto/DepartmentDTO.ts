export interface CreateDepartmentDTO {
  name: string
  description?: string
}

export interface UpdateDepartmentDTO {
  name?: string
  description?: string
  isActive?: boolean
}

export interface DepartmentResponseDTO {
  id: string
  name: string
  description: string | null
  isActive: boolean
  createdAt: Date
}
