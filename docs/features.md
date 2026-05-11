# Tài liệu Chức năng Hệ thống Báo Cơm

> Phiên bản: 2.0  
> Ngày: 2026-05-10  
> Trạng thái: Final  
> Cập nhật: Business logic chính xác đã xác nhận

---

## Mục lục

1. [Tổng quan hệ thống](#1-tổng-quan-hệ-thống)
2. [Vai trò người dùng](#2-vai-trò-người-dùng)
3. [Chức năng Nhân viên](#3-chức-năng-nhân-viên)
4. [Chức năng Admin](#4-chức-năng-admin)
5. [So sánh quyền truy cập](#5-so-sánh-quyền-truy-cập)
6. [Ghi chú nghiệp vụ](#6-ghi-chú-nghiệp-vụ)

---

## 1. Tổng quan hệ thống

### Mô tả

Hệ thống **Báo Cơm** (BaoCom) giúp quản lý việc đăng ký suất ăn trưa cho nhân viên công ty. Nhân viên đăng ký suất ăn hàng ngày (mặc định luôn có ăn), Admin xem tổng hợp và quản lý nhân sự.

### Mục tiêu

- Đơn giản hóa việc đăng ký suất ăn
- Giúp bếp nấu biết chính xác số lượng suất ăn
- Giảm lãng phí thực phẩm

### Nguyên tắc cốt lõi

| Nguyên tắc | Mô tả |
|------------|-------|
| **Mặc định CÓ ĂN** | Nhân viên luôn được đăng ký ăn trừ khi tự tick "Không ăn" |
| **Deadline 00:00** | Tối mỗi ngày chốt báo cơm cho ngày hôm sau |
| **Chỉ tương lai** | Chỉ báo được cho ngày mai + tương lai, không báo được cho hôm nay |

---

## 2. Vai trò người dùng

Hệ thống có **2 vai trò** duy nhất:

| Vai trò | Mô tả | Số lượng | Đăng nhập |
|---------|-------|----------|-----------|
| **Admin** | Cook / Người quản lý bếp | 1-2 người | Username riêng (vd: admin) |
| **Nhân viên** | Người dùng đăng ký suất ăn | Nhiều người | Username theo quy tắc: hungpx |

### Quy tắc tạo Username

```
Công thức: <tên cuối không dấu><viết tắt họ và tên đệm>

Ví dụ:
├── Phạm Xuân Hùng → hungpx
├── Nguyễn Văn Minh → minhnv
├── Trần Thị Lan Anh → lanhtt
├── Lê Hoàng Nam → namlh
└── Đặng Thị Mai Linh → linhdtm
```

---

## 3. Chức năng Nhân viên

### 3.1 Đăng nhập

| Thuộc tính | Mô tả |
|------------|-------|
| **Mô tả** | Nhân viên đăng nhập vào hệ thống |
| **Trường** | Username + Password |
| **Username** | Theo quy tắc: hungpx (Phạm Xuân Hùng) |
| **Password** | Do Admin cấp (random) |
| **Sau login** | Redirect đến `/book` |
| **Route** | `/login` |
| **Trạng thái** | ✅ Hoàn thành |

### 3.2 Báo cơm

| Thuộc tính | Mô tả |
|------------|-------|
| **Mô tả** | Nhân viên đăng ký suất ăn |
| **Quy tắc** | Mặc định: CÓ ĂN (không cần tick) |
| **Ngoại lệ** | Tick "Không ăn" cho những ngày không ăn |
| **Giới hạn** | Chỉ báo được cho ngày mai + tương lai |
| **Deadline** | 00:00 mỗi đêm chốt cho ngày hôm sau |
| **Route** | `/book` |
| **Trạng thái** | ✅ Hoàn thành |

**Giao diện báo cơm:**

```
┌─────────────────────────────────────────────────────────────┐
│  📝 BÁO CƠM                                                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Hôm nay: Thứ Hai, 15/10/2024                               │
│  Deadline hôm nay: 00:00 (đã chốt cho ngày mai)             │
│                                                             │
│  📅 Lịch đăng ký của bạn:                                  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  T3, 16/10    │  T4, 17/10    │  T5, 18/10         │   │
│  │  ─────────────│───────────────│─────────────        │   │
│  │       🍽️      │       🍽️      │       🍽️          │   │
│  │    Có ăn      │    Có ăn      │    Có ăn          │   │
│  │  ✅ Mặc định  │  ✅ Mặc định  │  ✅ Mặc định      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Đánh dấu những ngày KHÔNG ĂN:                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  ☐ T3, 16/10 (Không ăn)                             │   │
│  │  ☑ T4, 17/10 (Không ăn) ← Đã tick                  │   │
│  │  ☐ T5, 18/10 (Không ăn)                             │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [Cập nhật]                                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3.3 Xem lịch sử đăng ký

| Thuộc tính | Mô tả |
|------------|-------|
| **Mô tả** | Xem lịch sử đăng ký của BẢN THÂN |
| **Phạm vi** | CHỈ xem được lịch sử của mình |
| **Thông tin** | Ngày, Trạng thái (Có ăn / Không ăn), Ghi chú |
| **Bộ lọc** | Theo tuần / Theo tháng / Tùy chọn ngày |
| **Route** | `/my-history` |
| **Trạng thái** | ⬜ Cần tạo |

**Giao diện lịch sử:**

```
┌─────────────────────────────────────────────────────────────┐
│  📜 LỊCH SỬ ĐĂNG KÝ                                         │
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

## 4. Chức năng Admin

### 4.1 Đăng nhập Admin

| Thuộc tính | Mô tả |
|------------|-------|
| **Mô tả** | Admin đăng nhập quản lý hệ thống |
| **Username** | Riêng (vd: admin, cook, manager) |
| **Password** | Do Super Admin cấp |
| **Sau login** | Redirect đến `/admin/dashboard` |
| **Route** | `/login` (dùng chung, kiểm tra role) |
| **Trạng thái** | ✅ Hoàn thành |

### 4.2 Dashboard Admin

| Thuộc tính | Mô tả |
|------------|-------|
| **Mô tả** | Xem tổng hợp báo cơm ngày hôm nay |
| **Thông tin** | Tổng suất ăn, Danh sách nhân viên |
| **Tính năng** | |
| | - Thống kê: Có ăn / Không ăn |
| | - Danh sách chi tiết: Tên, SĐT, Trạng thái |
| | - Tìm kiếm nhân viên |
| | - Lọc theo trạng thái |
| **Route** | `/admin/dashboard` |
| **Trạng thái** | ✅ Hoàn thành |

**Giao diện Dashboard:**

```
┌─────────────────────────────────────────────────────────────┐
│  📊 BẢNG QUẢN TRỊ - Ngày 15/10/2024 (T3)                   │
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
│  [📥 Xuất Excel] [📢 Nhắc nhở]                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4.3 Quản lý nhân sự

| Thuộc tính | Mô tả |
|------------|-------|
| **Mô tả** | CRUD nhân viên + Hủy cơm hàng loạt |
| **Tính năng** | |
| | - Thêm nhân viên mới |
| | - Sửa thông tin nhân viên |
| | - Xóa nhân viên |
| | - Import danh sách từ Excel |
| | - **Hủy cơm cho 1 hoặc nhiều nhân viên** |
| **Route** | `/admin/employees` |
| **Trạng thái** | ⬜ Cần tạo |

**Hủy cơm hàng loạt:**

```
┌─────────────────────────────────────────────────────────────┐
│  ⏸️ HỦY BÁO CƠM                                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Chọn nhân viên:                                            │
│  ☑ Nguyễn Văn A                                           │
│  ☑ Trần Thị B                                             │
│  ☐ Lê Văn C                                               │
│  ☑ Phạm Xuân Hùng                                         │
│                                                             │
│  ─────────────────────────────────────────                  │
│  Chọn khoảng thời gian hủy:                                │
│  ○ Từ ngày: [__/__/____] → Đến ngày: [__/__/____]         │
│  ○ Tuần này (15/10 - 18/10)                               │
│  ○ Tháng này (15/10 - 31/10)                              │
│                                                             │
│  Lý do (tùy chọn):                                        │
│  [Đi công trường        ▼]                                │
│  [Nghỉ phép             ▼]                                │
│  [Công tác               ▼]                                │
│  [Khác: _________________]                                   │
│                                                             │
│  Ghi chú: [________________________________]               │
│                                                             │
│           [Hủy báo cơm] [Đóng]                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4.4 Xuất báo cáo Excel

| Thuộc tính | Mô tả |
|------------|-------|
| **Mô tả** | Xuất file báo cáo cho bếp nấu |
| **Thông tin xuất** | Tên + SĐT theo ngày/tuần/tháng |
| **Tùy chọn thời gian** | |
| | - Theo ngày: Chọn ngày cụ thể |
| | - Theo tuần: Tuần hiện tại hoặc tuần trước |
| | - Theo tháng: Tháng hiện tại hoặc tháng trước |
| **Định dạng** | .xlsx |
| **Route** | `/admin/reports` |
| **Trạng thái** | ⬜ Cần tạo |

**File Excel xuất ra:**

```
┌─────────────────────────────────────────────────────────────┐
│  BAO COM - BAO CAO SUAT AN                    Ngay: 15/10   │
├─────────────────────────────────────────────────────────────┤
│  STT │ Họ và tên          │ SĐT          │ Ngày          │
├──────┼────────────────────┼──────────────┼───────────────┤
│  1   │ Nguyen Van A       │ 0912xxx456   │ T3, 15/10     │
│  2   │ Tran Thi B         │ 0933xxx789   │ T3, 15/10     │
│  3   │ Le Van C           │ 0944xxx123   │ T4, 16/10     │
│  4   │ Nguyen Van A       │ 0912xxx456   │ T4, 16/10     │
├──────┼────────────────────┼──────────────┼───────────────┤
│      │                    │   Tổng cộng: │    12 suất    │
└──────┴────────────────────┴──────────────┴───────────────┘
```

---

## 5. So sánh quyền truy cập

| Chức năng | Admin | Nhân viên |
|-----------|:-----:|:---------:|
| **Đăng nhập** | ✅ | ✅ |
| **Dashboard xem suất ăn** | ✅ | ❌ |
| **Báo cơm** | ✅ | ✅ |
| **Xem lịch sử đăng ký** | ✅ (toàn bộ) | ✅ (của mình) |
| **Quản lý nhân sự** | ✅ | ❌ |
| **Hủy cơm nhân viên** | ✅ | ❌ |
| **Xuất báo cáo Excel** | ✅ | ❌ |

---

## 6. Ghi chú nghiệp vụ

### 6.1 Deadline

| Quy tắc | Mô tả |
|---------|-------|
| **Thời gian** | 00:00 mỗi đêm |
| **Hành động** | Chốt báo cơm cho ngày hôm sau |
| **Ảnh hưởng** | Nhân viên không báo được cho hôm nay |

### 6.2 Mặc định đăng ký

| Quy tắc | Mô tả |
|---------|-------|
| **Mặc định** | Tất cả nhân viên luôn được đăng ký CÓ ĂN |
| **Ngoại lệ** | Nhân viên tự tick "Không ăn" cho ngày cần |
| **Admin hủy** | Admin có thể hủy hàng loạt cho nhân viên |

### 6.3 Quy tắc Username

```
Công thức: <tên cuối không dấu><viết tắt họ + tên đệm>

Ví dụ:
├── Phạm Xuân Hùng → hungpx (Hùng + P.Xuân)
├── Nguyễn Văn Minh → minhnv (Minh + N.Văn)
├── Trần Thị Lan Anh → lanhtt (Lan + T.Thị)
└── Lê Hoàng Nam → namlh (Nam + L.Hoàng)
```

### 6.4 Thông tin nhân viên cần lưu

| Trường | Bắt buộc | Mô tả |
|--------|:--------:|-------|
| Họ và tên | ✅ | Tên đầy đủ |
| Username | ✅ | Theo quy tắc, DUY NHẤT |
| Password | ✅ | Random, do admin cấp |
| SĐT | ✅ | Số điện thoại liên lạc |
| Email | ⬜ | Không bắt buộc |
| Phòng ban | ⬜ | Không bắt buộc |
| Ghi chú | ⬜ | Thông tin bổ sung |

---

## Phụ lục

### Từ viết tắt

| Từ viết tắt | Giải nghĩa |
|-------------|------------|
| CÓ ĂN | Nhân viên đăng ký ăn bữa trưa |
| KHÔNG ĂN | Nhân viên không ăn bữa trưa |
| Deadline | Thời điểm chốt báo cơm (00:00) |
| Admin | Người quản lý hệ thống |

### Câu hỏi thường gặp

**Q: Nhân viên có thể báo cho ngày hôm nay không?**  
A: Không. Deadline 00:00 đã chốt báo cơm cho hôm nay. Chỉ báo được cho ngày mai + tương lai.

**Q: Nhân viên quên tick "Không ăn" thì sao?**  
A: Mặc định là CÓ ĂN, nên nhân viên không cần tick gì nếu đi ăn.

**Q: Admin có thể hủy cơm cho bao nhiêu người?**  
A: Có thể hủy cho 1 người hoặc NHIỀU người cùng lúc (hàng loạt).

**Q: Xuất Excel bao gồm những gì?**  
A: Tên nhân viên, SĐT, và ngày đăng ký (theo tuần/tháng).