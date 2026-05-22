# Spec: Admin Quản lý Nhân Sự - Credentials Management

**Date:** 2026-05-22  
**Status:** Draft

---

## 1. Overview

Cải thiện trang Nhân Sự của admin để:
- Đơn giản hóa việc tạo nhân viên (chỉ cần nhập họ tên, phần còn lại tự động)
- Hiển thị danh sách nhân viên dạng bảng thay vì card
- Cho phép xem credentials (username/password) của từng nhân viên

---

## 2. UI Changes

### 2.1 Danh sách nhân viên → Bảng

**Layout hiện tại:** Card list (mỗi nhân viên 1 card với avatar, tên, username, action buttons)

**Layout mới:** Table với các cột:
| # | Tên | Username | SĐT | Phòng ban | Trạng thái | Actions |

- Click vào row → mở modal chi tiết
- Hover row → highlight background
- Responsive: horizontal scroll trên mobile

### 2.2 Modal Thêm/Sửa Nhân viên

**Trường input:**
| Trường | Bắt buộc | Ghi chú |
|--------|----------|---------|
| Họ và tên | ✅ | Input text |
| SĐT | ❌ | Input tel, optional |
| Email | ❌ | Input email, optional |
| Phòng ban | ❌ | Select dropdown |

**Logic auto-generate:**
- **Username:** Lấy ký tự cuối của họ + ký tự đầu của tên + ký tự đầu phòng ban (nếu chọn)
  - VD: "Phạm Xuân Hùng" + phòng "Kỹ thuật" → `hungpx` + `k` = `hungpxk`
  - Nếu trùng → thêm số: `hungpxk2`, `hungpxk3`,...
- **Password:** Random 8 ký tự (a-z, 0-9)
- Preview username trước khi submit

**Sau khi tạo thành công:**
- Hiện notification thành công
- Credentials được lưu (không hiện popup, admin xem trong modal chi tiết)

### 2.3 Modal Chi tiết Nhân viên

**Hiển thị thông tin:**
| Trường | Giá trị |
|--------|---------|
| Họ và tên | Text |
| Username | Text + copy button |
| Password | `••••••••` + toggle hiện/ẩn + copy |
| SĐT | Text |
| Email | Text |
| Phòng ban | Badge |
| Trạng thái | Badge (Đang hoạt động/Khóa) |
| Ngày tạo | Format: DD/MM/YYYY |

**Actions:**
- Toggle hiện/ẩn password
- Copy username
- Copy password
- Sửa thông tin
- Khóa/Mở khóa tài khoản

---

## 3. Backend Changes

### 3.1 API Tạo Nhân viên

**Request:**
```typescript
POST /api/users
{
  name: string,        // Required
  phone?: string,      // Optional
  email?: string,      // Optional  
  department?: string  // Optional
}
```

**Response:**
```typescript
{
  user: {
    id: string,
    name: string,
    username: string,  // Auto-generated
  },
  credentials: {
    username: string,
    password: string   // Plain text, chỉ trả về khi tạo
  }
}
```

### 3.2 API Xem Credentials

**Request:**
```typescript
GET /api/users/{id}/credentials
// or include in existing GET /api/users/{id}
```

**Response:**
```typescript
{
  credentials: {
    username: string,
    password: string  // Plain text, cần auth/admin check
  }
}
```

### 3.3 Logic Generate Username

```typescript
function generateUsername(name: string, department?: string): string {
  // Tách tên
  const parts = name.trim().split(/\s+/)
  const lastName = parts[parts.length - 1].toLowerCase().replace(/[^a-z]/g, '')
  
  // Lấy ký tự đầu của từng từ
  const initials = parts.map(p => p[0]).join('').toLowerCase()
  
  // Tạo base username
  let username = initials.slice(-3) + lastName.slice(0, 3)
  
  // Thêm ký tự phòng ban nếu có
  if (department) {
    const deptCode = department.charAt(0).toLowerCase()
    username += deptCode
  }
  
  // Check trùng, thêm số nếu cần
  // ...
  return username
}
```

---

## 4. Database Schema

**Thêm bảng UserDetails** (nếu chưa có):
```sql
CREATE TABLE user_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  phone VARCHAR(20),
  email VARCHAR(255),
  department VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)
```

Hoặc thêm columns vào bảng `users` hiện tại:
```sql
ALTER TABLE users ADD COLUMN phone VARCHAR(20);
ALTER TABLE users ADD COLUMN email VARCHAR(255);
ALTER TABLE users ADD COLUMN department VARCHAR(100);
```

---

## 5. Security

- Password chỉ hiện plain text khi admin yêu cầu (click toggle)
- API credentials chỉ accessible bởi admin role
- Rate limit: không giới hạn nhưng log action

---

## 6. File Changes

### Frontend
- `app/admin/employees/page.tsx` - Viết lại với table layout, modal chi tiết

### Backend
- `src/dto/UserDTO.ts` - Thêm phone, email, department
- `src/controllers/UsersController.ts` - Logic generate username + return credentials
- `src/services/UserService.ts` - Thêm create với auto-gen credentials
- `src/repositories/UserRepository.ts` - Check trùng username

---

## 7. Implementation Order

1. Backend: Update DTO, Controller, Service cho create với credentials
2. Backend: API xem credentials
3. Frontend: Đổi table layout
4. Frontend: Modal thêm nhân viên với auto-gen preview
5. Frontend: Modal chi tiết với credentials
6. Test: Tạo nhân viên, xem credentials