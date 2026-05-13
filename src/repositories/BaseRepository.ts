import { PrismaClient } from '@prisma/client'

export abstract class BaseRepository<T, CreateInput, UpdateInput> {
  constructor(protected prisma: PrismaClient) {}

  abstract findAll(where?: Partial<T>): Promise<T[]>
  abstract findOne(id: string): Promise<T | null>
  abstract create(data: CreateInput): Promise<T>
  abstract update(id: string, data: UpdateInput): Promise<T>
  abstract delete(id: string): Promise<void>
}