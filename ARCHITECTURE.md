# Project Architecture

## Overview

Dự án sử dụng **Next.js 14+ App Router** với TypeScript. Cấu trúc tổ chức theo nguyên tắc route groups và modular API.

## Directory Structure

```
.
├── app/                          # App Router (Next.js 13+)
│   ├── (admin)/                  # Route group: Admin
│   │   └── dashboard/
│   │       └── page.tsx          # → /admin/dashboard
│   ├── (auth)/                   # Route group: Auth
│   │   └── login/
│   │       └── page.tsx          # → /login
│   ├── (employee)/               # Route group: Employee
│   │   └── book/
│   │       └── page.tsx          # → /book
│   ├── api/                      # API Routes (Backend)
│   │   ├── auth/route.ts         # → POST /api/auth
│   │   ├── bookings/route.ts     # → GET/POST /api/bookings
│   │   ├── holidays/route.ts     # → GET/POST /api/holidays
│   │   ├── meals/route.ts        # → GET/POST /api/meals
│   │   └── users/route.ts        # → GET/POST /api/users
│   ├── globals.css               # Global styles
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # → /
│   └── favicon.ico
├── public/                       # Static assets
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
├── AGENTS.md                    # Agent instructions
├── CLAUDE.md                    # Project instructions
├── README.md                    # Project documentation
└── Configuration files
    ├── next.config.ts
    ├── tsconfig.json
    ├── postcss.config.mjs
    ├── eslint.config.mjs
    ├── next-env.d.ts
    └── package.json
```
