import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import LoginPage from './page'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

describe('LoginPage', () => {
  it('shows error message when password is less than 4 characters', () => {
    render(<LoginPage />)

    const usernameInput = screen.getByPlaceholderText('Tên đăng nhập')
    const passwordInput = screen.getByPlaceholderText('Mật khẩu')
    const submitButton = screen.getByRole('button', { name: 'Đăng nhập' })

    // Fill in username but password too short
    fireEvent.change(usernameInput, { target: { value: 'testuser' } })
    fireEvent.change(passwordInput, { target: { value: '123' } }) // Only 3 chars

    fireEvent.click(submitButton)

    // Should show error message
    const errorMessage = screen.getByText('Mật khẩu phải có ít nhất 4 ký tự')
    expect(errorMessage).toBeInTheDocument()
  })
})