import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth-server'
import { AdminSidebar } from '../components/sidebar/AdminSidebar'
import { ClientSidebarWrapper } from './ClientSidebarWrapper'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'admin') {
    redirect('/login')
  }

  return (
    <div className="min-h-dvh bg-canvas">
      {/* Desktop Sidebar - hidden on mobile */}
      <div className="hidden md:block">
        <AdminSidebar adminName={user.name} />
      </div>
      <ClientSidebarWrapper adminName={user.name}>
        {/* Main Content - offset for desktop sidebar, pt-11 for mobile header */}
        <main className="md:ml-[260px] min-h-dvh md:pt-0 pt-11">
          {children}
        </main>
      </ClientSidebarWrapper>
    </div>
  )
}
