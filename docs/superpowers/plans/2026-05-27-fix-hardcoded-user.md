# Fix Hardcoded User in Employee Layout

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace hardcoded mockUser in `app\(employee)\layout.tsx` with real user data from `authApi.me()`

**Architecture:** EmployeeLayout fetches user from `/api/auth/me` on mount, stores in React state, passes to EmployeeSidebar. Loading/error states handled gracefully.

**Tech Stack:** Next.js App Router, React hooks (useState, useEffect), authApi from `@/lib/api`

---

## File Structure

- Modify: `app\(employee)\layout.tsx` - fetch real user, manage loading state
- Modify: `app\components\sidebar\EmployeeSidebar.tsx` - props unchanged (already accepts username/fullName)

---

## Task 1: Update EmployeeLayout to Fetch Real User

**Files:**
- Modify: `app\(employee)\layout.tsx:1-79`

- [ ] **Step 1: Modify layout to use authApi.me() with loading state**

Replace lines 21-34 with:

```tsx
const [user, setUser] = useState<{ username: string; fullName: string } | null>(null)
const [loading, setLoading] = useState(true)

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
      // Redirect to login on auth failure
      window.location.href = '/login'
    } finally {
      setLoading(false)
    }
  }
  fetchUser()
}, [])
```

- [ ] **Step 2: Pass user to EmployeeSidebar**

Replace the EmployeeSidebar renders (lines 29-33 and 67-70) with:

```tsx
{!loading && user && (
  <EmployeeSidebar
    username={user.username}
    fullName={user.fullName}
  />
)}
```

And pass `user` to MobileSidebar's EmployeeSidebar too.

- [ ] **Step 3: Add loading placeholder for sidebar**

Add a loading skeleton inside the sidebar area while user data is being fetched, or ensure the sidebar gracefully handles null user.

- [ ] **Step 4: Commit**

```bash
git add app\(employee)\layout.tsx
git commit -m "fix: fetch real user instead of hardcoded mockUser in employee layout"
```

---

## Task 2: Verify Fix with Multiple Accounts

**Files:**
- None (manual verification)

- [ ] **Step 1: Test with different login accounts**

1. Login as user A (e.g., "minhtt") → verify sidebar shows "minhtt" name and initials
2. Logout → login as user B (e.g., "hungpx") → verify sidebar shows "hungpx" name and initials
3. Verify each user sees their OWN name, not always "Phạm Xuân Hùng"

---

**Plan complete.** Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**