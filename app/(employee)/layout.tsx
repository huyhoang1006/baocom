import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth-server'
import { EmployeeSidebar } from '../components/sidebar/EmployeeSidebar'
import { ClientSidebarWrapper } from './ClientSidebarWrapper'

export default async function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'employee') {
    redirect('/login')
  }

  return (
    <div className="min-h-dvh bg-canvas">
      {/* Desktop Sidebar - hidden on mobile */}
      <div className="hidden md:block">
        <EmployeeSidebar username={user.username} fullName={user.name} />
      </div>
      <ClientSidebarWrapper username={user.username} fullName={user.name}>
        {/* Main Content - offset for desktop sidebar, pt-11 for mobile header */}
        <main className="md:ml-[260px] min-h-dvh md:pt-0 pt-11">
          {children}
        </main>
      </ClientSidebarWrapper>
    </div>
  )
}
