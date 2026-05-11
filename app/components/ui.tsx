"use client"

import { useState } from "react"
import Link from "next/link"

/* ==========================================
 * BAOCOM UI COMPONENTS
 * Based on: DESIGN.md (Apple-inspired)
 * Single Action Blue accent (#0066cc)
 * SF Pro Display / SF Pro Text typography rhythm
 * ========================================== */

interface NavbarProps {
  brand?: string
  brandIcon?: "restaurant" | "restaurant_menu"
  currentPath?: string
  showNavItems?: boolean
}

const navItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Register", href: "/book" },
  { label: "History", href: "/history" },
  { label: "Profile", href: "/profile" },
]

export function Navbar({
  brand = "BaoCom",
  brandIcon = "restaurant",
  currentPath = "/dashboard",
  showNavItems = true,
}: NavbarProps) {
  const [notifications] = useState(3)

  return (
    <nav
      className="w-full fixed top-0 z-50"
      style={{
        backgroundColor: "var(--color-surface-black)",
        height: "64px",
        borderBottom: "1px solid var(--color-ink-muted-80)",
      }}
    >
      <div
        className="flex justify-between items-center w-full px-6 lg:px-8"
        style={{
          maxWidth: "1440px",
          margin: "0 auto",
          height: "100%",
        }}
      >
        {/* Brand */}
        <div
          className="text-xl font-semibold flex items-center gap-2"
          style={{ color: "var(--color-body-on-dark)" }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            {brandIcon}
          </span>
          <span>{brand}</span>
        </div>

        {/* Navigation Links (Desktop) */}
        {showNavItems && (
          <div className="hidden md:flex items-center h-full gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                className="h-full flex items-center pb-1 transition-colors"
                style={{
                  color:
                    currentPath === item.href
                      ? "var(--color-body-on-dark)"
                      : "var(--color-body-muted)",
                  fontWeight: currentPath === item.href ? 600 : 400,
                  borderBottom:
                    currentPath === item.href
                      ? "2px solid var(--color-primary)"
                      : "2px solid transparent",
                }}
              >
                {item.label}
              </Link>
            ))}
          </div>
        )}

        {/* Trailing Icons */}
        <div className="flex items-center gap-3" style={{ color: "var(--color-body-on-dark)" }}>
          <button
            className="relative p-2 rounded-full transition-colors"
            aria-label="Notifications"
            style={{ backgroundColor: "transparent" }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--color-ink-muted-80)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            <span className="material-symbols-outlined">notifications</span>
            {notifications > 0 && (
              <span
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                style={{
                  backgroundColor: "var(--color-primary)",
                  color: "var(--color-on-primary)",
                }}
              >
                {notifications}
              </span>
            )}
          </button>
          <button
            className="p-2 rounded-full transition-colors"
            aria-label="Help"
            style={{ backgroundColor: "transparent" }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--color-ink-muted-80)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            <span className="material-symbols-outlined">help_outline</span>
          </button>
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm"
            style={{
              backgroundColor: "var(--color-ink-muted-80)",
              color: "var(--color-body-on-dark)",
            }}
          >
            AD
          </div>
        </div>
      </div>
    </nav>
  )
}

interface FooterProps {
  brand?: string
  links?: { label: string; href: string }[]
  copyright?: string
}

export function Footer({
  brand = "BaoCom",
  links = [
    { label: "Trung tâm hỗ trợ", href: "#" },
    { label: "Chính sách bảo mật", href: "#" },
    { label: "Điều khoản dịch vụ", href: "#" },
    { label: "Thông tin dinh dưỡng", href: "#" },
  ],
  copyright = "© 2024 Hệ thống Báo Cơm. Mọi quyền được bảo lưu.",
}: FooterProps) {
  return (
    <footer
      className="w-full mt-auto py-6 px-6 lg:px-8"
      style={{
        backgroundColor: "var(--color-canvas-parchment)",
        borderTop: "1px solid var(--color-hairline)",
      }}
    >
      <div
        className="w-full flex flex-col md:flex-row justify-between items-center gap-4"
        style={{
          maxWidth: "1440px",
          margin: "0 auto",
        }}
      >
        <span
          className="text-sm font-semibold"
          style={{ color: "var(--color-ink-muted-80)" }}
        >
          {brand}
        </span>
        <div className="flex gap-6">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm transition-all hover:underline"
              style={{ color: "var(--color-ink-muted-48)" }}
            >
              {link.label}
            </a>
          ))}
        </div>
        <span className="text-sm" style={{ color: "var(--color-ink-muted-48)" }}>
          {copyright}
        </span>
      </div>
    </footer>
  )
}

interface StatusBadgeProps {
  status: "registered" | "not-eating" | "pending" | "custom"
  label: string
  icon?: "check" | "close" | "warning" | "edit" | "lock" | "add_circle" | "notification_important"
}

export function StatusBadge({ status, label, icon = "check" }: StatusBadgeProps) {
  const statusStyles = {
    registered: {
      background: "var(--color-primary)",
      color: "var(--color-on-primary)",
    },
    "not-eating": {
      background: "var(--color-surface-container)",
      color: "var(--color-ink-muted-80)",
    },
    pending: {
      background: "var(--color-primary)",
      color: "var(--color-on-primary)",
    },
    custom: {
      background: "var(--color-surface-container)",
      color: "var(--color-ink-muted-80)",
    },
  }

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wide"
      style={statusStyles[status]}
    >
      <span className="material-symbols-outlined text-sm">{icon}</span>
      {label}
    </span>
  )
}

interface AvatarProps {
  initials: string
  size?: "sm" | "md" | "lg"
  variant?: "default" | "error" | "primary"
}

export function Avatar({
  initials,
  size = "md",
  variant = "default",
}: AvatarProps) {
  const sizes = {
    sm: "w-6 h-6 text-xs",
    md: "w-8 h-8 text-sm",
    lg: "w-12 h-12 text-base",
  }

  const variants = {
    default: {
      background: "var(--color-surface-container)",
      color: "var(--color-ink-muted-80)",
    },
    error: {
      background: "var(--color-primary)",
      color: "var(--color-on-primary)",
    },
    primary: {
      background: "var(--color-primary)",
      color: "var(--color-on-primary)",
    },
  }

  return (
    <div
      className={`${sizes[size]} rounded-full flex items-center justify-center font-bold`}
      style={variants[variant]}
    >
      {initials}
    </div>
  )
}

interface CardProps {
  children: React.ReactNode
  className?: string
  variant?: "default" | "highlighted" | "error"
}

export function Card({ children, className = "", variant = "default" }: CardProps) {
  const variants = {
    default: "border border-hairline",
    highlighted: "border-2 border-primary",
    error: "border-2 border-primary",
  }

  return (
    <div
      className={`rounded-[18px] p-6 ${variants[variant]} ${className}`}
      style={{ backgroundColor: "var(--color-surface-container-lowest)" }}
    >
      {children}
    </div>
  )
}

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: string
  variant?: "success" | "neutral" | "error"
  highlight?: boolean
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  variant = "neutral",
  highlight = false,
}: StatCardProps) {
  const variants = {
    success: {
      background: "var(--color-success-bg)",
      color: "var(--color-success)",
    },
    neutral: {
      background: "var(--color-surface-container-lowest)",
      color: "var(--color-ink)",
    },
    error: {
      background: "var(--color-surface-container-lowest)",
      color: "var(--color-error)",
    },
  }

  return (
    <div
      className="rounded-[18px] p-6 flex flex-col justify-between h-full relative overflow-hidden"
      style={{
        ...variants[variant],
        border: "1px solid var(--color-hairline)",
      }}
    >
      <div className="flex justify-between items-start mb-4 relative z-10">
        <h3 className="text-lg font-medium" style={{ color: "inherit" }}>
          {title}
        </h3>
        {icon && (
          <span className="material-symbols-outlined" style={{ color: "inherit" }}>
            {icon}
          </span>
        )}
      </div>
      <div className="relative z-10">
        <span className="text-4xl font-bold block" style={{ color: "inherit" }}>
          {value}
        </span>
        {subtitle && (
          <span
            className="text-sm"
            style={{
              color: "inherit",
              opacity: highlight ? 1 : 0.8,
            }}
          >
            {subtitle}
          </span>
        )}
      </div>
    </div>
  )
}

interface IconButtonProps {
  icon: string
  label: string
  onClick?: () => void
  variant?: "default" | "primary" | "error"
}

export function IconButton({
  icon,
  label,
  onClick,
  variant = "default",
}: IconButtonProps) {
  const variants = {
    default: "hover:text-primary",
    primary: "text-primary hover:text-primary-focus",
    error: "text-primary hover:text-primary-focus",
  }

  return (
    <button
      className={`transition-colors ${variants[variant]}`}
      onClick={onClick}
      aria-label={label}
      title={label}
    >
      <span className="material-symbols-outlined">{icon}</span>
    </button>
  )
}
