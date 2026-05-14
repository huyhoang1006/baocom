# UAT Test Specification: Quản lý Thực đơn Hàng ngày & Món ăn

**Dự án:** BaoCom - Hệ thống Quản lý Suất ăn  
**Ngày:** 2026-05-14  
**Loại Test:** Black Box / UAT

---

## 1. Tổng quan

Tài liệu này bao gồm User Acceptance Testing cho quản lý thực đơn hàng ngày, món ăn và ngày lễ. Testing theo phương pháp black box tập trung vào API endpoints và hành vi UI mà không cần biết implementation bên trong.

### 1.1 Phạm vi

| Khu vực | Components |
|---------|------------|
| **APIs** | Daily Menus, Meals, Holidays endpoints |
| **UI Pages** | `/dashboard` (employee), `/book` (registration) |
| **Entities** | DailyMenu, Meal, Holiday |

### 1.2 Loại Meal

| Type | Tiếng Việt | Mô tả |
|------|-----------|-------|
| `main` | Món chính | Các món chính (protein, carbs) |
| `vegetable` | Món rau | Các món rau |
| `dessert` | Tráng miệng | Các món tráng miệng |

---

## 2. Yêu cầu Dữ liệu Test

### 2.1 User Roles

| Vai trò | Permissions |
|---------|-------------|
| `employee` | Xem menus, đặt/hủy món |
| `admin` | Full CRUD trên menus, meals, holidays |

### 2.2 Dữ liệu Test cần thiết

```
Meals (tối thiểu):
- 3 main dishes (vd: "Thịt kho trứng", "Cá chiên", "Gà rang")
- 3 vegetable dishes (vd: "Rau muống xào", "Cải xào tỏi", "Đậu co rí")
- 2 desserts (vd: "Chuối chiên", "Rán flexible")

DailyMenus:
- Hôm nay, ngày mai, 3 ngày làm việc tiếp theo
- Ít nhất 1 ngày với mixed meal types

Holidays:
- Ít nhất 1 ngày lễ tương lai
- Ít nhất 1 ngày lễ quá khứ

Dates:
- Quá khứ: bất kỳ ngày nào trước hôm nay
- Hôm nay: ngày hiện tại (YYYY-MM-DD)
- Tương lai: bất kỳ ngày nào sau hôm nay
```

### 2.3 Date Format

Tất cả dates sử dụng ISO format: `YYYY-MM-DD` (vd: `2026-05-14`)

---

## 3. API Test Cases

### 3.1 Daily Menus API

#### 3.1.1 GET /api/daily-menus

| ID | Scenario | Method | Expected Response | Priority |
|----|----------|--------|-------------------|----------|
| DM-API-001 | Lấy tất cả menus (không params) | GET /api/daily-menus | 200, array of menus | P0 |
| DM-API-002 | Lấy menus với `take=5` | GET /api/daily-menus?take=5 | 200, tối đa 5 menus | P1 |
| DM-API-003 | Lấy menus với `take=invalid` | GET /api/daily-menus?take=abc | 200, all menus (fallback) | P2 |
| DM-API-004 | Truy cập không có auth | (remove cookie) | 401 Unauthorized | P0 |
| DM-API-005 | Truy cập với expired token | (expired cookie) | 401 Unauthorized | P0 |

**Response Schema:**
```json
{
  "menus": [
    {
      "id": "string",
      "date": "2026-05-14",
      "meals": [
        {
          "id": "string",
          "sortOrder": 1,
          "meal": {
            "id": "string",
            "name": "Thịt kho trứng",
            "type": "main"
          }
        }
      ]
    }
  ]
}
```

---

#### 3.1.2 GET /api/daily-menus/[date]

| ID | Scenario | Method | Expected Response | Priority |
|----|----------|--------|-------------------|----------|
| DM-API-010 | Lấy menu hôm nay | GET /api/daily-menus/2026-05-14 | 200, dailyMenu object | P0 |
| DM-API-011 | Lấy menu ngày tương lai | GET /api/daily-menus/2026-05-20 | 200, dailyMenu or null | P1 |
| DM-API-012 | Lấy menu ngày quá khứ | GET /api/daily-menus/2026-01-01 | 200, dailyMenu or null | P1 |
| DM-API-013 | Lấy menu cho ngày không có menu | GET /api/daily-menus/2099-12-31 | 200, `{ dailyMenu: null }` | P1 |
| DM-API-014 | Format date không hợp lệ | GET /api/daily-menus/invalid | 400/500, error | P2 |
| DM-API-015 | Truy cập không có auth | (remove cookie) | 401 Unauthorized | P0 |

---

#### 3.1.3 POST /api/daily-menus

| ID | Scenario | Method | Request Body | Expected Response | Priority |
|----|----------|--------|--------------|-------------------|----------|
| DM-API-020 | Tạo menu hợp lệ | POST | `{ "date": "2026-05-25", "mealIds": ["id1", "id2"] }` | 201, created menu | P0 |
| DM-API-021 | Tạo menu không có auth | POST | valid body | 401 Unauthorized | P0 |
| DM-API-022 | Tạo menu như employee | POST | valid body | 403 Forbidden | P0 |
| DM-API-023 | Tạo menu thiếu date | POST | `{ "mealIds": ["id1"] }` | 400, missing date | P0 |
| DM-API-024 | Tạo menu thiếu mealIds | POST | `{ "date": "2026-05-25" }` | 400, missing mealIds | P0 |
| DM-API-025 | Tạo menu với mealIds không hợp lệ | POST | `{ "date": "2026-05-25", "mealIds": ["invalid"] }` | 400, invalid mealIds | P0 |
| DM-API-026 | Tạo menu với meal inactive | POST | `{ "date": "2026-05-25", "mealIds": ["inactive-id"] }` | 400, inactive meal error | P0 |
| DM-API-027 | Tạo menu với mealIds rỗng | POST | `{ "date": "2026-05-25", "mealIds": [] }` | 400, missing mealIds | P0 |
| DM-API-028 | Tạo menu invalid JSON | POST | `{ invalid` | 400, invalid JSON | P0 |
| DM-API-029 | Menu trùng lặp cho cùng ngày | POST | `{ "date": "2026-05-14", "mealIds": ["id1"] }` (existing date) | 201 or 200 (upsert behavior) | P1 |

---

#### 3.1.4 PUT /api/daily-menus/[date]

| ID | Scenario | Method | Request Body | Expected Response | Priority |
|----|----------|--------|--------------|-------------------|----------|
| DM-API-030 | Cập nhật menu ngày hiện có | PUT /api/daily-menus/2026-05-14 | `{ "mealIds": ["id1", "id2", "id3"] }` | 200, updated menu | P0 |
| DM-API-031 | Cập nhật menu ngày không tồn tại | PUT /api/daily-menus/2099-01-01 | `{ "mealIds": ["id1"] }` | 201 or 400 | P1 |
| DM-API-032 | Cập nhật không có auth | PUT | valid body | 401 Unauthorized | P0 |
| DM-API-033 | Cập nhật như employee | PUT | valid body | 403 Forbidden | P0 |
| DM-API-034 | Cập nhật thiếu mealIds | PUT | `{ "date": "2026-05-14" }` | 400, missing mealIds | P0 |
| DM-API-035 | Cập nhật với mealIds không hợp lệ | PUT | `{ "mealIds": ["invalid"] }` | 400, invalid mealIds | P0 |

---

### 3.2 Meals API

#### 3.2.1 GET /api/meals

| ID | Scenario | Method | Expected Response | Priority |
|----|----------|--------|-------------------|----------|
| M-API-001 | Lấy tất cả meals (không params) | GET /api/meals | 200, array of meals | P0 |
| M-API-002 | Filter by type=main | GET /api/meals?type=main | 200, only main dishes | P0 |
| M-API-003 | Filter by type=vegetable | GET /api/meals?type=vegetable | 200, only vegetable dishes | P0 |
| M-API-004 | Filter by type=dessert | GET /api/meals?type=dessert | 200, only dessert items | P0 |
| M-API-005 | Filter by type không hợp lệ | GET /api/meals?type=invalid | 200, all meals (fallback) | P2 |
| M-API-006 | Truy cập không có auth | (remove cookie) | 401 Unauthorized | P0 |

---

#### 3.2.2 GET /api/meals/[id]

| ID | Scenario | Method | Expected Response | Priority |
|----|----------|--------|-------------------|----------|
| M-API-010 | Lấy meal hiện có | GET /api/meals/{valid-id} | 200, meal object | P0 |
| M-API-011 | Lấy meal không tồn tại | GET /api/meals/invalid-id | 404, not found | P0 |
| M-API-012 | Truy cập không có admin | (employee cookie) | 403 Forbidden | P0 |
| M-API-013 | Truy cập không có auth | (no cookie) | 401 Unauthorized | P0 |

**Response Schema:**
```json
{
  "meal": {
    "id": "string",
    "name": "Thịt kho trứng",
    "type": "main",
    "isActive": true,
    "createdAt": "2026-01-01T00:00:00Z"
  }
}
```

---

#### 3.2.3 POST /api/meals

| ID | Scenario | Method | Request Body | Expected Response | Priority |
|----|----------|--------|--------------|-------------------|----------|
| M-API-020 | Tạo main dish | POST | `{ "name": "Thịt kho trứng", "type": "main" }` | 201, created meal | P0 |
| M-API-021 | Tạo vegetable | POST | `{ "name": "Rau muống xào", "type": "vegetable" }` | 201, created meal | P0 |
| M-API-022 | Tạo dessert | POST | `{ "name": "Chuối chiên", "type": "dessert" }` | 201, created meal | P0 |
| M-API-023 | Tạo không có auth | POST | valid body | 401 Unauthorized | P0 |
| M-API-024 | Tạo như employee | POST | valid body | 403 Forbidden | P0 |
| M-API-025 | Tạo thiếu name | POST | `{ "type": "main" }` | 400, missing name | P0 |
| M-API-026 | Tạo thiếu type | POST | `{ "name": "Thịt kho" }` | 400, missing type | P0 |
| M-API-027 | Tạo type không hợp lệ | POST | `{ "name": "Thịt kho", "type": "invalid" }` | 400, invalid type | P0 |
| M-API-028 | Tạo invalid JSON | POST | `{ invalid` | 400, invalid JSON | P0 |

---

#### 3.2.4 PATCH /api/meals/[id]

| ID | Scenario | Method | Request Body | Expected Response | Priority |
|----|----------|--------|--------------|-------------------|----------|
| M-API-030 | Cập nhật meal name | PATCH /api/meals/{id} | `{ "name": "Thịt kho mới" }` | 200, updated meal | P0 |
| M-API-031 | Cập nhật meal type | PATCH /api/meals/{id} | `{ "type": "vegetable" }` | 200, updated meal | P0 |
| M-API-032 | Deactivate meal | PATCH /api/meals/{id} | `{ "isActive": false }` | 200, updated meal | P0 |
| M-API-033 | Cập nhật không tồn tại | PATCH /api/meals/invalid-id | `{ "name": "New" }` | 404, not found | P0 |
| M-API-034 | Cập nhật không có admin | PATCH | valid body | 403 Forbidden | P0 |

---

#### 3.2.5 DELETE /api/meals/[id]

| ID | Scenario | Method | Expected Response | Priority |
|----|----------|--------|-------------------|----------|
| M-API-040 | Xóa meal hiện có | DELETE /api/meals/{id} | 200, `{ success: true }` | P0 |
| M-API-041 | Xóa không tồn tại | DELETE /api/meals/invalid-id | 404, not found | P0 |
| M-API-042 | Xóa không có admin | DELETE | 403 Forbidden | P0 |

---

### 3.3 Holidays API

#### 3.3.1 GET /api/holidays

| ID | Scenario | Method | Expected Response | Priority |
|----|----------|--------|-------------------|----------|
| H-API-001 | Lấy tất cả holidays | GET /api/holidays | 200, array of holidays | P0 |
| H-API-002 | Truy cập không có admin | (employee cookie) | 403 Forbidden | P0 |
| H-API-003 | Truy cập không có auth | (no cookie) | 401 Unauthorized | P0 |

---

#### 3.3.2 GET /api/holidays/[id]

| ID | Scenario | Method | Expected Response | Priority |
|----|----------|--------|-------------------|----------|
| H-API-010 | Lấy holiday hiện có | GET /api/holidays/{valid-id} | 200, holiday object | P0 |
| H-API-011 | Lấy holiday không tồn tại | GET /api/holidays/invalid-id | 404, not found | P0 |

---

#### 3.3.3 POST /api/holidays

| ID | Scenario | Method | Request Body | Expected Response | Priority |
|----|----------|--------|--------------|-------------------|----------|
| H-API-020 | Tạo holiday với date | POST | `{ "date": "2026-05-20" }` | 201, created holiday | P0 |
| H-API-021 | Tạo holiday với description | POST | `{ "date": "2026-05-20", "description": "Ngày lễ" }` | 201, created holiday | P0 |
| H-API-022 | Tạo thiếu date | POST | `{ "description": "Lễ" }` | 400, missing date | P0 |
| H-API-023 | Tạo không có admin | POST | valid body | 403 Forbidden | P0 |

---

#### 3.3.4 PATCH /api/holidays/[id]

| ID | Scenario | Method | Request Body | Expected Response | Priority |
|----|----------|--------|--------------|-------------------|----------|
| H-API-030 | Cập nhật holiday date | PATCH /api/holidays/{id} | `{ "date": "2026-06-01" }` | 200, updated holiday | P0 |
| H-API-031 | Cập nhật holiday description | PATCH /api/holidays/{id} | `{ "description": "Mới" }` | 200, updated holiday | P0 |
| H-API-032 | Deactivate holiday | PATCH /api/holidays/{id} | `{ "isActive": false }` | 200, updated holiday | P0 |
| H-API-033 | Cập nhật không tồn tại | PATCH /api/holidays/invalid-id | any body | 404, not found | P0 |

---

#### 3.3.5 DELETE /api/holidays/[id]

| ID | Scenario | Method | Expected Response | Priority |
|----|----------|--------|-------------------|----------|
| H-API-040 | Xóa holiday hiện có | DELETE /api/holidays/{id} | 200, `{ success: true }` | P0 |
| H-API-041 | Xóa không tồn tại | DELETE /api/holidays/invalid-id | 404, not found | P0 |

---

## 4. UI Test Cases

### 4.1 Trang Dashboard (/dashboard)

#### 4.1.1 Xem Weekly Menu

| ID | Scenario | Action | Expected Result | Priority |
|----|----------|--------|-----------------|----------|
| UI-D-001 | Tải dashboard | Navigate to /dashboard | Page loads, shows weekly menu | P0 |
| UI-D-002 | Xem ngày hiện tại được chọn | Default state | Hôm nay highlighted, menu displayed | P0 |
| UI-D-003 | Xem không có menu cho ngày | Chọn ngày không có menu | "Chưa có menu" shown | P0 |
| UI-D-004 | Chuyển giữa các ngày | Click day button | Menu updates cho selected day | P0 |
| UI-D-005 | Xem main dishes | Ngày có menu | "Món chính" section shows dishes | P0 |
| UI-D-006 | Xem vegetable dishes | Ngày có vegetables | "Món rau" section shows dishes | P0 |
| UI-D-007 | Xem desserts | Ngày có desserts | "Tráng miệng" section shows items | P0 |
| UI-D-008 | Loading state | Refresh page | Skeleton/loading indicator shown | P1 |
| UI-D-009 | Xem registration status | Ngày có registration | "Đã đăng ký" badge shown | P0 |
| UI-D-010 | Xem unregistered status | Ngày không có registration | "Chưa đăng ký" badge shown | P0 |

---

### 4.2 Trang Book (/book)

#### 4.2.1 Meal Registration

| ID | Scenario | Action | Expected Result | Priority |
|----|----------|--------|-----------------|----------|
| UI-B-001 | Tải trang book | Navigate to /book | Page loads, shows 8-day grid | P0 |
| UI-B-002 | Xem card hôm nay | Default state | "Hôm nay" badge on today | P0 |
| UI-B-003 | Đăng ký ăn | Tap ngày với "Chưa chọn" | Status changes to "Ăn", success toast | P0 |
| UI-B-004 | Hủy đăng ký | Tap ngày với "Ăn" | Status changes to "Không ăn" | P0 |
| UI-B-005 | Đăng ký lại | Tap ngày với "Không ăn" | Status changes back to "Ăn" | P0 |
| UI-B-006 | Không thể sửa quá khứ | Tap ngày quá khứ | Disabled, no action | P0 |
| UI-B-007 | Xem số đăng ký | Load page | "Đã đăng ký" count shows correct number | P0 |
| UI-B-008 | Success notification | Register | Toast appears with "Đã đăng ký ăn" | P1 |
| UI-B-009 | Error notification | Failed toggle | Toast appears with "Cập nhật thất bại" | P1 |
| UI-B-010 | Today ring highlight | Load page | Today has primary ring outline | P1 |

---

## 5. Integration Test Cases

### 5.1 Menu-Meal Relationship

| ID | Scenario | Action | Expected Result | Priority |
|----|----------|--------|-----------------|----------|
| INT-001 | Tạo menu với meals hợp lệ | POST /api/daily-menus | Menu includes all specified meals | P0 |
| INT-002 | Tạo menu với meal ID không hợp lệ | POST /api/daily-menus | 400 error, no menu created | P0 |
| INT-003 | Xem menu trên dashboard | GET /dashboard | Meals display with correct types | P0 |
| INT-004 | Deactivate meal used in menu | PATCH /api/meals/{id} isActive=false | Daily menu still accessible, meal shows as inactive | P1 |

### 5.2 Holiday-Meal Relationship

| ID | Scenario | Action | Expected Result | Priority |
|----|----------|--------|-----------------|----------|
| INT-010 | Tạo holiday | POST /api/holidays | Holiday saved successfully | P0 |
| INT-011 | Xem holidays trên calendar | (future) | Holidays displayed correctly | P1 |
| INT-012 | Xóa holiday với menu hiện có | DELETE /api/holidays/{id} | Holiday deleted, menus unaffected | P1 |

---

## 6. Edge Cases

| ID | Scenario | Expected Behavior | Priority |
|----|----------|-------------------|----------|
| EC-001 | Danh sách menus rỗng | GET /api/daily-menus returns `{ menus: [] }` | P1 |
| EC-002 | Danh sách meals rỗng | GET /api/meals returns `{ meals: [] }` | P1 |
| EC-003 | Danh sách holidays rỗng | GET /api/holidays returns `{ holidays: [] }` | P1 |
| EC-004 | Date tại boundary tháng | GET /api/daily-menus/2026-01-01 | Works correctly | P2 |
| EC-005 | Leap year Feb 29 | GET /api/daily-menus/2028-02-29 | Works correctly | P2 |
| EC-006 | Meal name rất dài | Create meal với 500 chars | Handled gracefully | P2 |
| EC-007 | Special characters trong description | Create holiday với `"test<>:'` | Saved correctly | P2 |
| EC-008 | Concurrent menu updates | Two admins update same date | Last write wins or 409 | P2 |

---

## 7. Acceptance Criteria

### 7.1 Daily Menu Management

- [ ] Admin có thể tạo daily menu với nhiều meals
- [ ] Admin có thể cập nhật existing daily menu by date
- [ ] Admin có thể xem tất cả daily menus với pagination
- [ ] Employee có thể xem daily menu cho specific date
- [ ] System validates mealIds are valid and active

### 7.2 Meal Management

- [ ] Admin có thể tạo meals của types: main, vegetable, dessert
- [ ] Admin có thể cập nhật meal properties
- [ ] Admin có thể deactivate meal (soft delete)
- [ ] Admin có thể permanently delete meal
- [ ] Employee có thể xem tất cả active meals

### 7.3 Holiday Management

- [ ] Admin có thể tạo holidays với date và description
- [ ] Admin có thể cập nhật holiday properties
- [ ] Admin có thể deactivate/delete holidays

### 7.4 UI Functionality

- [ ] Dashboard shows current week menu
- [ ] Dashboard displays meal types correctly
- [ ] Book page cho phép registration toggle
- [ ] Past days không modifiable được
- [ ] Success/error notifications hiển thị

---

## 8. Test Execution Checklist

```
Pre-test Setup (Thiết lập pre-test):
[ ] Tạo test meals (3 main, 3 vegetable, 2 dessert)
[ ] Tạo test daily menus (today + 3 future days)
[ ] Tạo test holidays (1 past, 1 future)
[ ] Verify test users (employee, admin)

API Testing:
[ ] Execute all DM-API-00x tests
[ ] Execute all M-API-00x tests
[ ] Execute all H-API-00x tests
[ ] Verify all P0 tests pass

UI Testing:
[ ] Execute all UI-D-00x tests (dashboard)
[ ] Execute all UI-B-00x tests (book page)
[ ] Verify responsive behavior

Integration Testing:
[ ] Execute all INT-00x tests

Edge Case Testing:
[ ] Execute all EC-00x tests

Post-test Cleanup:
[ ] Remove test data
[ ] Verify no test artifacts remain
```

---

## Appendix A: API Response Codes Summary

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (not logged in) |
| 403 | Forbidden (insufficient role) |
| 404 | Not Found |
| 500 | Internal Server Error |

## Appendix B: Test Environment URLs

| Environment | Base URL |
|-------------|----------|
| Local | http://localhost:3000 |
| Staging | (insert) |
| Production | (insert) |