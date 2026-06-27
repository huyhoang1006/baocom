import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Tabs, type TabDescriptor } from './Tabs'

const tabs: TabDescriptor[] = [
  { id: 'send', label: 'Gửi ngay', content: <div>Send content</div> },
  { id: 'schedule', label: 'Hẹn giờ', content: <div>Schedule content</div> },
  { id: 'recent', label: 'Gần đây', content: <div>Recent content</div> },
]

describe('Tabs', () => {
  it('renders all tab labels', () => {
    render(<Tabs tabs={tabs} />)
    expect(screen.getByRole('tab', { name: 'Gửi ngay' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Hẹn giờ' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Gần đây' })).toBeInTheDocument()
  })

  it('shows first tab as active by default', () => {
    render(<Tabs tabs={tabs} />)
    expect(screen.getByRole('tab', { name: 'Gửi ngay' })).toHaveAttribute('aria-selected', 'true')
  })

  it('honors defaultActive prop', () => {
    render(<Tabs tabs={tabs} defaultActive="schedule" />)
    expect(screen.getByRole('tab', { name: 'Hẹn giờ' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText('Schedule content')).toBeInTheDocument()
  })

  it('switches active tab on click', () => {
    render(<Tabs tabs={tabs} />)
    fireEvent.click(screen.getByRole('tab', { name: 'Hẹn giờ' }))
    expect(screen.getByRole('tab', { name: 'Hẹn giờ' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText('Schedule content')).toBeInTheDocument()
    expect(screen.queryByText('Send content')).not.toBeInTheDocument()
  })

  it('calls onChange with new tab id on click', () => {
    const onChange = vi.fn()
    render(<Tabs tabs={tabs} onChange={onChange} />)
    fireEvent.click(screen.getByRole('tab', { name: 'Gần đây' }))
    expect(onChange).toHaveBeenCalledWith('recent')
  })

  it('has tablist role on container', () => {
    render(<Tabs tabs={tabs} />)
    expect(screen.getByRole('tablist')).toBeInTheDocument()
  })

  it('has tabpanel role on content', () => {
    render(<Tabs tabs={tabs} />)
    expect(screen.getByRole('tabpanel')).toBeInTheDocument()
  })

  it('navigates with ArrowRight keyboard', () => {
    render(<Tabs tabs={tabs} defaultActive="send" />)
    const firstTab = screen.getByRole('tab', { name: 'Gửi ngay' })
    firstTab.focus()
    fireEvent.keyDown(firstTab, { key: 'ArrowRight' })
    expect(screen.getByRole('tab', { name: 'Hẹn giờ' })).toHaveAttribute('aria-selected', 'true')
  })

  it('wraps around on ArrowRight at last tab', () => {
    render(<Tabs tabs={tabs} defaultActive="recent" />)
    const lastTab = screen.getByRole('tab', { name: 'Gần đây' })
    lastTab.focus()
    fireEvent.keyDown(lastTab, { key: 'ArrowRight' })
    expect(screen.getByRole('tab', { name: 'Gửi ngay' })).toHaveAttribute('aria-selected', 'true')
  })

  it('navigates backward with ArrowLeft keyboard', () => {
    render(<Tabs tabs={tabs} defaultActive="schedule" />)
    const tab = screen.getByRole('tab', { name: 'Hẹn giờ' })
    tab.focus()
    fireEvent.keyDown(tab, { key: 'ArrowLeft' })
    expect(screen.getByRole('tab', { name: 'Gửi ngay' })).toHaveAttribute('aria-selected', 'true')
  })
})