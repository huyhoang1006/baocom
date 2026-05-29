import { NextRequest, NextResponse } from 'next/server'
import { DepartmentService } from '@/services/DepartmentService'
import { CreateDepartmentDTO, UpdateDepartmentDTO } from '@/dto/DepartmentDTO'

export class DepartmentController {
  private departmentService: DepartmentService

  constructor() {
    this.departmentService = new DepartmentService()
  }

  async getAll() {
    const departments = await this.departmentService.findAll()
    return NextResponse.json({
      departments: departments.map(d => ({
        id: d.id,
        name: d.name,
        description: d.description,
        isActive: d.isActive,
        createdAt: d.createdAt
      }))
    })
  }

  async getOne(id: string) {
    const department = await this.departmentService.findOne(id)
    if (!department) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    return NextResponse.json({
      department: {
        id: department.id,
        name: department.name,
        description: department.description,
        isActive: department.isActive,
        createdAt: department.createdAt
      }
    })
  }

  async create(req: NextRequest) {
    let body: CreateDepartmentDTO
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    if (!body.name || body.name.trim().length === 0) {
      return NextResponse.json({ error: 'Missing required field: name' }, { status: 400 })
    }

    if (body.name.length > 100) {
      return NextResponse.json({ error: 'Name must be 100 characters or less' }, { status: 400 })
    }

    try {
      const department = await this.departmentService.create({
        name: body.name.trim(),
        description: body.description?.trim()
      })
      return NextResponse.json({ department }, { status: 201 })
    } catch (error) {
      if (error instanceof Error && error.message === 'Department name already exists') {
        return NextResponse.json({ error: 'Department name already exists' }, { status: 409 })
      }
      throw error
    }
  }

  async update(id: string, body: UpdateDepartmentDTO) {
    if (body.name && body.name.length > 100) {
      return NextResponse.json({ error: 'Name must be 100 characters or less' }, { status: 400 })
    }

    try {
      const department = await this.departmentService.update(id, body)
      return NextResponse.json({ department })
    } catch {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
  }

  async delete(id: string) {
    try {
      await this.departmentService.delete(id)
      return NextResponse.json({ success: true })
    } catch (error) {
      if (error instanceof Error && error.message === 'Cannot delete department with employees') {
        return NextResponse.json({ error: 'Cannot delete department with employees' }, { status: 400 })
      }
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
  }
}
