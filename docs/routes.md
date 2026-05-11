# Tài liệu Màn hình & Routes - Hệ thống Báo Cơm

> Phiên bản: 2.0  
> Ngày: 2026-05-10  
> Trạng thái: Final  
> Cập nhật: Routes chính xác đã xác nhận với business logic

---

## Mục lục

1. [Tổng quan cấu trúc](#1-tổng-quan-cấu-trúc)
2. [Ma trận Routes × Chức năng](#2-ma-trận-routes--chức-năng)
3. [Routes Public](#3-routes-public)
4. [Routes Nhân viên](#4-routes-nhân-viên)
5. [Routes Admin](#5-routes-admin)
6. [Route Protection](#6-route-protection)
7. [Navigation Sidebar](#7-navigation-sidebar)

---

## 1. Tổng quan cấu trúc

### Cấu trúc thư mục

```
app/
├── layout.tsx                    ← Root Layout
├── page.tsx                      ← Redirect (/)
│
├── (auth)/
│   └── login/
│       └── page.tsx              ← /login
│
├── (employee)/                   ← Nhóm routes Nhân viên
│   ├── book/
│   │   └── page.tsx              ← /book (Báo cơm)
│   └── history/
│       └── page.tsx              ← /my-history (Lịch sử)
│
└── admin/                        ← Nhóm routes Admin
    ├── dashboard/
    │   └── page.tsx              ← /admin/dashboard
    ├── employees/
    │   └── page.tsx              ← /admin/employees
    └── reports/
        └── page.tsx              ← /admin/reports
```

### Tổng hợp Routes

| Nhóm | Route | Chức năng | Trạng thái |
|------|-------|-----------|------------|
| **Public** | `/login` | Đăng nhập | ✅ Hoàn thành |
| **Nhân viên** | `/book` | Báo cơm | ✅ Hoàn thành |
| **Nhân viên** | `/my-history` | Lịch sử đăng ký | ⬜ Cần tạo |
| **Admin** | `/admin/dashboard` | Dashboard | ✅ Hoàn thành |
| **Admin** | `/admin/employees` | Quản lý nhân sự | ⬜ Cần tạo |
| **Admin** | `/admin/reports` | Xuất báo cáo | ⬜ Cần tạo |

---

## 2. Ma trận Routes × Chức năng

| Route | Component | Chức năng | Vai trò | Trạng thái |
|-------|-----------|-----------|---------|------------|
| `/login` | `login/page.tsx` | Đăng nhập (Admin & Nhân viên) | Public | ✅ Hoàn thành |
| `/book` | `book/page.tsx` | Báo cơm (mặc định CÓ ĂN) | Nhân viên, Admin | ✅ Hoàn thành |
| `/my-history` | `history/page.tsx` | Lịch sử đăng ký của MÌNH | Nhân viên, Admin | ⬜ Cần tạo |
| `/admin/dashboard` | `dashboard/page.tsx` | Dashboard xem tổng suất ăn hôm nay | Admin | ✅ Hoàn thành |
| `/admin/employees` | `employees/page.tsx` | CRUD nhân viên + Hủy cơm hàng loạt | Admin | ⬜ Cần tạo |
| `/admin/reports` | `reports/page.tsx` | Xuất Excel (Tên + SĐT + ngày) | Admin | ⬜ Cần tạo |

---

## 3. Routes Public

### 3.1 Đăng nhập `/login`

| Thuộc tính | Giá trị |
|------------|---------|
| **Route** | `/login` |
| **File** | `app/(auth)/login/page.tsx` |
| **Vai trò** | Public (Admin + Nhân viên) |
| **Chức năng** | Đăng nhập hệ thống |

**Các trường:**
- Username (text)
- Password (password)
- Nút "Đăng nhập"

**Quy tắc Username:**
```
Nhân viên: hungpx (Phạm Xuân Hùng)
Admin: admin (hoặc username riêng)
```

**Sau khi login thành công:**
- Admin → Redirect đến `/admin/dashboard`
- Nhân viên → Redirect đến `/book`

**Mockup Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│                     🍽️ BaoCom                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                    ĐĂNG NHẬP                               │
│                                                             │
│                    ┌─────────────────────┐                  │
│                    │ Username:          │                  │
│                    │ [____________]     │                  │
│                    │                     │                  │
│                    │ Password:          │                  │
│                    │ [____________]     │                  │
│                    │                     │                  │
│                    │ [Đăng nhập]        │                  │
│                    └─────────────────────┘                  │
│                                                             │
│                    Ví dụ: hungpx (Phạm Xuân Hùng)          │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  © 2024 BaoCom. Mọi quyền được bảo lưu.                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Routes Nhân viên

### 4.1 Báo cơm `/book`

| Thuộc tính | Giá trị |
|------------|---------|
| **Route** | `/book` |
| **File** | `app/(employee)/book/page.tsx` |
| **Vai trò** | Nhân viên, Admin |
| **Chức năng** | Báo cơm - Mặc định CÓ ĂN |
| **Trạng thái** | ✅ Hoàn thành |

**Logic nghiệp vụ:**
- Mặc định: Tất cả ngày đều là CÓ ĂN (không cần tick)
- Nhân viên tick "Không ăn" cho ngày cần
- Không báo được cho ngày hôm nay (deadline 00:00)
- Chỉ báo được cho ngày mai + tương lai

**Nội dung:**
- Tiêu đề: "BÁO CƠM"
- Ngày hiện tại + Thông tin deadline
- Lịch đăng ký: Các ngày trong tuần với trạng thái
- Tick "Không ăn" cho ngày cần
- Nút "Cập nhật"

**Mockup Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│  📝 BÁO CƠM                               [👤 hungpx] [🚪]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Hôm nay: Thứ Hai, 15/10/2024                               │
│  Deadline hôm nay: 00:00 (đã chốt cho ngày mai)             │
│                                                             │
│  ─────────────────────────────────────────────              │
│  Lịch đăng ký của bạn (mặc định CÓ ĂN):                   │
│                                                             │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│  │ T3,16/10│ │ T4,17/10│ │ T5,18/10│ │ T6,19/10│          │
│  │  🍽️     │ │  🍽️     │ │  🍽️     │ │  🍽️     │          │
│  │ Có ăn   │ │ Có ăn   │ │ Có ăn   │ │ Có ăn   │          │
│  │ ✅      │ │ ✅      │ │ ✅      │ │ ✅      │          │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘          │
│                                                             │
│  ─────────────────────────────────────────────              │
│  Đánh dấu ngày KHÔNG ĂN:                                   │
│                                                             │
│  ☐ T3, 16/10 (Không ăn)                                   │
│  ☐ T4, 17/10 (Không ăn)                                   │
│  ☑ T5, 18/10 (Không ăn) ← Đã tick                        │
│  ☐ T6, 19/10 (Không ăn)                                   │
│                                                             │
│              [Cập nhật]                                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### 4.2 Lịch sử `/my-history`

| Thuộc tính | Giá trị |
|------------|---------|
| **Route** | `/my-history` |
| **File** | `app/(employee)/history/page.tsx` |
| **Vai trò** | Nhân viên, Admin |
| **Chức năng** | Xem lịch sử đăng ký của BẢN THÂN |
| **Trạng thái** | ⬜ Cần tạo |

**Logic nghiệp vụ:**
- Chỉ xem được lịch sử của MÌNH
- Không xem được của nhân viên khác
- Lọc theo tuần/tháng

**Nội dung:**
- Tiêu đề: "LỊCH SỬ ĐĂNG KÝ"
- Xin chào: Tên nhân viên (username)
- Bộ lọc: Tuần / Tháng
- Bảng lịch sử: Ngày, Trạng thái (Có ăn / Không ăn), Ghi chú
- Thống kê: Tổng ngày, Có ăn, Không ăn

**Mockup Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│  📜 LỊCH SỬ ĐĂNG KÝ                      [👤 hungpx] [🚪] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Xin chào: Phạm Xuân Hùng (hungpx)                         │
│                                                             │
│  Bộ lọc: [Tuần này ▼] [Tháng này ▼] [Tùy chọn]            │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Ngày         │ Trạng thái     │ Ghi chú            │   │
│  ├──────────────┼────────────────┼────────────────────┤   │
│  │ 15/10/2024   │ ✅ Có ăn       │                    │   │
│  │ 14/10/2024   │ ✅ Có ăn       │                    │   │
│  │ 13/10/2024   │ ❌ Không ăn    │ Đi công tác        │   │
│  │ 12/10/2024   │ ✅ Có ăn       │                    │   │
│  │ 11/10/2024   │ ❌ Không ăn    │ Nghỉ phép          │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Thống kê:                                                  │
│  ├── Tổng ngày: 20 ngày                                   │
│  ├── Có ăn: 18 ngày (90%)                                 │
│  └── Không ăn: 2 ngày (10%)                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Routes Admin

### 5.1 Dashboard `/admin/dashboard`

| Thuộc tính | Giá trị |
|------------|---------|
| **Route** | `/admin/dashboard` |
| **File** | `app/admin/dashboard/page.tsx` |
| **Vai trò** | Admin |
| **Chức năng** | Xem tổng suất ăn hôm nay |
| **Trạng thái** | ✅ Hoàn thành |

**Logic nghiệp vụ:**
- Xem AI đăng ký hôm nay
- Xem AI không ăn hôm nay
- Tổng hợp số liệu

**Nội dung:**
- Tiêu đề: "BẢNG QUẢN TRỊ"
- Ngày hiện tại
- Thống kê: Tổng / Có ăn / Không ăn / Chưa đăng ký
- Danh sách chi tiết nhân viên (Tên, SĐT, Trạng thái)
- Tìm kiếm, Lọc theo trạng thái
- Nút: Xuất Excel, Nhắc nhở

**Mockup Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│  📊 BẢNG QUẢN TRỊ - Ngày 15/10/2024          [👤 Admin] [🚪]│
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Tổng: 170 nhân viên                                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ 🍽️ CÓ ĂN    │  │ ❌ KHÔNG ĂN │  │ ⏳ CHƯA ĐĂNG │       │
│  │    142       │  │     28      │  │      0       │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│                                                             │
│  Tìm kiếm: [________________] [Lọc: Tất cả ▼]            │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ STT │ Họ tên        │ SĐT          │ Trạng thái    │   │
│  ├─────┼───────────────┼──────────────┼───────────────┤   │
│  │  1  │ Nguyễn Văn A  │ 0912xxx456   │ 🍽️ Có ăn    │   │
│  │  2  │ Trần Thị B    │ 0933xxx789   │ 🍽️ Có ăn    │   │
│  │  3  │ Lê Văn C      │ 0944xxx123   │ ❌ Không ăn  │   │
│  │  4  │ Phạm Xuân Hùng│ 0955xxx234   │ 🍽️ Có ăn    │   │
│  └─────┴───────────────┴──────────────┴───────────────┘   │
│                                                             │
│  [📥 Xuất Excel] [📢 Nhắc nhở] [👥 Nhân sự]               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### 5.2 Quản lý nhân sự `/admin/employees`

| Thuộc tính | Giá trị |
|------------|---------|
| **Route** | `/admin/employees` |
| **File** | `app/admin/employees/page.tsx` |
| **Vai trò** | Admin |
| **Chức năng** | CRUD nhân viên + Hủy cơm hàng loạt |
| **Trạng thái** | ⬜ Cần tạo |

**Tính năng:**
- Thêm nhân viên mới
- Sửa thông tin nhân viên
- Xóa nhân viên
- Import từ Excel
- **Hủy cơm cho 1 hoặc nhiều nhân viên**

**Hủy cơm hàng loạt:**
- Chọn 1 hoặc nhiều nhân viên
- Chọn khoảng thời gian (Từ ngày → Đến ngày / Tuần này / Tháng này)
- Chọn lý do (Đi công trường, Nghỉ phép, Công tác, Khác)

**Mockup Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│  👥 QUẢN LÝ NHÂN SỰ                        [👤 Admin] [🚪]│
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [+ Thêm nhân viên] [📁 Import Excel] [⏸️ Hủy cơm]        │
│                                                             │
│  Tìm kiếm: [________________] [Lọc: Tất cả ▼]             │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ☐ │ Họ tên         │ Username │ SĐT          │ H.động│   │
│  ├────┼────────────────┼──────────┼──────────────┼────────┤   │
│  │ ☐ │ Nguyễn Văn A   │ minhnv   │ 0912xxx456   │ [S][X] │   │
│  │ ☐ │ Trần Thị B     │ bantt    │ 0933xxx789   │ [S][X] │   │
│  │ ☑ │ Lê Văn C       │ clv     │ 0944xxx123   │ [S][X] │   │
│  │ ☐ │ Phạm Xuân Hùng │ hungpx   │ 0955xxx234   │ [S][X] │   │
│  └────┴────────────────┴──────────┴──────────────┴────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘

Modal Hủy cơm hàng loạt:
┌─────────────────────────────────────────────────────────────┐
│  ⏸️ HỦY BÁO CƠM                                            │
│                                                             │
│  Đã chọn: 1 nhân viên                                       │
│  ├── Lê Văn C (clv)                                        │
│                                                             │
│  Khoảng thời gian:                                          │
│  ○ Từ: [15/10/2024] → Đến: [21/10/2024]                   │
│  ○ Tuần này (15/10 - 21/10)                               │
│  ○ Tháng này (15/10 - 31/10)                              │
│                                                             │
│  Lý do: [Đi công trường ▼]                                 │
│  Ghi chú: [________________________________]               │
│                                                             │
│           [Hủy báo cơm] [Đóng]                             │
└─────────────────────────────────────────────────────────────┘
```

---

### 5.3 Báo cáo `/admin/reports`

| Thuộc tính | Giá trị |
|------------|---------|
| **Route** | `/admin/reports` |
| **File** | `app/admin/reports/page.tsx` |
| **Vai trò** | Admin |
| **Chức năng** | Xuất báo cáo Excel |
| **Trạng thái** | ⬜ Cần tạo |

**Tùy chọn thời gian:**
- Theo ngày: Chọn ngày cụ thể
- Theo tuần: Tuần hiện tại hoặc tuần trước
- Theo tháng: Tháng hiện tại hoặc tháng trước

**Thông tin xuất:**
- Tên nhân viên
- SĐT (Số điện thoại)
- Ngày đăng ký

**Mockup Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│  📥 XUẤT BÁO CÁO                          [👤 Admin] [🚪] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Chọn thời gian:                                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                    │
│  │📅 Theo   │ │📆 Theo   │ │📊 Theo   │                    │
│  │  ngày    │ │  tuần    │ │  tháng   │                    │
│  └──────────┘ └──────────┘ └──────────┘                    │
│                                                             │
│  Ngày: [15/10/2024 ▼]                                      │
│  ─ HOẶC ─                                                  │
│  Tuần: [Tuần 42 (14-20/10) ▼]                              │
│  ─ HOẶC ─                                                  │
│  Tháng: [Tháng 10/2024 ▼]                                 │
│                                                             │
│  [🔍 Xem trước]                                            │
│                                                             │
│  ─────────────────────────────────────────────              │
│  BẢNG XEM TRƯỚC:                                           │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ STT │ Họ và tên      │ SĐT          │ Ngày        │   │
│  ├─────┼────────────────┼──────────────┼─────────────┤   │
│  │  1  │ Nguyen Van A   │ 0912xxx456  │ T3, 15/10   │   │
│  │  2  │ Tran Thi B     │ 0933xxx789  │ T3, 15/10   │   │
│  │  3  │ Le Van C       │ 0944xxx123  │ T4, 16/10   │   │
│  └─────┴────────────────┴──────────────┴─────────────┘   │
│                                                             │
│  Tổng cộng: 3 suất                                         │
│                                                             │
│                 [📥 Tải xuống Excel]                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Route Protection

### Bảng quyền truy cập

```
┌─────────────────────────────────────────────────────────────┐
│                      ROUTE PROTECTION                       │
├───────────────────┬──────────────┬──────────────┬──────────┤
│ Route             │ Public       │ Nhân viên    │ Admin    │
├───────────────────┼──────────────┼──────────────┼──────────┤
│ /login            │ ✅           │ Redirect     │ Redirect │
│ /book             │ ❌ Login     │ ✅           │ ✅       │
│ /my-history       │ ❌ Login     │ ✅           │ ✅       │
│ /admin/dashboard  │ ❌ Login     │ ❌ 403       │ ✅       │
│ /admin/employees  │ ❌ Login     │ ❌ 403       │ ✅       │
│ /admin/reports    │ ❌ Login     │ ❌ 403       │ ✅       │
└───────────────────┴──────────────┴──────────────┴──────────┘

Chú thích:
✅ = Cho phép truy cập
❌ Login = Yêu cầu đăng nhập
❌ 403 = Cấm truy cập (không đủ quyền)
Redirect = Chuyển hướng đến trang khác
```

### Luồng điều hướng sau login

```
/login (chưa đăng nhập)
    │
    │ Đăng nhập thành công
    │
    ▼
┌─────────────────────────────────────┐
│ Kiểm tra role từ JWT/response       │
└─────────────────────────────────────┘
    │
    ├── role = "admin"
    │       │
    │       ▼
    │    /admin/dashboard
    │
    └── role = "employee"
            │
            ▼
         /book
```

---

## 7. Navigation Sidebar

### Nhân viên Sidebar

```
┌─────────────────────────┐
│  🍽️ BaoCom              │
├─────────────────────────┤
│                         │
│  📝 Báo cơm             │ → /book
│  📜 Lịch sử             │ → /my-history
│                         │
├─────────────────────────┤
│  👤 hungpx              │
│  🚪 Đăng xuất           │ → /login
└─────────────────────────┘
```

### Admin Sidebar

```
┌─────────────────────────┐
│  🍽️ BaoCom              │
│     (Admin)             │
├─────────────────────────┤
│                         │
│  📊 Dashboard           │ → /admin/dashboard
│  👥 Nhân sự             │ → /admin/employees
│  📥 Báo cáo             │ → /admin/reports
│                         │
├─────────────────────────┤
│  👤 Admin              │
│  🚪 Đăng xuất           │ → /login
└─────────────────────────┘
```

---

## Phụ lục

### Tổng hợp Routes

| # | Route | File | Chức năng | Vai trò | Trạng thái |
|---|-------|------|-----------|---------|------------|
| 1 | `/login` | `login/page.tsx` | Đăng nhập | Public | ✅ |
| 2 | `/book` | `book/page.tsx` | Báo cơm | NV, Admin | ✅ |
| 3 | `/my-history` | `history/page.tsx` | Lịch sử | NV, Admin | ⬜ |
| 4 | `/admin/dashboard` | `dashboard/page.tsx` | Dashboard | Admin | ✅ |
| 5 | `/admin/employees` | `employees/page.tsx` | Nhân sự + Hủy cơm | Admin | ⬜ |
| 6 | `/admin/reports` | `reports/page.tsx` | Xuất Excel | Admin | ⬜ |

### Checklist khi tạo route mới

- [ ] Tạo file `page.tsx` trong route tương ứng
- [ ] Thêm vào sidebar navigation
- [ ] Kiểm tra route protection (auth guard)
- [ ] Responsive layout
- [ ] Loading states
- [ ] Error handling