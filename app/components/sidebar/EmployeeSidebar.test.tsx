import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { EmployeeSidebar } from './EmployeeSidebar'

const push = vi.fn()
let pathname = '/dashboard'

vi.mock('next/navigation', () => ({
  usePathname: () => pathname,
  useRouter: () => ({
    push,
  }),
}))

vi.mock('@/lib/api', () => ({
  authApi: {
    logout: vi.fn().mockResolvedValue(undefined),
  },
}))

describe('EmployeeSidebar', () => {
  beforeEach(() => {
    pathname = '/dashboard'
    push.mockClear()
  })

  it('shows Dashboard first with correct link, icon, and active state', () => {
    render(<EmployeeSidebar username="hungpx" fullName="Pham Xuan Hung" />)

    const links = screen.getAllByRole('link')

    expect(links).toHaveLength(3)
    expect(links[0]).toHaveAttribute('href', '/dashboard')
    expect(within(links[0]).getByText('Dashboard')).toBeInTheDocument()
    expect(within(links[0]).getByText('dashboard')).toBeInTheDocument()
    expect(links[0]).toHaveClass('bg-primary')
    expect(within(links[0]).getByText('chevron_right')).toBeInTheDocument()

    expect(links[1]).toHaveAttribute('href', '/book')
    expect(within(links[1]).getByText('Báo cơm')).toBeInTheDocument()

    expect(links[2]).toHaveAttribute('href', '/my-history')
    expect(within(links[2]).getByText('Lịch sử')).toBeInTheDocument()
  })
})
