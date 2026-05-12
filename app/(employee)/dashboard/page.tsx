"use client"

import { useState } from "react"

interface DailyMenu {
  day: string
  date: string
  dishes: {
    main: string
    vegetables: string[]
    dessert: string
  }
  registered: boolean
}

const weeklyMenu: DailyMenu[] = [
  {
    day: "Thứ Hai",
    date: "11/5",
    dishes: {
      main: "Thịt kho tàu",
      vegetables: ["Cải xào", "Su su luộc"],
      dessert: "Chuối",
    },
    registered: true,
  },
  {
    day: "Thứ Ba",
    date: "12/5",
    dishes: {
      main: "Chả lá lốt",
      vegetables: ["Thịt gà rang", "Đỗ quả xào"],
      dessert: "Dưa hấu",
    },
    registered: true,
  },
  {
    day: "Thứ Tư",
    date: "13/5",
    dishes: {
      main: "Cá kho tộ",
      vegetables: ["Rau muống luộc", "Đậu phụ nhồi thịt"],
      dessert: "Nước ép cam",
    },
    registered: false,
  },
  {
    day: "Thứ Năm",
    date: "14/5",
    dishes: {
      main: "Gà nướng đất sét",
      vegetables: ["Cà rốt xào", "Bông cải hấp"],
      dessert: "Kem vani",
    },
    registered: false,
  },
  {
    day: "Thứ Sáu",
    date: "15/5",
    dishes: {
      main: "Bún chả Hà Nội",
      vegetables: ["Đu đủ luộc", "Rau mùi"],
      dessert: "Chè đậu đỏ",
    },
    registered: false,
  },
]

export default function EmployeeDashboard() {
  const [selectedDayIndex, setSelectedDayIndex] = useState(0)
  const [registrations, setRegistrations] = useState<boolean[]>(
    weeklyMenu.map((day) => day.registered)
  )

  const currentDay = weeklyMenu[selectedDayIndex]
  const isRegistered = registrations[selectedDayIndex]

  const toggleRegistration = () => {
    const newRegistrations = [...registrations]
    newRegistrations[selectedDayIndex] = !newRegistrations[selectedDayIndex]
    setRegistrations(newRegistrations)
  }

  return (
    <div className="min-h-dvh bg-canvas pb-12">
      {/* Page Header */}
      <header className="pt-10 pb-6 px-6 lg:px-10">
        <div className="max-w-[900px] mx-auto">
          <p className="text-sm text-ink-muted-80 mb-1">Tuần này</p>
          <h1 className="text-3xl font-semibold tracking-tight text-ink">Thực Đơn Tuần này</h1>
        </div>
      </header>

      {/* Day Selector - Horizontal Scroll */}
      <div className="px-6 lg:px-10 mb-6">
        <div className="max-w-[900px] mx-auto">
          <div className="flex gap-3 overflow-x-auto scroll-snap-x-mandatory snap-mandatory pb-2 -mx-2 px-2">
            {weeklyMenu.map((day, index) => (
              <button
                key={day.day}
                onClick={() => setSelectedDayIndex(index)}
                className={`shrink-0 px-5 py-2.5 rounded-full text-sm font-semibold transition-all snap-start ${
                  selectedDayIndex === index
                    ? "bg-primary text-on-primary"
                    : "bg-surface-container text-ink-muted-80 hover:bg-surface-container-hover"
                }`}
              >
                {day.day.replace("Thứ ", "")}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content - Full Width Card */}
      <main className="px-6 lg:px-10">
        <div className="max-w-[900px] mx-auto">
          <div className="rounded-[18px] overflow-hidden border border-hairline bg-surface">
            {/* Date Header */}
            <div className="px-5 py-4 border-b border-hairline bg-surface-container">
              <div className="flex items-center justify-between">
                <h2 className="text-[21px] font-semibold text-ink">
                  {currentDay.day}, {currentDay.date}
                </h2>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    isRegistered
                      ? "bg-success-bg text-success"
                      : "bg-warning-bg text-warning"
                  }`}
                >
                  {isRegistered ? "Đã đăng ký" : "Chưa đăng ký"}
                </span>
              </div>
            </div>

            {/* Menu Sections */}
            <div className="p-5 space-y-5">
              {/* Món chính */}
              <div>
                <p className="text-[12px] uppercase tracking-wider text-ink-muted-60 mb-2 font-medium">
                  Món chính
                </p>
                <div className="px-4 py-3 rounded-xl bg-surface-container">
                  <p className="text-sm font-medium text-ink">{currentDay.dishes.main}</p>
                </div>
              </div>

              {/* Món rau */}
              <div>
                <p className="text-[12px] uppercase tracking-wider text-ink-muted-60 mb-2 font-medium">
                  Món rau
                </p>
                <div className="space-y-2">
                  {currentDay.dishes.vegetables.map((veg, idx) => (
                    <div key={idx} className="px-4 py-3 rounded-xl bg-surface-container">
                      <p className="text-sm font-medium text-ink">{veg}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tráng miệng */}
              <div>
                <p className="text-[12px] uppercase tracking-wider text-ink-muted-60 mb-2 font-medium">
                  Tráng miệng
                </p>
                <div className="px-4 py-3 rounded-xl bg-surface-container">
                  <p className="text-sm font-medium text-ink">{currentDay.dishes.dessert}</p>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="p-5 pt-0">
              <button
                onClick={toggleRegistration}
                className={`w-full py-3 rounded-full text-sm font-semibold transition-all press-effect flex items-center justify-center gap-2 ${
                  isRegistered
                    ? "bg-error-bg text-error hover:bg-error-bg-hover"
                    : "bg-primary text-on-primary hover:bg-primary-hover"
                }`}
              >
                <span className="material-symbols-outlined">
                  {isRegistered ? "event_busy" : "check_circle"}
                </span>
                {isRegistered ? "Hủy đăng ký" : "Đăng ký ăn"}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}