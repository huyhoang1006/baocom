import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

// Protected routes that require employee role
const EMPLOYEE_ROUTES = ['/dashboard', '/book', '/my-history']

// Protected routes that require admin role
const ADMIN_ROUTES = ['/admin/dashboard', '/admin/employees', '/admin/reports']

// Public routes that don't require authentication
const PUBLIC_ROUTES = ['/', '/login']

// Check if route is public
function isPublicRoute(path: string): boolean {
  return PUBLIC_ROUTES.some(route => path === route || path.startsWith('/api/'))
}

// Check if route requires employee role
function isEmployeeRoute(path: string): boolean {
  return EMPLOYEE_ROUTES.some(route => path === route)
}

// Check if route requires admin role
function isAdminRoute(path: string): boolean {
  return ADMIN_ROUTES.some(route => path.startsWith('/admin/'))
}

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Allow public routes and API routes
  if (isPublicRoute(path)) {
    return NextResponse.next()
  }

  // Get token from cookie
  const token = request.cookies.get('token')?.value

  // No token - redirect to login
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Verify token
  const payload = verifyToken(token)

  // Invalid or expired token - redirect to login
  if (!payload) {
    const response = NextResponse.redirect(new URL('/login', request.url))
    // Clear invalid cookie
    response.cookies.delete('token')
    return response
  }

  const { role } = payload

  // Admin route accessed by non-admin (employee or invalid role)
  if (isAdminRoute(path) && role !== 'admin') {
    return NextResponse.rewrite(new URL('/403', request.url))
  }

  // Employee route accessed by admin
  if (isEmployeeRoute(path) && role === 'admin') {
    return NextResponse.rewrite(new URL('/403', request.url))
  }

  // Role matches route requirement - allow
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}