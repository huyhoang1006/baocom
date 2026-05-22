# Menu Meal CRUD Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thêm chức năng sửa và xóa món ăn trong thực đơn ngày cho trang `/admin/menu`

**Architecture:** Tạo API mới `DELETE /api/daily-menus/:date/meals/:mealId` để xóa món khỏi thực đơn ngày. Sửa món dùng API `PATCH /api/meals/:id` đã có. Frontend thêm UI popover menu với modal sửa và confirm xóa.

**Tech Stack:** Next.js App Router, Prisma ORM, React hooks

---

## File Structure

```
src/
├── repositories/
│   └── DailyMenuRepository.ts    ← Thêm method deleteMealFromDate()
src/services/
│   └── DailyMenuService.ts       ← Thêm method deleteMealFromDate()
src/controllers/
│   └── DailyMenusController.ts   ← Thêm method deleteMeal()
src/lib/
│   └── api.ts                    ← Thêm mealsApi.deleteFromDate()
app/
├── api/daily-menus/[date]/meals/[mealId]/route.ts  ← MỚI: API endpoint
admin/menu/page.tsx               ← Thêm UI menu, modal sửa, confirm xóa
docs/superpowers/specs/
└── 2026-05-22-menu-meal-crud-design.md  ← Spec đã approve
```

---

## Tasks

### Task 1: Thêm API Endpoint xóa món khỏi ngày

**Files:**
- Create: `app/api/daily-menus/[date]/meals/[mealId]/route.ts`

- [ ] **Step 1: Tạo file route mới**

Tạo thư mục và file: `app/api/daily-menus/[date]/meals/[mealId]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/authMiddleware'
import { DailyMenusController } from '@/controllers/DailyMenusController'

const controller = new DailyMenusController()

export const DELETE = withAdmin(async (
  req: NextRequest,
  userId: string,
  role: string,
  context: { params: Promise<{ date: string; mealId: string }> }
) => {
  const { date: dateStr, mealId } = await context.params
  return controller.deleteMealFromDate(dateStr, mealId)
})
```

- [ ] **Step 2: Commit**

```bash
git add app/api/daily-menus/[date]/meals/[mealId]/route.ts
git commit -m "feat: add DELETE endpoint for removing meal from daily menu date"
```

---

### Task 2: Thêm method deleteMealFromDate trong Controller

**Files:**
- Modify: `src/controllers/DailyMenusController.ts`

- [ ] **Step 1: Đọc file hiện tại**

```bash
cat src/controllers/DailyMenusController.ts
```

- [ ] **Step 2: Thêm method mới vào class**

Thêm vào cuối class `DailyMenusController`:

```typescript
async deleteMealFromDate(dateStr: string, mealId: string) {
  try {
    await this.dailyMenuService.deleteMealFromDate(dateStr, mealId)
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'Not found') {
      return NextResponse.json({ error: 'Daily menu or meal not found' }, { status: 404 })
    }
    throw error
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/controllers/DailyMenusController.ts
git commit -m "feat: add deleteMealFromDate to DailyMenusController"
```

---

### Task 3: Thêm method deleteMealFromDate trong Service

**Files:**
- Modify: `src/services/DailyMenuService.ts`

- [ ] **Step 1: Đọc file hiện tại**

```bash
cat src/services/DailyMenuService.ts
```

- [ ] **Step 2: Thêm method mới vào class**

Thêm vào cuối class `DailyMenuService`:

```typescript
async deleteMealFromDate(date: string, mealId: string) {
  return this.dailyMenuRepository.deleteMealFromDate(new Date(date), mealId)
}
```

- [ ] **Step 3: Commit**

```bash
git add src/services/DailyMenuService.ts
git commit -m "feat: add deleteMealFromDate to DailyMenuService"
```

---

### Task 4: Thêm method deleteMealFromDate trong Repository

**Files:**
- Modify: `src/repositories/DailyMenuRepository.ts`

- [ ] **Step 1: Đọc file hiện tại**

```bash
cat src/repositories/DailyMenuRepository.ts
```

- [ ] **Step 2: Thêm method mới vào class**

Thêm vào cuối class `DailyMenuRepository`:

```typescript
async deleteMealFromDate(date: Date, mealId: string): Promise<void> {
  const dailyMenu = await this.prisma.dailyMenu.findUnique({ where: { date } })
  
  if (!dailyMenu) {
    throw new Error('Not found')
  }

  await this.prisma.dailyMenuMeal.deleteMany({
    where: {
      dailyMenuId: dailyMenu.id,
      mealId
    }
  })
}
```

- [ ] **Step 3: Commit**

```bash
git add src/repositories/DailyMenuRepository.ts
git commit -m "feat: add deleteMealFromDate to DailyMenuRepository"
```

---

### Task 5: Thêm API client method trong api.ts

**Files:**
- Modify: `src/lib/api.ts`

- [ ] **Step 1: Đọc file hiện tại**

```bash
cat src/lib/api.ts
```

- [ ] **Step 2: Thêm mealsApi.deleteFromDate vào cuối file**

Tìm block `// Meals extended API` và thêm method mới:

```typescript
// Meals API
export const mealsApi = {
  findOrCreate: (name: string, type: string) =>
    apiFetch<{ meal: { id: string; name: string; type: string } }>('/meals/find-or-create', {
      method: 'POST',
      body: JSON.stringify({ name, type }),
    }),
  update: (id: string, data: { name?: string; type?: string }) =>
    apiFetch<{ meal: { id: string; name: string; type: string } }>(`/meals/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteFromDate: (date: string, mealId: string) =>
    apiFetch<{ success: boolean }>(`/daily-menus/${date}/meals/${mealId}`, {
      method: 'DELETE',
    }),
}
```

Xóa block `// Meals extended API` cũ vì đã gộp vào `mealsApi`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/api.ts
git commit -m "feat: add mealsApi with update and deleteFromDate methods"
```

---

### Task 6: Thêm UI - MealBadge với Menu Popover

**Files:**
- Modify: `app/admin/menu/page.tsx`

- [ ] **Step 1: Đọc file hiện tại**

```bash
cat app/admin/menu/page.tsx
```

- [ ] **Step 2: Thêm component MealBadge với menu**

Thêm component mới sau `MealSection`:

```typescript
interface MealBadgeProps {
  name: string
  mealId: string
  type: string
  dateKey: string
  onEdit: (mealId: string, name: string, type: string) => void
  onDelete: (mealId: string, dateKey: string) => void
}

function MealBadge({ name, mealId, type, dateKey, onEdit, onDelete }: MealBadgeProps) {
  const [showMenu, setShowMenu] = useState(false)

  return (
    <span className="relative inline-flex items-center">
      <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-primary-bg text-primary text-sm">
        {name}
      </span>
      <button
        onClick={(e) => {
          e.stopPropagation()
          setShowMenu(!showMenu)
        }}
        className="ml-1 p-1 rounded hover:bg-primary/10"
      >
        <span className="material-symbols-outlined text-lg">more_horiz</span>
      </button>
      {showMenu && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowMenu(false)} 
          />
          <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-hairline rounded-xl shadow-floating overflow-hidden min-w-[120px]">
            <button
              onClick={() => {
                setShowMenu(false)
                onEdit(mealId, name, type)
              }}
              className="w-full px-4 py-3 text-left text-sm hover:bg-surface-container transition-colors flex items-center gap-2 min-h-[44px]"
            >
              <span className="material-symbols-outlined text-lg">edit</span>
              Sửa tên
            </button>
            <div className="border-t border-hairline" />
            <button
              onClick={() => {
                setShowMenu(false)
                onDelete(mealId, dateKey)
              }}
              className="w-full px-4 py-3 text-left text-sm text-error hover:bg-error-bg transition-colors flex items-center gap-2 min-h-[44px]"
            >
              <span className="material-symbols-outlined text-lg">delete</span>
              Xóa
            </button>
          </div>
        </>
      )}
    </span>
  )
}
```

- [ ] **Step 3: Update MealSection để dùng MealBadge thay vì span đơn giản**

Thay đổi phần hiển thị items trong `MealSection`:

Tìm phần:
```typescript
{items.length > 0 && (
  <div className="flex flex-wrap gap-2">
    {items.map((item, idx) => (
      <span key={idx} className="inline-flex items-center px-3 py-1.5 rounded-full bg-primary-bg text-primary text-sm">
        {item}
      </span>
    ))}
  </div>
)}
```

Thay bằng (cần biết mealId từ đâu - sẽ cần refactor state):
```typescript
{items.length > 0 && (
  <div className="flex flex-wrap gap-2">
    {items.map((item) => {
      const mealInfo = getMealInfo(item.name) // Cần lookup mealId
      return (
        <MealBadge
          key={mealInfo.id}
          name={item.name}
          mealId={mealInfo.id}
          type={type}
          dateKey={dateKey}
          onEdit={handleMealEdit}
          onDelete={handleMealDelete}
        />
      )
    })}
  </div>
)}
```

**Lưu ý:** Cần refactor state `cellValues` để lưu thêm `mealId` thay vì chỉ `string[]`. Cập nhật kiểu dữ liệu:

```typescript
interface MealInfo {
  id: string
  name: string
  type: string
}

type CellValues = Map<string, Map<string, MealInfo[]>>
```

- [ ] **Step 4: Commit**

```bash
git add app/admin/menu/page.tsx
git commit -m "feat: add MealBadge with menu popover for edit/delete"
```

---

### Task 7: Thêm Modal Sửa và Confirm Xóa

**Files:**
- Modify: `app/admin/menu/page.tsx`

- [ ] **Step 1: Thêm state cho modal**

Thêm vào đầu component `MenuPage`:

```typescript
const [editingMeal, setEditingMeal] = useState<{ id: string; name: string; type: string } | null>(null)
const [deleteConfirm, setDeleteConfirm] = useState<{ mealId: string; name: string; dateKey: string } | null>(null)
```

- [ ] **Step 2: Thêm handler functions**

Thêm vào `MenuPage`:

```typescript
const handleMealEdit = (mealId: string, name: string, type: string) => {
  setEditingMeal({ id: mealId, name, type })
}

const handleEditSave = async () => {
  if (!editingMeal) return
  try {
    await mealsApi.update(editingMeal.id, { name: editingMeal.name, type: editingMeal.type })
    // Cập nhật cellValues
    setCellValues(prev => {
      const newMap = new Map(prev)
      for (const [dateKey, typeMap] of newMap) {
        for (const [type, meals] of typeMap) {
          const idx = meals.findIndex(m => m.id === editingMeal.id)
          if (idx !== -1) {
            const updated = [...meals]
            updated[idx] = { ...updated[idx], name: editingMeal.name, type: editingMeal.type }
            typeMap.set(type, updated)
            break
          }
        }
      }
      return newMap
    })
    setEditingMeal(null)
    showNotification("success", "Đã cập nhật món")
  } catch (err) {
    showNotification("error", err instanceof Error ? err.message : "Cập nhật thất bại")
  }
}

const handleMealDelete = (mealId: string, dateKey: string) => {
  // Tìm tên món từ cellValues
  const typeMap = cellValues.get(dateKey)
  let mealName = ""
  if (typeMap) {
    for (const [, meals] of typeMap) {
      const meal = meals.find(m => m.id === mealId)
      if (meal) {
        mealName = meal.name
        break
      }
    }
  }
  setDeleteConfirm({ mealId, name: mealName, dateKey })
}

const handleDeleteConfirm = async () => {
  if (!deleteConfirm) return
  try {
    await mealsApi.deleteFromDate(deleteConfirm.dateKey, deleteConfirm.mealId)
    // Cập nhật cellValues - xóa món khỏi dateKey
    setCellValues(prev => {
      const newMap = new Map(prev)
      const typeMap = newMap.get(deleteConfirm.dateKey)
      if (typeMap) {
        for (const [type, meals] of typeMap) {
          const filtered = meals.filter(m => m.id !== deleteConfirm.mealId)
          typeMap.set(type, filtered)
        }
      }
      return newMap
    })
    setDeleteConfirm(null)
    showNotification("success", "Đã xóa món")
  } catch (err) {
    showNotification("error", err instanceof Error ? err.message : "Xóa thất bại")
  }
}
```

- [ ] **Step 3: Thêm Modal Sửa**

Thêm vào JSX (sau notification div):

```typescript
{editingMeal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-ink/50" onClick={() => setEditingMeal(null)} />
    <div className="relative bg-white rounded-2xl w-full max-w-sm p-6 shadow-floating">
      <h2 className="text-lg font-semibold text-ink mb-4">Sửa tên món</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-ink-muted-80 mb-1">Tên món</label>
          <input
            type="text"
            value={editingMeal.name}
            onChange={(e) => setEditingMeal({ ...editingMeal, name: e.target.value })}
            className="w-full px-3 py-3 rounded-xl border border-hairline bg-white text-sm text-ink outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="block text-sm text-ink-muted-80 mb-1">Loại</label>
          <select
            value={editingMeal.type}
            onChange={(e) => setEditingMeal({ ...editingMeal, type: e.target.value })}
            className="w-full px-3 py-3 rounded-xl border border-hairline bg-white text-sm text-ink outline-none focus:border-primary"
          >
            <option value="main">Món chính</option>
            <option value="vegetable">Món rau</option>
            <option value="dessert">Tráng miệng</option>
          </select>
        </div>
        <div className="flex gap-3 pt-2">
          <button
            onClick={() => setEditingMeal(null)}
            className="flex-1 px-4 py-3 rounded-xl border border-hairline text-ink-muted-80 text-sm font-medium hover:bg-surface-container transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleEditSave}
            className="flex-1 px-4 py-3 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-colors"
          >
            Lưu
          </button>
        </div>
      </div>
    </div>
  </div>
)}
```

- [ ] **Step 4: Thêm Confirm Xóa**

Thêm vào JSX (sau modal sửa):

```typescript
{deleteConfirm && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-ink/50" onClick={() => setDeleteConfirm(null)} />
    <div className="relative bg-white rounded-2xl w-full max-w-sm p-6 shadow-floating">
      <h2 className="text-lg font-semibold text-ink mb-2">Xác nhận xóa</h2>
      <p className="text-sm text-ink-muted-80 mb-6">
        Xóa "{deleteConfirm.name}" khỏi thực đơn ngày này?<br/>
        <span className="text-ink-muted-48">(Món vẫn còn trong hệ thống)</span>
      </p>
      <div className="flex gap-3">
        <button
          onClick={() => setDeleteConfirm(null)}
          className="flex-1 px-4 py-3 rounded-xl border border-hairline text-ink-muted-80 text-sm font-medium hover:bg-surface-container transition-colors"
        >
          Hủy
        </button>
        <button
          onClick={handleDeleteConfirm}
          className="flex-1 px-4 py-3 rounded-xl bg-error text-white text-sm font-medium hover:bg-error-hover transition-colors"
        >
          Xóa
        </button>
      </div>
    </div>
  </div>
)}
```

- [ ] **Step 5: Commit**

```bash
git add app/admin/menu/page.tsx
git commit -m "feat: add edit modal and delete confirmation dialog"
```

---

### Task 8: Test thủ công và fix bugs

**Testing checklist:**

1. **Sửa món:**
   - Mở `/admin/menu`
   - Tap ⋮ trên 1 món → Chọn "Sửa tên"
   - Đổi tên → Lưu
   - Kiểm tra: Thông báo "Đã cập nhật", tên món thay đổi trên UI

2. **Xóa món:**
   - Tap ⋮ trên 1 món → Chọn "Xóa"
   - Confirm dialog hiện ra
   - Nhấn "Xóa"
   - Kiểm tra: Thông báo "Đã xóa", món biến mất khỏi UI

3. **Edge cases:**
   - Xóa món cuối cùng → Hiện placeholder "Chưa có món nào"
   - API lỗi → Hiện thông báo lỗi

---

## Self-Review Checklist

- [ ] API endpoint có đúng route `DELETE /api/daily-menus/:date/meals/:mealId`
- [ ] Controller → Service → Repository chain hoạt động
- [ ] Frontend gọi đúng API `mealsApi.deleteFromDate()`
- [ ] Modal sửa update được `cellValues` với mealId
- [ ] Confirm xóa xóa đúng món khỏi `cellValues`
- [ ] Tất cả files đã commit

---

**Plan complete and saved to `docs/superpowers/plans/2026-05-22-menu-meal-crud-plan.md`**

**Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?