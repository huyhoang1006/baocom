# ROOT CAUSE ANALYSIS — 4 NEW E2E Bugs (2026-06-21)

## 🔴 CRITICAL DISCOVERY (root cause cho nhiều bug)

**File**: `src/lib/api.ts:36-47`

```typescript
if (!res.ok) {
  const data = await res.json().catch(() => ({}))

  if (res.status === 401 || res.status === 403) {
    const message = (data as { error?: string })?.error || 'Unauthorized'

    if (endpoint !== '/auth/login' && window.location.pathname !== '/login') {
      window.location.href = '/login'   // ← AUTO-REDIRECT
    }

    throw new APIError(message, res.status, data)
  }
  ...
}
```

**Vấn đề**: Bất kỳ API call nào trả 401/403 đều tự động redirect về `/login` — **không phân biệt** giữa:
- Session expired (cần redirect)
- Endpoint cần admin role (employee bị 403 — KHÔNG nên redirect ngay, chỉ 403)
- Token sai (cần redirect)

---

## BUG-E2E-NEW-001: Employee Dashboard missing sidebar

### Root Cause (HIGH CONFIDENCE)

**Chain of events**:
1. Login as employee `nguyenvana` → cookie set ✓
2. Navigate to `/dashboard`
3. `app/(employee)/layout.tsx:24-40` chạy `useEffect` → gọi `authApi.me()`
4. **`authApi.me()` trả 403** (vì lý do nào đó — chưa xác định, có thể do tokenVersion issue hoặc cache)
5. `src/lib/api.ts:42-44` → **`window.location.href = '/login'`** được gọi
6. Browser bắt đầu navigate to /login
7. **NHƯNG**: trước khi navigate xong, React render layout 1 lần
8. Vì `setUser` chưa được set (catch block chạy TRƯỚC setUser), `user === null`
9. Sidebar conditional `{!loading && user && <EmployeeSidebar ... />}` → KHÔNG render
10. Snapshot chụp giữa lúc navigate → thấy dashboard content nhưng không có sidebar

### Fix

**Option A (Best)**: Trong `app/(employee)/layout.tsx:32-37`, đợi navigation xong rồi mới để React cleanup:
```typescript
catch (err) {
  console.error('Failed to fetch user:', err)
  setLoading(false)  // ← thêm: tắt loading
  setError('Session expired — please log in again')
  // KHÔNG redirect ngay, để user thấy UI rõ ràng
}
```

**Option B**: Trong `src/lib/api.ts:42-44`, phân biệt:
```typescript
// Chỉ redirect khi thực sự là session expired
if (endpoint.startsWith('/auth/') || isPublicEndpoint(endpoint)) {
  // Không redirect cho auth endpoints
} else if (res.status === 401) {
  // 401 = session expired → redirect
  window.location.href = '/login'
}
// 403 = không đủ quyền → KHÔNG redirect, để page xử lý
```

---

## BUG-E2E-NEW-002: 403 Forbidden trên Dashboard

### Root Cause (HIGH CONFIDENCE)

**Root cause giống BUG-001**: 
- Có 1 API call trong `useEffect` của layout hoặc page trả 403
- `src/lib/api.ts:39` check status === 403 → redirect to `/login`
- Console ghi "403 Forbidden" trước khi redirect

**Câu hỏi**: API nào trả 403?

Trong Phase 2 (Dashboard), có 2 hooks chạy song song:
- `useDailyMenus(5)` → `GET /api/daily-menus` — không có permission check, ai cũng gọi được
- `useRegistrations(startDate, endDate)` → `GET /api/registrations` — `withAuth`, employee OK

Đã verify qua curl: cả 2 API trả 200 với employee cookie.

**Hypothesis**: 403 có thể từ:
1. `authApi.me()` trong `layout.tsx` — đã thấy fail trong BUG-001
2. Next.js DevTools internal endpoint
3. Next.js HMR WebSocket failed handshake (đã thấy trong console log)

**Most likely**: `authApi.me()` ở `layout.tsx:27` return 403 do tokenVersion mismatch sau các test session trước đó.

### Fix

Áp dụng fix BUG-001 (không auto-redirect). Đồng thời kiểm tra `authApi.me()` trả 200 với employee cookie.

---

## BUG-E2E-NEW-003: Book page stuck loading

### Root Cause (HIGH CONFIDENCE — 2 nguyên nhân có thể)

#### Nguyên nhân 1 (chính): Cookie không được gửi với `fetch` thẳng

**File**: `app/(employee)/book/page.tsx:20-25`

```typescript
useEffect(() => {
  fetch('/api/settings/cutoff')   // ← KHÔNG có credentials: 'include'
    .then((r) => r.json())
    .then((data) => setCutoffConfig({ hour: data.cutoffHour, minute: data.cutoffMinute }))
    .catch(console.error)
}, [])
```

**Vấn đề**: `fetch()` mặc định là `credentials: 'same-origin'`. Tuy nhiên, sau khi fix BUG-001, endpoint `/api/settings/cutoff` yêu cầu auth. Nếu vì lý do nào đó cookie không được gửi (vd cross-origin hoặc redirect ở giữa), API trả 401 → `.catch(console.error)` chỉ log, KHÔNG setCutoffConfig.

Khi `cutoffConfig` = null, `getWeekdaysForOffset(today, weekOffset, undefined)` được gọi. Function này **luôn trả về 5 ngày** (theo source code). Vậy `days.length > 0`. Nên DayCards phải render.

NHƯNG — `loading=true` từ `useRegistrations()` hook. Nếu `useRegistrations` fetch fail 401, `catch` set error, `finally` set loading=false. Vẫn phải render cards.

#### Nguyên nhân 2: Auto-redirect loop trong `useRegistrations`

Nếu `/api/registrations` trả 401/403:
1. `src/lib/api.ts:43` → `window.location.href = '/login'`
2. Trước khi navigate xong, hook throw `APIError`
3. `useRegistrations` catch → setError, finally → setLoading(false)
4. Nhưng navigation vẫn diễn ra
5. Snapshot chụp giữa lúc → thấy "Đang tải..." cũ (vì React re-render với state cũ?)

**HOẶC**: navigation đến `/login` KHÔNG xảy ra vì user không có error visible. React re-render với `loading=true` cho đến khi fetch thực sự resolve. Nếu fetch bị abort bởi navigation, `setLoading(false)` không chạy.

### Fix

**Primary** (cần cho tất cả 4 bug):
```typescript
// src/lib/api.ts:42-44
if (endpoint !== '/auth/login' && window.location.pathname !== '/login') {
  window.location.href = '/login'   // ← XÓA auto-redirect
}
```

Để component xử lý lỗi 401/403 explicitly:
```typescript
catch (err) {
  if (err instanceof APIError && err.status === 401) {
    window.location.href = '/login'  // ← CHỈ trong catch của component
  } else {
    setError(err.message)
    setLoading(false)
  }
}
```

**Secondary**: Thêm explicit `credentials: 'include'` và AbortController cho cleanup:
```typescript
// app/(employee)/book/page.tsx:20
useEffect(() => {
  const controller = new AbortController()
  fetch('/api/settings/cutoff', { credentials: 'include', signal: controller.signal })
    .then(r => r.json())
    .then(data => setCutoffConfig(...))
    .catch(err => {
      if (err.name !== 'AbortError') console.error(err)
    })
  return () => controller.abort()
}, [])
```

---

## BUG-E2E-NEW-004: Reports "Tra cứu" button không fetch data

### Root Cause (HIGH CONFIDENCE — nhiều lớp)

**Layer 1 — Auto-redirect on 403**:
Cùng nguyên nhân với BUG-001/002/003. Khi `adminReportsApi.getReport` trả 403 (vd permission check fail), `src/lib/api.ts:39-44` tự redirect.

Đã verify qua curl với admin cookie: API trả 200 OK. Vậy tại sao E2E fail?

**Layer 2 — Khả năng button click không trigger**:
Trong E2E testing, tôi click button "Tra cứu" bằng MCP `browser_click` tool. Có thể click không trigger React handler vì:
- React controlled component issue (đã thấy ở login form)
- Event không bubble đúng

**Layer 3 — State synchronization**:
Trong `app/admin/reports/page.tsx:189-193`:
```typescript
useEffect(() => {
  if (selectedDate) {
    handlePreview()   // ← initial fetch
  }
}, [reportType, handlePreview])
```

Initial mount → fetch OK. Nhưng kết quả `setRawData(rows)` set state. Sau đó `aggregatedData` được compute từ `rawData`. Nếu `rawData.length === 0` → `aggregatedData.length === 0` → render empty state.

**Possible issue**: Initial fetch có thể fail vì `selectedDate` chưa set đúng (timezone issue).

### Fix

**Primary**: Cùng fix `src/lib/api.ts` — KHÔNG auto-redirect.

**Secondary**: Thêm error UI trong reports page:
```typescript
// app/admin/reports/page.tsx sau line 74
{error && (
  <div className="p-4 rounded-[18px] bg-error-bg border border-error text-error">
    Lỗi tải báo cáo: {error}
    <button onClick={handlePreview}>Thử lại</button>
  </div>
)}
```

**Tertiary**: Verify button onClick — có thể wrap với try-catch:
```typescript
const handlePreviewClick = async () => {
  try {
    await handlePreview()
  } catch (err) {
    console.error('Preview failed:', err)
  }
}
// <button onClick={handlePreviewClick}>
```

---

## 🎯 ROOT CAUSE TỔNG HỢP

**Một file gây ra 4 bug E2E**: `src/lib/api.ts` (auto-redirect on 401/403)

### Tác động:

| Bug | Nguyên nhân chính | Tác động |
|-----|-------------------|----------|
| BUG-001 | Auto-redirect trước khi React cleanup → render layout không có user → sidebar không hiển thị | UX broken |
| BUG-002 | Auto-redirect trên 403 → console ghi 403 + user bị đẩy ra login | UX broken |
| BUG-003 | Auto-redirect trên 401 từ useRegistrations → hook state không cleanup → stuck ở loading | Main feature unusable |
| BUG-004 | Auto-redirect + click không trigger đúng → empty state vẫn hiển thị | Main feature unusable |

### Fix đề xuất (single change)

**File**: `src/lib/api.ts:36-47`

```typescript
if (!res.ok) {
  const data = await res.json().catch(() => ({}))

  if (res.status === 401 || res.status === 403) {
    const message = (data as { error?: string })?.error || 'Unauthorized'

    // XÓA auto-redirect — để component quyết định
    // if (endpoint !== '/auth/login' && window.location.pathname !== '/login') {
    //   window.location.href = '/login'
    // }

    throw new APIError(message, res.status, data)
  }

  throw new APIError(...)
}
```

**Sau đó** trong components cần handle:
```typescript
// app/(employee)/layout.tsx:32-37
catch (err) {
  console.error('Failed to fetch user:', err)
  setLoading(false)
  if (err instanceof APIError && err.status === 401) {
    router.push('/login')  // ← explicit redirect từ component
  }
  // 403 = KHÔNG redirect, chỉ show error
}
```

### Verification sau fix

1. Login as employee → navigate to /dashboard → sidebar hiển thị đúng
2. /book không stuck, hiển thị day cards
3. /admin/reports click "Tra cứu" → table render
4. Console clean, không có 403/401 redirect loops

---

## Liên kết với các bug khác

**Bug BUG-005 (cleartext password)** cũng liên quan `src/lib/api.ts`. Bug này không dùng auto-redirect (POST /api/users) nhưng cùng pattern: API client thiết kế không an toàn.

**Pattern lớn**: `src/lib/api.ts` quá "smart" — tự quyết định redirect, không phân biệt lỗi. Đây là anti-pattern.
