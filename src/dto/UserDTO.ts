export interface CreateUserDTO {
  username?: string  // Optional - auto-generated if not provided
  password?: string  // Optional - auto-generated if not provided
  name: string
  role?: string
  phone?: string
  email?: string
  department?: string
}

export interface UpdateUserDTO {
  name?: string
  password?: string
  role?: string
  isActive?: boolean
  phone?: string
  email?: string
  department?: string
}

export interface UserResponseDTO {
  id: string
  username: string
  name: string
  role: string
  isActive: boolean
  createdAt: Date
  phone?: string
  email?: string
  department?: string
}