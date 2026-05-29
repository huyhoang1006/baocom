export interface CreateUserDTO {
  username?: string  // Optional - auto-generated if not provided
  password?: string  // Optional - auto-generated if not provided
  name: string
  role?: 'admin' | 'employee'
  departmentId?: string
}

export interface UpdateUserDTO {
  name?: string
  password?: string
  role?: 'admin' | 'employee'
  isActive?: boolean
  departmentId?: string | null
}

export interface UserResponseDTO {
  id: string
  username: string
  name: string
  role: string
  isActive: boolean
  createdAt: Date
  departmentId: string | null
}