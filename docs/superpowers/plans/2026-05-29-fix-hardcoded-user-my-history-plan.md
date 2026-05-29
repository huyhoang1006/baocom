# Fix Hardcoded User in Employee History Page Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thay thế hardcoded mockUser bằng real user từ authApi.me() trong trang my-history

**Architecture:** Sử dụng pattern giống layout - gọi authApi.me() để lấy user thật từ server

**Tech Stack:** Next.js, React, TypeScript, authApi

---

## Task 1: Thay thế hardcoded mockUser bằng real user từ API

**Files:**
- Modify: `app/(employee)/my-history/page.tsx:41-44` và `:143`

- [ ] **Step 1: Đọc file hiện tại để hiểu context**

Run: `head -60 app/(employee)/my-history/page.tsx`

- [ ] **Step 2: Thay thế hardcoded mockUser bằng useState với null và fetch từ API**

Thay:
```typescript
const [mockUser] = useState({
  username: "hungpx",
  fullName: "Phạm Xuân Hùng",
})
```

Bằng:
```typescript
const [user, setUser] = useState<{ username: string; fullName: string } | null>(null)

useEffect(() => {
  const fetchUser = async () => {
    try {
      const { user: userData } = await authApi.me()
      setUser({
        username: userData.username,
        fullName: userData.name,
      })
    } catch (err) {
      console.error('Failed to fetch user:', err)
    }
  }
  fetchUser()
}, [])
```

- [ ] **Step 3: Cập nhật dòng hiển thị greeting**

Thay:
```typescript
Xin chào, <span className="font-semibold text-ink">{mockUser.fullName}</span>
```

Bằng:
```typescript
Xin chào, <span className="font-semibold text-ink">{user?.fullName || '...'}</span>
```

- [ ] **Step 4: Import authApi**

Thêm import:
```typescript
import { authApi } from "@/lib/api"
```

- [ ] **Step 5: Commit**

```bash
git add app/(employee)/my-history/page.tsx
git commit -m "fix: replace hardcoded user with real user from API in my-history page"
```

---

## Execution Options

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**