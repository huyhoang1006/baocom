"use client"

import { useState } from "react"

interface MenuItem {
  id: string
  name: string
  description: string
  image: string
  calories?: number
  protein?: number
  tags: { label: string; variant: "default" | "highlight" }[]
  isMainDish?: boolean
}

export default function EmployeeDashboard() {
  const [isEditing, setIsEditing] = useState(false)

  const menuItems: MenuItem[] = [
    {
      id: "1",
      name: "Phở Bò Thập Cẩm",
      description: "Nước dùng hầm xương 12 tiếng, bánh phở tươi, thịt bò tái lăn, nạm, gầu, bò viên. Kèm rau thơm tươi sạch.",
      image: "https://images.unsplash.com/photo-1582878826629-29b7adf7f8e2?w=400&h=300&fit=crop",
      calories: 450,
      protein: 30,
      tags: [{ label: "ÍT BÉO", variant: "highlight" }],
      isMainDish: true,
    },
    {
      id: "2",
      name: "Cơm Tấm Sườn Nướng",
      description: "Sườn cốt lết ướp đậm đà nướng than hoa, ăn kèm cơm tấm dẻo và chả trứng.",
      image: "https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=400&h=300&fit=crop",
      calories: 520,
      tags: [{ label: "520 kcal", variant: "default" }],
    },
    {
      id: "3",
      name: "Salad Ức Gà Nướng",
      description: "Rau xà lách hỗn hợp, cà chua bi, dưa leo, ức gà áp chảo sốt chanh dây.",
      image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop",
      calories: 320,
      tags: [
        { label: "Lành mạnh", variant: "highlight" },
        { label: "320 kcal", variant: "default" },
      ],
    },
  ]

  return (
    <div className="min-h-dvh bg-canvas pb-12">
      {/* Page Header */}
      <header className="pt-10 pb-6 px-6 lg:px-10">
        <div className="max-w-[900px] mx-auto flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <p className="text-sm text-ink-muted-80 mb-1">Thực đơn</p>
            <h1 className="text-3xl font-semibold tracking-tight text-ink">Thực Đơn Hôm Nay</h1>
            <p className="text-sm text-ink-muted-80 mt-1">Thứ Năm, 15 tháng 5, 2025</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-container border border-hairline text-sm">
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
            <span className="font-medium text-ink">Đã đăng ký</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 lg:px-10">
        <div className="max-w-[900px] mx-auto">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-5">
              {/* Main Dish */}
              <div className="rounded-2xl overflow-hidden border border-hairline">
                <div className="h-40 sm:h-56 w-full relative">
                  <img
                    alt={menuItems[0].name}
                    className="w-full h-full object-cover"
                    src="https://images.unsplash.com/photo-1582878826629-29b7adf7f8e2?w=800&h=400&fit=crop"
                  />
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-bold bg-primary text-white">
                    Món Chính
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <h2 className="text-lg font-semibold text-ink">{menuItems[0].name}</h2>
                    <span className="px-2 py-0.5 rounded-lg text-xs font-semibold bg-warm-accent-bg text-warm-accent">ÍT BÉO</span>
                  </div>
                  <p className="text-sm text-ink-muted-80 mb-3">{menuItems[0].description}</p>
                  <div className="flex gap-2">
                    <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-surface-container text-ink-muted-80">
                      <span className="material-symbols-outlined text-sm">local_fire_department</span>
                      450 kcal
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-surface-container text-ink-muted-80">
                      <span className="material-symbols-outlined text-sm">egg_alt</span>
                      30g Protein
                    </span>
                  </div>
                </div>
              </div>

              {/* Secondary Options */}
              <div className="grid md:grid-cols-2 gap-4">
                {menuItems.slice(1).map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl overflow-hidden border border-hairline flex"
                  >
                    <div className="w-32 h-full shrink-0">
                      <img alt={item.name} className="w-full h-full object-cover" src={item.image} loading="lazy" />
                    </div>
                    <div className="p-4 flex flex-col justify-center">
                      <h3 className="text-sm font-semibold text-ink mb-1">{item.name}</h3>
                      <p className="text-xs text-ink-muted-80 mb-2 line-clamp-2">{item.description}</p>
                      <span className="text-xs px-2 py-0.5 rounded-lg bg-surface-container text-ink-muted-80 w-fit">{item.tags[0].label}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Chef's Message */}
              <div className="rounded-2xl p-5 bg-warm-cream border border-hairline">
                <h3 className="text-sm font-semibold text-ink mb-2">Lời nhắn từ Cô Bếp</h3>
                <p className="text-sm italic text-ink-muted-80 leading-relaxed">
                  "Chào các bạn, hôm nay trời se lạnh, bếp hầm xương 12 tiếng cho bữa trưa thật ấm áp. Chúc mọi người ngon miệng!"
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-xl bg-warm-accent-bg border border-hairline">
                  <p className="text-xs font-medium text-warm-accent mb-1">Calories</p>
                  <span className="text-xl font-bold text-ink">450</span>
                  <p className="text-xs text-ink-muted-48">/ 600 kcal</p>
                </div>
                <div className="p-4 rounded-xl bg-nutrition-bg border border-hairline">
                  <p className="text-xs font-medium text-nutrition mb-1">Protein</p>
                  <span className="text-xl font-bold text-ink">30g</span>
                  <p className="text-xs text-ink-muted-48">/ 60g</p>
                </div>
              </div>

              {/* Action */}
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="w-full py-3 rounded-full text-sm font-semibold text-white bg-primary hover:bg-primary-hover transition-all press-effect flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">edit_calendar</span>
                Đổi món ăn
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}