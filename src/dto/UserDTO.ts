export interface CreateUserDTO {
  username: string
  password: string
  name: string
  role?: string
}

export interface UpdateUserDTO {
  name?: string
  password?: string
  role?: string
  isActive?: boolean
}

export interface UserResponseDTO {
  id: string
  username: string
  name: string
  role: string
  createdAt: Date
}