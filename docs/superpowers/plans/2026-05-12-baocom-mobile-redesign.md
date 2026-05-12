# BaoCom Mobile Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign all 8 screens following Apple Design Language - mobile-first with Action Blue (#0066cc), pill buttons, clean typography

**Architecture:** Component-based redesign using existing design tokens in globals.css. Each screen independently redesigned following spec. Layouts updated with improved hamburger/drawer pattern.

**Tech Stack:** Next.js App Router, React TypeScript, Tailwind CSS, existing design tokens (CSS custom properties)

---

## File Structure (All modifications)

```
app/
├── (auth)/login/page.tsx              # Redesign login
├── (employee)/
│   ├── layout.tsx                    # Fix hamburger + drawer styling
│   ├── dashboard/page.tsx            # Redesign weekly menu view
│   ├── book/page.tsx                  # Redesign quick toggle
│   └── my-history/page.tsx           # Redesign calendar view
├── admin/
│   ├── layout.tsx                    # Fix hamburger + drawer styling
│   ├── dashboard/page.tsx            # Redesign overview
│   ├── employees/page.tsx            # Redesign card list
│   └── reports/page.tsx              # Redesign single screen
├── components/
│   └── sidebar/
│       ├── MobileSidebar.tsx         # Update styling + animations
│       ├── EmployeeSidebar.tsx       # Update styling
│       └── AdminSidebar.tsx          # Update styling
└── globals.css                       # Already has Apple design tokens
```

---

## Task 1: Update Shared Sidebar & Layout Components

**Files:**
- Modify: `app/(employee)/layout.tsx:1-67`
- Modify: `app/(admin)/layout.tsx:1-60`
- Modify: `app/components/sidebar/MobileSidebar.tsx:1-74`
- Modify: `app/components/sidebar/EmployeeSidebar.tsx` (read first)
- Modify: `app/components/sidebar/AdminSidebar.tsx` (read first)

- [ ] **Step 1: Read EmployeeSidebar and AdminSidebar to understand current structure**

Read both files to understand current nav items and styling.

- [ ] **Step 2: Update EmployeeLayout with Apple-style hamburger and improved drawer trigger**

Replace current layout with:
- Hamburger: 44px tap target, surface-black bg, white icon, rounded.sm (8px)
- Header: 44px height, surface-black, white title text
- Proper z-index layering

```tsx
// app/(employee)/layout.tsx
"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { EmployeeSidebar } from "../components/sidebar/EmployeeSidebar"
import { MobileSidebar } from "../components/sidebar/MobileSidebar"

export default function EmployeeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setIsDrawerOpen(false)
  }, [pathname])

  const mockUser = {
    username: "hungpx",
    fullName: "Phạm Xuân Hùng",
  }

  return (
    <div className="min-h-dvh bg-canvas">
      {/* Mobile Header - Apple-style black nav bar */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 h-11 bg-surface-black flex items-center px-4">
        <button
          onClick={() => setIsDrawerOpen(true)}
          className="w-11 h-11 -ml-2 flex items-center justify-center rounded-[8px] active:scale-95 transition-transform"
          aria-label="Open menu"
        >
          <span className="material-symbols-outlined text-on-primary">menu</span>
        </button>
        <span className="flex-1 text-center text-[12px] font-normal tracking-[-0.12px] text-body-on-dark">
          BaoCom
        </span>
        <div className="w-11 h-11 flex items-center justify-center">
          <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
            <span className="text-[10px] font-semibold text-on-primary">
              {mockUser.fullName.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()}
            </span>
          </div>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <EmployeeSidebar username={mockUser.username} fullName={mockUser.fullName} />
      </div>

      {/* Mobile Sidebar */}
      <MobileSidebar isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)}>
        <EmployeeSidebar username={mockUser.username} fullName={mockUser.fullName} />
      </MobileSidebar>

      {/* Main Content */}
      <main className="md:ml-[260px] min-h-dvh pt-11 md:pt-0">
        {children}
      </main>
    </div>
  )
}
```

- [ ] **Step 3: Update AdminLayout similarly**

Apply same pattern for admin layout with "BaoCom Admin" title.

- [ ] **Step 4: Update MobileSidebar styling**

```tsx
// app/components/sidebar/MobileSidebar.tsx
// Update backdrop to 40% black
// Update drawer: 280px width, white bg, proper shadow
// Update close button: circular, 44px
// Add proper animation (300ms ease-out)
```

- [ ] **Step 5: Update EmployeeSidebar styling**

```tsx
// app/components/sidebar/EmployeeSidebar.tsx
// User info section at top: avatar, name, email
// Nav items with SF Symbol icons
// Bottom: Settings, Logout (text-link style)
// Use Apple typography: nav-link (12px), button-utility (14px)
```

- [ ] **Step 6: Update AdminSidebar styling**

Same pattern as EmployeeSidebar but with admin nav items.

- [ ] **Step 7: Commit**

```bash
git add app/(employee)/layout.tsx app/(admin)/layout.tsx app/components/sidebar/*.tsx
git commit -m "refactor: update sidebar components and layout styling"
```

---

## Task 2: Redesign Login Screen

**Files:**
- Modify: `app/(auth)/login/page.tsx:1-6` (existing redirect, will rewrite)

- [ ] **Step 1: Write complete login page redesign**

```tsx
// app/(auth)/login/page.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const router = useRouter()

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    // Mock login - redirect based on username
    if (username.toLowerCase().includes("admin")) {
      router.push("/admin/dashboard")
    } else {
      router.push("/dashboard")
    }
  }

  return (
    <div className="min-h-dvh bg-canvas flex items-center justify-center px-6">
      <div className="w-full max-w-[400px]">
        {/* Logo + Wordmark */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 rounded-[18px] bg-primary mx-auto mb-4 flex items-center justify-center">
            <span className="text-3xl">🍽️</span>
          </div>
          <h1 className="text-[40px] font-semibold tracking-tight text-ink mb-2" style={{ letterSpacing: "-0.02em" }}>
            BaoCom
          </h1>
          <p className="text-[17px] text-ink-muted-48">
            Quản lý suất ăn cho công ty
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Tên đăng nhập"
              className="form-input h-11 px-5"
              required
            />
          </div>
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mật khẩu"
              className="form-input h-11 px-5"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full h-11 rounded-full bg-primary text-on-primary text-[17px] font-normal active:scale-95 transition-transform press-effect"
          >
            Đăng nhập
          </button>
        </form>

        {/* Forgot password */}
        <div className="text-center mt-6">
          <a href="#" className="text-[14px] text-primary">
            Quên mật khẩu?
          </a>
        </div>

        {/* Demo hint */}
        <div className="mt-8 p-4 rounded-[11px] bg-surface-container-low border border-hairline">
          <p className="text-[12px] text-ink-muted-48 text-center">
            Demo: nhập "admin" để đăng nhập Admin, hoặc bất kỳ username nào để đăng nhập Employee
          </p>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Test the login page**

Verify it renders correctly and redirects properly.

- [ ] **Step 3: Commit**

```bash
git add app/(auth)/login/page.tsx
git commit -m "feat: redesign login screen with Apple styling"
```

---

## Task 3: Redesign Employee Dashboard (Weekly Menu)

**Files:**
- Modify: `app/(employee)/dashboard/page.tsx:1-163`

- [ ] **Step 1: Write complete dashboard redesign**

```tsx
// app/(employee)/dashboard/page.tsx
"use client"

import { useState } from "react"

interface DayMenu {
  day: string
  date: string
  fullDate: string
  dishes: {
    main: string
    vegetables: string[]
    dessert: string
  }
  registered: boolean
}

const weeklyMenu: DayMenu[] = [
  {
    day: "Thứ Hai",
    date: "11/5",
    fullDate: "2026-05-11",
    dishes: {
      main: "Thịt kho tàu",
      vegetables: ["Cải xào", "Su su luộc"],
      dessert: "Chuối tráng miệng"
    },
    registered: true
  },
  {
    day: "Thứ Ba",
    date: "12/5",
    fullDate: "2026-05-12",
    dishes: {
      main: "Chả lá lốt",
      vegetables: ["Thịt gà rang", "Đỗ quả xào"],
      dessert: "Dưa hấu"
    },
    registered: true
  },
  {
    day: "Thứ Tư",
    date: "13/5",
    fullDate: "2026-05-13",
    dishes: {
      main: "Thịt chân giò nấu giả cầy",
      vegetables: ["Thịt ngan xào sả ớt", "Dưa góp"],
      dessert: "Ổi"
    },
    registered: false
  },
  {
    day: "Thứ Năm",
    date: "14/5",
    fullDate: "2026-05-14",
    dishes: {
      main: "Thịt bò chiên",
      vegetables: ["Cá kho", "Rau muống xào"],
      dessert: "Dưa hấu"
    },
    registered: false
  },
  {
    day: "Thứ Sáu",
    date: "15/5",
    fullDate: "2026-05-15",
    dishes: {
      main: "Thịt bò xào",
      vegetables: ["Trứng rán", "Ốc om chuối đậu"],
      dessert: "Củ đậu"
    },
    registered: false
  }
]

export default function EmployeeDashboard() {
  const [selectedDayIndex, setSelectedDayIndex] = useState(1)
  const selectedDay = weeklyMenu[selectedDayIndex]

  const handleRegister = () => {
    weeklyMenu[selectedDayIndex].registered = !weeklyMenu[selectedDayIndex].registered
  }

  return (
    <div className="min-h-dvh bg-canvas pb-12">
      {/* Page Header */}
      <header className="pt-8 pb-6 px-6">
        <div className="max-w-[900px] mx-auto">
          <p className="text-[14px] text-ink-muted-48 mb-1">Thực đơn</p>
          <h1 className="text-[34px] font-semibold tracking-tight text-ink" style={{ letterSpacing: "-0.0374em" }}>
            Tuần này
          </h1>
        </div>
      </header>

      {/* Day Selector - Horizontal Scroll */}
      <div className="px-6 mb-6">
        <div className="max-w-[900px] mx-auto">
          <div className="flex gap-2 overflow-x-auto scroll-snap-x mandatory pb-2 -mx-6 px-6">
            {weeklyMenu.map((day, index) => (
              <button
                key={day.fullDate}
                onClick={() => setSelectedDayIndex(index)}
                className={`flex-shrink-0 min-w-[64px] px-4 py-3 rounded-[18px] text-center transition-all active:scale-95 scroll-snap-align-center ${
                  selectedDayIndex === index
                    ? "bg-primary text-on-primary"
                    : "bg-surface-container-low text-ink"
                }`}
              >
                <div className="text-[12px] font-medium opacity-80">{day.day}</div>
                <div className="text-[20px] font-semibold">{day.date}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Menu Content */}
      <main className="px-6">
        <div className="max-w-[900px] mx-auto">
          <div className="rounded-[18px] bg-canvas border border-hairline overflow-hidden">
            {/* Date Header */}
            <div className="px-5 py-4 border-b border-hairline bg-surface-container-low">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-[21px] font-semibold text-ink">
                    {selectedDay.day}, {selectedDay.date}
                  </h2>
                  <p className="text-[14px] text-ink-muted-48">Thực đơn bữa trưa</p>
                </div>
                {selectedDay.registered ? (
                  <span className="px-3 py-1.5 rounded-full text-[12px] font-medium bg-success-bg text-success">
                    Đã đăng ký
                  </span>
                ) : (
                  <span className="px-3 py-1.5 rounded-full text-[12px] font-medium bg-surface-container text-ink-muted-48">
                    Chưa đăng ký
                  </span>
                )}
              </div>
            </div>

            {/* Menu Items */}
            <div className="p-5 space-y-4">
              {/* Main Dish */}
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-wider text-ink-muted-48 mb-2">
                  Món chính
                </p>
                <p className="text-[17px] font-semibold text-ink">{selectedDay.dishes.main}</p>
              </div>

              {/* Vegetables */}
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-wider text-ink-muted-48 mb-2">
                  Món rau
                </p>
                {selectedDay.dishes.vegetables.map((dish, i) => (
                  <p key={i} className="text-[17px] text-ink-muted-80">{dish}</p>
                ))}
              </div>

              {/* Dessert */}
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-wider text-ink-muted-48 mb-2">
                  Tráng miệng
                </p>
                <p className="text-[17px] text-ink-muted-80">{selectedDay.dishes.dessert}</p>
              </div>
            </div>

            {/* Action Button */}
            <div className="px-5 pb-5">
              <button
                onClick={handleRegister}
                className={`w-full h-11 rounded-full text-[17px] font-normal transition-all active:scale-95 ${
                  selectedDay.registered
                    ? "bg-error-bg text-error"
                    : "bg-primary text-on-primary"
                }`}
              >
                {selectedDay.registered ? "Hủy đăng ký" : "Đăng ký ăn"}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Test the dashboard**

Verify weekly menu displays, day selection works, registration toggles.

- [ ] **Step 3: Commit**

```bash
git add app/(employee)/dashboard/page.tsx
git commit -m "feat: redesign employee dashboard with weekly menu view"
```

---

## Task 4: Redesign Báo Cơm (Quick Toggle)

**Files:**
- Modify: `app/(employee)/book/page.tsx:1-225`

- [ ] **Step 1: Write complete book page redesign**

```tsx
// app/(employee)/book/page.tsx
"use client"

import { useState } from "react"

interface DayInfo {
  date: number
  month: number
  dayName: string
  fullDate: string
  status: "eating" | "not-eating" | "none"
  isToday?: boolean
}

const mockDays: DayInfo[] = [
  { date: 11, month: 5, dayName: "T2", fullDate: "2026-05-11", status: "eating" },
  { date: 12, month: 5, dayName: "T3", fullDate: "2026-05-12", status: "eating", isToday: true },
  { date: 13, month: 5, dayName: "T4", fullDate: "2026-05-13", status: "none" },
  { date: 14, month: 5, dayName: "T5", fullDate: "2026-05-14", status: "none" },
  { date: 15, month: 5, dayName: "T6", fullDate: "2026-05-15", status: "none" },
  { date: 18, month: 5, dayName: "T2", fullDate: "2026-05-18", status: "none" },
  { date: 19, month: 5, dayName: "T3", fullDate: "2026-05-19", status: "none" },
  { date: 20, month: 5, dayName: "T4", fullDate: "2026-05-20", status: "none" },
]

export default function BookPage() {
  const [days, setDays] = useState(mockDays)
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null)

  const toggleDay = (fullDate: string) => {
    setDays(prev => prev.map(day => {
      if (day.fullDate === fullDate) {
        const newStatus = day.status === "eating" ? "not-eating" : day.status === "not-eating" ? "eating" : "eating"
        return { ...day, status: newStatus }
      }
      return day
    }))

    const day = days.find(d => d.fullDate === fullDate)
    const message = day?.status === "eating" ? "Đã hủy đăng ký" : "Đã đăng ký ăn"
    setNotification({ type: "success", message })
    setTimeout(() => setNotification(null), 3000)
  }

  const todayCount = days.filter(d => d.status === "eating" && !d.isToday).length

  return (
    <div className="min-h-dvh bg-canvas pb-12">
      {/* Page Header */}
      <header className="pt-8 pb-6 px-6">
        <div className="max-w-[900px] mx-auto">
          <p className="text-[14px] text-ink-muted-48 mb-1">Đăng ký suất ăn</p>
          <h1 className="text-[34px] font-semibold tracking-tight text-ink" style={{ letterSpacing: "-0.0374em" }}>
            Báo Cơm
          </h1>
          <p className="text-[17px] text-ink-muted-80 mt-2">
            Mặc định bạn sẽ ăn trưa hàng ngày. Chọn những ngày bạn không ăn.
          </p>
        </div>
      </header>

      {/* Stats */}
      <div className="px-6 mb-6">
        <div className="max-w-[900px] mx-auto flex gap-3">
          <div className="flex-1 p-4 rounded-[18px] bg-success-bg">
            <p className="text-[12px] font-medium text-success mb-1">Đã đăng ký</p>
            <span className="text-[28px] font-semibold text-ink">{todayCount}</span>
            <span className="text-[14px] text-ink-muted-48 ml-1">ngày</span>
          </div>
          <div className="flex-1 p-4 rounded-[18px] bg-surface-container-low">
            <p className="text-[12px] font-medium text-ink-muted-48 mb-1">Tuần này</p>
            <span className="text-[28px] font-semibold text-ink">5</span>
            <span className="text-[14px] text-ink-muted-48 ml-1">ngày làm</span>
          </div>
        </div>
      </div>

      {/* Day Grid */}
      <main className="px-6">
        <div className="max-w-[900px] mx-auto">
          <div className="grid grid-cols-2 gap-3">
            {days.map((day) => {
              const isEating = day.status === "eating"
              const isNotEating = day.status === "not-eating"

              return (
                <button
                  key={day.fullDate}
                  onClick={() => toggleDay(day.fullDate)}
                  className={`
                    relative p-4 rounded-[18px] border-2 transition-all active:scale-95
                    ${isEating ? "border-success bg-success-bg" : ""}
                    ${isNotEating ? "border-error bg-error-bg" : ""}
                    ${day.status === "none" ? "border-hairline bg-surface-container-low hover:border-primary" : ""}
                    ${day.isToday ? "ring-2 ring-primary ring-offset-2" : ""}
                  `}
                >
                  {/* Today badge */}
                  {day.isToday && (
                    <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-primary text-on-primary text-[10px] font-semibold rounded-full">
                      Hôm nay
                    </div>
                  )}

                  {/* Day name */}
                  <div className="text-[12px] font-medium text-ink-muted-48 mb-1">
                    {day.dayName}
                  </div>

                  {/* Date */}
                  <div className="text-[24px] font-semibold text-ink mb-2">
                    {day.date}
                  </div>

                  {/* Status */}
                  <div className={`text-[14px] font-medium ${
                    isEating ? "text-success" : isNotEating ? "text-error" : "text-ink-muted-48"
                  }`}>
                    {isEating ? "Ăn" : isNotEating ? "Không ăn" : "Chưa chọn"}
                  </div>

                  {/* Status icon */}
                  <div className={`absolute top-4 right-4 w-3 h-3 rounded-full ${
                    isEating ? "bg-success" : isNotEating ? "bg-error" : "bg-hairline"
                  }`} />
                </button>
              )
            })}
          </div>
        </div>
      </main>

      {/* Toast notification */}
      {notification && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3.5 rounded-[18px] shadow-floating animate-slide-down"
          style={{
            background: "var(--color-success-bg)",
            color: "var(--color-success)",
            border: "1px solid var(--color-success)"
          }}
        >
          <span className="material-symbols-outlined">
            {notification.type === "success" ? "check_circle" : "error"}
          </span>
          <span className="text-[14px] font-medium">{notification.message}</span>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Test the book page**

Verify grid displays, tap toggles status, toast appears.

- [ ] **Step 3: Commit**

```bash
git add app/(employee)/book/page.tsx
git commit -m "feat: redesign Báo Cơm with quick toggle grid"
```

---

## Task 5: Redesign Lịch Sử (Calendar View)

**Files:**
- Modify: `app/(employee)/my-history/page.tsx:1-227`

- [ ] **Step 1: Write complete history page redesign**

```tsx
// app/(employee)/my-history/page.tsx
"use client"

import { useState } from "react"

interface HistoryEntry {
  date: string
  status: "eating" | "not-eating"
  note?: string
}

const mockHistory: HistoryEntry[] = [
  { date: "2026-05-05", status: "eating" },
  { date: "2026-05-06", status: "eating" },
  { date: "2026-05-07", status: "not-eating", note: "Đi công trường" },
  { date: "2026-05-08", status: "eating" },
  { date: "2026-05-09", status: "eating" },
  { date: "2026-05-12", status: "eating" },
]

export default function HistoryPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 4, 1))
  const [filter, setFilter] = useState<"week" | "month">("month")

  const mockUser = { fullName: "Phạm Xuân Hùng" }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDay = firstDay.getDay()

    const days: { date: number; month: number; year: number; isCurrentMonth: boolean }[] = []

    // Previous month days
    const prevMonth = new Date(year, month, 0)
    for (let i = startingDay - 1; i >= 0; i--) {
      days.push({
        date: prevMonth.getDate() - i,
        month: month - 1,
        year: month === 0 ? year - 1 : year,
        isCurrentMonth: false
      })
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ date: i, month, year, isCurrentMonth: true })
    }

    // Next month days
    const remaining = 42 - days.length
    for (let i = 1; i <= remaining; i++) {
      days.push({
        date: i,
        month: month + 1,
        year: month === 11 ? year + 1 : year,
        isCurrentMonth: false
      })
    }

    return days
  }

  const days = getDaysInMonth(currentMonth)
  const weekdays = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"]

  const getStatusForDate = (day: number, month: number, year: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    const entry = mockHistory.find(h => h.date === dateStr)
    return entry?.status || null
  }

  const eatingCount = mockHistory.filter(h => h.status === "eating").length
  const notEatingCount = mockHistory.filter(h => h.status === "not-eating").length

  return (
    <div className="min-h-dvh bg-canvas pb-12">
      {/* Page Header */}
      <header className="pt-8 pb-6 px-6">
        <div className="max-w-[900px] mx-auto">
          <p className="text-[14px] text-ink-muted-48 mb-1">Lịch sử đăng ký</p>
          <h1 className="text-[34px] font-semibold tracking-tight text-ink" style={{ letterSpacing: "-0.0374em" }}>
            Lịch Sử
          </h1>
          <p className="text-[17px] text-ink-muted-80 mt-1">
            Xin chào, <span className="font-semibold text-ink">{mockUser.fullName}</span>
          </p>
        </div>
      </header>

      {/* Stats */}
      <div className="px-6 mb-6">
        <div className="max-w-[900px] mx-auto grid grid-cols-3 gap-3">
          <div className="p-4 rounded-[18px] bg-surface-container-low text-center">
            <span className="text-[28px] font-semibold text-ink">{eatingCount + notEatingCount}</span>
            <p className="text-[12px] text-ink-muted-48">Tổng</p>
          </div>
          <div className="p-4 rounded-[18px] bg-success-bg text-center">
            <span className="text-[28px] font-semibold text-success">{eatingCount}</span>
            <p className="text-[12px] text-success">Có ăn</p>
          </div>
          <div className="p-4 rounded-[18px] bg-error-bg text-center">
            <span className="text-[28px] font-semibold text-error">{notEatingCount}</span>
            <p className="text-[12px] text-error">Không ăn</p>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <main className="px-6">
        <div className="max-w-[900px] mx-auto rounded-[18px] bg-canvas border border-hairline overflow-hidden">
          {/* Month Navigation */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-hairline">
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
              className="w-11 h-11 rounded-full bg-surface-container-low flex items-center justify-center active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined text-ink-muted-48">chevron_left</span>
            </button>
            <h2 className="text-[17px] font-semibold text-ink">
              Tháng {currentMonth.getMonth() + 1}, {currentMonth.getFullYear()}
            </h2>
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
              className="w-11 h-11 rounded-full bg-surface-container-low flex items-center justify-center active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined text-ink-muted-48">chevron_right</span>
            </button>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 border-b border-hairline">
            {weekdays.map(day => (
              <div key={day} className="py-3 text-center text-[12px] font-medium text-ink-muted-48">
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7">
            {days.map((day, index) => {
              const status = day.isCurrentMonth ? getStatusForDate(day.date, day.month, day.year) : null
              const isToday = day.date === 12 && day.month === 4 && day.year === 2026

              return (
                <div
                  key={index}
                  className={`aspect-square flex flex-col items-center justify-center p-2 ${
                    !day.isCurrentMonth ? "opacity-30" : ""
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[14px] font-medium ${
                    isToday ? "bg-primary text-on-primary" : "text-ink"
                  }`}>
                    {day.date}
                  </div>
                  {status && (
                    <div className={`w-2 h-2 rounded-full mt-1 ${
                      status === "eating" ? "bg-success" : "bg-error"
                    }`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Test the history page**

Verify calendar displays, navigation works, stats show correctly.

- [ ] **Step 3: Commit**

```bash
git add app/(employee)/my-history/page.tsx
git commit -m "feat: redesign Lịch Sử with calendar view"
```

---

## Task 6: Redesign Admin Dashboard

**Files:**
- Modify: `app/admin/dashboard/page.tsx:1-163`

- [ ] **Step 1: Write complete admin dashboard redesign**

```tsx
// app/admin/dashboard/page.tsx
"use client"

import { useRouter } from "next/navigation"

export default function AdminDashboard() {
  const router = useRouter()

  const stats = [
    { label: "Tổng nhân viên", value: "24", icon: "group" },
    { label: "Đang ăn hôm nay", value: "18", icon: "restaurant" },
    { label: "Không ăn", value: "6", icon: "no_meals" },
    { label: "Tỷ lệ đăng ký", value: "75%", icon: "pie_chart" },
  ]

  return (
    <div className="min-h-dvh bg-canvas pb-12">
      {/* Page Header */}
      <header className="pt-8 pb-6 px-6">
        <div className="max-w-[900px] mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-[14px] text-ink-muted-48">Admin</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary text-on-primary">
              ADMIN
            </span>
          </div>
          <h1 className="text-[34px] font-semibold tracking-tight text-ink" style={{ letterSpacing: "-0.0374em" }}>
            Dashboard
          </h1>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="px-6 mb-6">
        <div className="max-w-[900px] mx-auto grid grid-cols-2 gap-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="p-5 rounded-[18px] bg-canvas border border-hairline"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-[11px] bg-primary-bg flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {stat.icon}
                  </span>
                </div>
                <span className="text-[14px] text-ink-muted-48">{stat.label}</span>
              </div>
              <span className="text-[40px] font-semibold text-ink">{stat.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <main className="px-6">
        <div className="max-w-[900px] mx-auto space-y-4">
          <h2 className="text-[21px] font-semibold text-ink">Thao tác nhanh</h2>

          <button
            onClick={() => router.push("/admin/reports")}
            className="w-full p-5 rounded-[18px] bg-canvas border border-hairline flex items-center gap-4 active:scale-[0.98] transition-transform"
          >
            <div className="w-12 h-12 rounded-[12px] bg-primary-bg flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                assessment
              </span>
            </div>
            <div className="text-left flex-1">
              <h3 className="text-[17px] font-semibold text-ink">Xuất báo cáo</h3>
              <p className="text-[14px] text-ink-muted-48">Tạo báo cáo theo ngày, tuần, tháng</p>
            </div>
            <span className="material-symbols-outlined text-ink-muted-48">chevron_right</span>
          </button>

          <button
            onClick={() => router.push("/admin/employees")}
            className="w-full p-5 rounded-[18px] bg-canvas border border-hairline flex items-center gap-4 active:scale-[0.98] transition-transform"
          >
            <div className="w-12 h-12 rounded-[12px] bg-surface-container-low flex items-center justify-center">
              <span className="material-symbols-outlined text-ink text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                group
              </span>
            </div>
            <div className="text-left flex-1">
              <h3 className="text-[17px] font-semibold text-ink">Quản lý nhân sự</h3>
              <p className="text-[14px] text-ink-muted-48">Thêm, sửa, xóa nhân viên</p>
            </div>
            <span className="material-symbols-outlined text-ink-muted-48">chevron_right</span>
          </button>
        </div>
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Test admin dashboard**

Verify stats display, navigation buttons work.

- [ ] **Step 3: Commit**

```bash
git add app/admin/dashboard/page.tsx
git commit -m "feat: redesign admin dashboard with stats grid"
```

---

## Task 7: Redesign Nhân Sự (Card List)

**Files:**
- Modify: `app/admin/employees/page.tsx:1-500`

- [ ] **Step 1: Write complete employees page redesign**

```tsx
// app/admin/employees/page.tsx
"use client"

import { useState } from "react"

interface Employee {
  id: string
  name: string
  username: string
  phone: string
  email?: string
  department?: string
  status: "active" | "inactive"
}

const initialEmployees: Employee[] = [
  { id: "1", name: "Nguyễn Văn A", username: "nguyenvana", phone: "0912345678", email: "nva@company.com", department: "Kỹ thuật", status: "active" },
  { id: "2", name: "Trần Thị B", username: "tranthib", phone: "0912345679", email: "ttb@company.com", department: "Kinh doanh", status: "active" },
  { id: "3", name: "Lê Văn C", username: "levanc", phone: "0912345680", department: "Kỹ thuật", status: "active" },
  { id: "4", name: "Phạm Thị D", username: "phamthid", phone: "0912345681", email: "ptd@company.com", department: "Nhân sự", status: "inactive" },
  { id: "5", name: "Hoàng Văn E", username: "hoangvane", phone: "0912345682", department: "Kỹ thuật", status: "active" },
]

const departments = ["Kỹ thuật", "Kinh doanh", "Nhân sự", "Tài chính", "Marketing"]

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees)
  const [searchQuery, setSearchQuery] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"add" | "edit">("add")
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [notification, setNotification] = useState<{ type: "success"; message: string } | null>(null)

  const [formData, setFormData] = useState({ name: "", phone: "", email: "", department: "" })
  const [formErrors, setFormErrors] = useState<{ name?: string; phone?: string }>({})

  const filteredEmployees = employees.filter(emp =>
    emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.phone.includes(searchQuery)
  )

  const showNotification = (message: string) => {
    setNotification({ type: "success", message })
    setTimeout(() => setNotification(null), 3000)
  }

  const validateForm = () => {
    const errors: { name?: string; phone?: string } = {}
    if (!formData.name.trim()) errors.name = "Vui lòng nhập họ và tên"
    if (!formData.phone.trim()) errors.phone = "Vui lòng nhập SĐT"
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSave = () => {
    if (!validateForm()) return
    if (modalMode === "add") {
      setEmployees(prev => [...prev, {
        id: Date.now().toString(),
        name: formData.name,
        username: formData.name.toLowerCase().replace(/\s/g, ""),
        phone: formData.phone,
        email: formData.email || undefined,
        department: formData.department || undefined,
        status: "active"
      }])
      showNotification("Đã thêm nhân viên mới")
    } else if (editingEmployee) {
      setEmployees(prev => prev.map(e => e.id === editingEmployee.id ? { ...e, ...formData } : e))
      showNotification("Đã cập nhật thông tin")
    }
    setIsModalOpen(false)
  }

  const handleDelete = (emp: Employee) => {
    setEmployees(prev => prev.map(e => e.id === emp.id ? { ...e, status: "inactive" } : e))
    showNotification(`Đã xóa "${emp.name}"`)
  }

  return (
    <div className="min-h-dvh bg-canvas pb-12">
      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3.5 rounded-[18px] shadow-floating animate-slide-down bg-success-bg text-success border border-success">
          <span className="material-symbols-outlined">check_circle</span>
          <span className="text-[14px] font-medium">{notification.message}</span>
        </div>
      )}

      {/* Page Header */}
      <header className="pt-8 pb-6 px-6">
        <div className="max-w-[900px] mx-auto">
          <p className="text-[14px] text-ink-muted-48 mb-1">Quản lý nhân sự</p>
          <h1 className="text-[34px] font-semibold tracking-tight text-ink" style={{ letterSpacing: "-0.0374em" }}>
            Nhân Sự
          </h1>
        </div>
      </header>

      {/* Actions Row */}
      <div className="px-6 mb-4">
        <div className="max-w-[900px] mx-auto flex gap-3">
          <button
            onClick={() => { setModalMode("add"); setFormData({ name: "", phone: "", email: "", department: "" }); setIsModalOpen(true) }}
            className="h-11 px-5 rounded-full bg-primary text-on-primary text-[14px] font-medium active:scale-95 transition-transform flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">person_add</span>
            Thêm nhân viên
          </button>
          <button className="h-11 px-5 rounded-full bg-surface-container-low text-ink text-[14px] font-medium border border-hairline active:scale-95 transition-transform flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">upload_file</span>
            Import
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-6 mb-6">
        <div className="max-w-[900px] mx-auto">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-ink-muted-48">search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm..."
              className="w-full h-11 pl-11 pr-5 rounded-full bg-surface-container-low border border-hairline text-[17px] focus:outline-none focus:border-primary"
            />
          </div>
        </div>
      </div>

      {/* Employee Cards */}
      <main className="px-6">
        <div className="max-w-[900px] mx-auto space-y-3">
          {filteredEmployees.map(emp => (
            <div
              key={emp.id}
              className="p-4 rounded-[18px] bg-canvas border border-hairline flex items-center gap-4"
            >
              {/* Avatar */}
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shrink-0">
                <span className="text-[14px] font-semibold text-on-primary">
                  {emp.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()}
                </span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-[17px] font-semibold text-ink truncate">{emp.name}</h3>
                <p className="text-[12px] text-ink-muted-48 font-mono">@{emp.username}</p>
                <p className="text-[14px] text-ink-muted-48">{emp.phone}</p>
              </div>

              {/* Status */}
              <div className="shrink-0 text-right">
                <span className={`inline-block px-2.5 py-1 rounded-full text-[12px] font-medium ${
                  emp.status === "active" ? "bg-success-bg text-success" : "bg-surface-container-low text-ink-muted-48"
                }`}>
                  {emp.status === "active" ? "Đang hoạt động" : "Đã khóa"}
                </span>
              </div>

              {/* Actions */}
              <div className="shrink-0 flex gap-2">
                <button
                  onClick={() => { setModalMode("edit"); setEditingEmployee(emp); setFormData({ name: emp.name, phone: emp.phone, email: emp.email || "", department: emp.department || "" }); setIsModalOpen(true) }}
                  className="w-11 h-11 rounded-full bg-surface-container-low flex items-center justify-center active:scale-95 transition-transform"
                >
                  <span className="material-symbols-outlined text-ink-muted-48">edit</span>
                </button>
                <button
                  onClick={() => handleDelete(emp)}
                  className="w-11 h-11 rounded-full bg-error-bg flex items-center justify-center active:scale-95 transition-transform"
                >
                  <span className="material-symbols-outlined text-error">delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/40" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-[400px] bg-canvas rounded-[18px] p-6 animate-scale-in">
            <h2 className="text-[21px] font-semibold text-ink mb-5">
              {modalMode === "add" ? "Thêm nhân viên" : "Chỉnh sửa"}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-[14px] font-medium text-ink mb-1.5 block">Họ và tên</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`form-input h-11 ${formErrors.name ? "border-error" : ""}`}
                />
                {formErrors.name && <p className="text-[12px] text-error mt-1">{formErrors.name}</p>}
              </div>

              <div>
                <label className="text-[14px] font-medium text-ink mb-1.5 block">SĐT</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className={`form-input h-11 ${formErrors.phone ? "border-error" : ""}`}
                />
                {formErrors.phone && <p className="text-[12px] text-error mt-1">{formErrors.phone}</p>}
              </div>

              <div>
                <label className="text-[14px] font-medium text-ink mb-1.5 block">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="form-input h-11"
                />
              </div>

              <div>
                <label className="text-[14px] font-medium text-ink mb-1.5 block">Phòng ban</label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="form-input h-11"
                >
                  <option value="">Chọn phòng ban</option>
                  {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 h-11 rounded-full bg-surface-container-low text-ink text-[14px] font-medium active:scale-95 transition-transform"
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                className="flex-1 h-11 rounded-full bg-primary text-on-primary text-[14px] font-medium active:scale-95 transition-transform"
              >
                {modalMode === "add" ? "Thêm mới" : "Lưu"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Test employees page**

Verify card list displays, search works, add/edit modal functions.

- [ ] **Step 3: Commit**

```bash
git add app/admin/employees/page.tsx
git commit -m "feat: redesign Nhân Sự with card list layout"
```

---

## Task 8: Redesign Báo Cáo (Single Screen)

**Files:**
- Modify: `app/admin/reports/page.tsx:1-292`

- [ ] **Step 1: Write complete reports page redesign**

```tsx
// app/admin/reports/page.tsx
"use client"

import { useState } from "react"
import * as XLSX from "xlsx"

interface ReportRow {
  stt: number
  name: string
  phone: string
  date: string
}

const mockEmployees = [
  { id: "1", name: "Nguyễn Văn A", phone: "0912345678" },
  { id: "2", name: "Trần Thị B", phone: "0912345679" },
  { id: "3", name: "Lê Văn C", phone: "0912345680" },
]

function generateReportData(type: "day" | "week" | "month"): ReportRow[] {
  const result: ReportRow[] = []
  let stt = 1
  mockEmployees.forEach((emp) => {
    result.push({
      stt: stt++,
      name: emp.name,
      phone: emp.phone,
      date: type === "day" ? "12/5" : type === "week" ? "11-15/5" : "Tháng 5",
    })
  })
  return result
}

export default function ReportsPage() {
  const [reportType, setReportType] = useState<"day" | "week" | "month">("day")
  const [previewData, setPreviewData] = useState<ReportRow[]>([])
  const [hasPreview, setHasPreview] = useState(false)

  const handlePreview = () => {
    const data = generateReportData(reportType)
    setPreviewData(data)
    setHasPreview(true)
  }

  const handleExport = () => {
    if (previewData.length === 0) return
    const ws = XLSX.utils.json_to_sheet(previewData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "BaoCom Report")
    XLSX.writeFile(wb, `BAOCOM_Report_${new Date().toISOString().split("T")[0]}.xlsx`)
  }

  const todayStr = new Date().toISOString().split("T")[0]

  return (
    <div className="min-h-dvh bg-canvas pb-12">
      {/* Page Header */}
      <header className="pt-8 pb-6 px-6">
        <div className="max-w-[900px] mx-auto">
          <p className="text-[14px] text-ink-muted-48 mb-1">Báo cáo</p>
          <h1 className="text-[34px] font-semibold tracking-tight text-ink" style={{ letterSpacing: "-0.0374em" }}>
            Xuất Báo Cáo
          </h1>
          <p className="text-[17px] text-ink-muted-80 mt-1">Tạo báo cáo suất ăn cho bếp nấu</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6">
        <div className="max-w-[900px] mx-auto space-y-5">
          {/* Report Type Selector */}
          <div className="flex gap-2 p-1.5 rounded-full bg-surface-container-low">
            {[
              { id: "day" as const, label: "Theo ngày" },
              { id: "week" as const, label: "Theo tuần" },
              { id: "month" as const, label: "Theo tháng" },
            ].map((type) => (
              <button
                key={type.id}
                onClick={() => { setReportType(type.id); setHasPreview(false) }}
                className={`flex-1 h-10 rounded-full text-[14px] font-medium transition-all ${
                  reportType === type.id
                    ? "bg-primary text-on-primary"
                    : "text-ink-muted-80"
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>

          {/* Date Selector */}
          <div className="p-4 rounded-[18px] bg-surface-container-low flex flex-wrap items-center gap-3">
            <label className="text-[14px] font-medium text-ink-muted-80">Ngày:</label>
            <input type="date" max={todayStr} className="form-input h-11 w-auto" />
            <button
              onClick={handlePreview}
              className="h-11 px-5 rounded-full bg-primary text-on-primary text-[14px] font-medium active:scale-95 transition-transform flex items-center gap-2 ml-auto"
            >
              <span className="material-symbols-outlined">preview</span>
              Xem trước
            </button>
          </div>

          {/* Preview Section */}
          {hasPreview && (
            <div className="space-y-4">
              {/* Stats */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[40px] font-semibold text-ink">{previewData.length}</span>
                  <span className="text-[17px] text-ink-muted-80">suất ăn</span>
                </div>
                <button
                  onClick={handleExport}
                  className="h-11 px-5 rounded-full bg-success text-on-primary text-[14px] font-medium active:scale-95 transition-transform flex items-center gap-2"
                >
                  <span className="material-symbols-outlined">download</span>
                  Tải Excel
                </button>
              </div>

              {/* Table Preview */}
              <div className="rounded-[18px] bg-canvas border border-hairline overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-surface-container-low border-b border-hairline">
                      <th className="text-left py-3 px-4 text-[12px] font-semibold uppercase tracking-wider text-ink-muted-80">STT</th>
                      <th className="text-left py-3 px-4 text-[12px] font-semibold uppercase tracking-wider text-ink-muted-80">Họ tên</th>
                      <th className="text-left py-3 px-4 text-[12px] font-semibold uppercase tracking-wider text-ink-muted-80">SĐT</th>
                      <th className="text-left py-3 px-4 text-[12px] font-semibold uppercase tracking-wider text-ink-muted-80">Ngày</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hairline">
                    {previewData.map((row) => (
                      <tr key={row.stt} className="hover:bg-surface-container-low">
                        <td className="py-3 px-4 text-[14px] text-ink-muted-80">{row.stt}</td>
                        <td className="py-3 px-4 text-[14px] font-medium text-ink">{row.name}</td>
                        <td className="py-3 px-4 text-[14px] text-ink-muted-80">{row.phone}</td>
                        <td className="py-3 px-4 text-[14px] text-ink-muted-80">{row.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Test reports page**

Verify tabs work, preview generates, export downloads.

- [ ] **Step 3: Commit**

```bash
git add app/admin/reports/page.tsx
git commit -m "feat: redesign Báo Cáo with single screen layout"
```

---

## Verification

After all tasks complete, verify:

1. **All 8 screens** have been redesigned with consistent Apple styling
2. **Hamburger + Drawer** navigation works on both admin and employee layouts
3. **Touch targets** are minimum 44px
4. **Pill buttons** used for primary CTAs
5. **Action Blue (#0066cc)** used for all interactive elements
6. **No horizontal scroll** on mobile - vertical scroll only

---

**Plan complete.** Two execution options:

1. **Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

2. **Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**