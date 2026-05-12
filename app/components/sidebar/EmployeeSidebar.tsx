"use client"
import { usePathname } from "next/navigation"
import Link from "next/link"

const navItems = [
  { label: "Báo cơm", href: "/book", icon: "restaurant" },
  { label: "Lịch sử", href: "/my-history", icon: "history" },
]

interface Props {
  username: string
  fullName: string
}

export function EmployeeSidebar({ username, fullName }: Props) {
  const pathname = usePathname()

  return (
    <aside className="h-dvh bg-white flex flex-col fixed left-0 top-0">
      {/* Logo */}
      <div className="p-6 border-b border-hairline">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-sm">
            <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>
              restaurant
            </span>
          </div>
          <div>
            <span className="font-semibold text-lg text-ink tracking-tight">BaoCom</span>
            <p className="text-xs text-ink-muted-48 mt-0.5">Nhân viên</p>
          </div>
        </div>
      </div>

      {/* Nav Items - nav-link style (12px) */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item, index) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                ${isActive
                  ? "bg-primary"
                  : "text-ink-muted-80 hover:bg-surface-container hover:text-ink"
                }
              `}
              style={{
                animationDelay: `${index * 60}ms`,
                color: isActive ? 'white' : undefined
              }}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span className="font-medium" style={{ fontSize: '12px' }}>{item.label}</span>
              {isActive && (
                <span className="ml-auto material-symbols-outlined text-sm">chevron_right</span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer - User Info + Bottom Actions */}
      <div className="p-4 border-t border-hairline">
        {/* User info - avatar with initials in primary circle */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
            <span className="text-sm font-semibold text-white">
              {username.substring(0, 2).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="font-medium text-ink text-sm truncate">{fullName}</p>
            <p className="text-xs text-ink-muted-48">@{username}</p>
          </div>
        </div>

        {/* Bottom actions - button-utility style (14px), text-link style */}
        <div className="space-y-1">
          <button className="flex items-center gap-2 w-full px-4 py-2.5 text-ink-muted-80 hover:bg-error-bg hover:text-error transition-colors rounded-xl" style={{ fontSize: '14px' }}>
            <span className="material-symbols-outlined">settings</span>
            <span>Cài đặt</span>
          </button>
          <button className="flex items-center gap-2 w-full px-4 py-2.5 text-ink-muted-80 hover:bg-error-bg hover:text-error transition-colors rounded-xl" style={{ fontSize: '14px' }}>
            <span className="material-symbols-outlined">logout</span>
            <span>Đăng xuất</span>
          </button>
        </div>
      </div>
    </aside>
  )
}