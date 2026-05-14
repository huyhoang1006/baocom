# UAT Test Cases: Đăng ký và Luồng Đặt món

**Loại tài liệu:** Black Box Acceptance Test Specification
**Đối tượng test:** Hệ thống Đăng ký & Đặt món (Baocom)
**Ngày:** 2026-05-14
**Phạm vi:** Create, View, Update, Delete operations; Date validation; Status transitions

---

## 1. Tổng quan Hệ thống

### 1.1 Entity Registration (Đăng ký)

| Trường | Loại | Mô tả |
|--------|------|-------|
| id | string (UUID) | Định danh duy nhất |
| userId | string (UUID) | Chủ sở hữu đăng ký |
| date | Date | Ngày đăng ký |
| status | enum | `eating` hoặc `not_eating` |
| note | string (nullable) | Ghi chú tùy chọn |

### 1.2 Quy ước Format Status

| Layer | Format | Ví dụ |
|-------|--------|-------|
| API | snake_case | `eating`, `not_eating` |
| UI | kebab-case | `eating`, `not-eating` |

### 1.3 Business Rules (Quy tắc nghiệp vụ)

- **Một đăng ký mỗi người mỗi ngày** — được enforce qua upsert trên unique constraint `(userId, date)`
- **Hành vi mặc định**: Người dùng sẽ ăn trưa trừ khi được đánh dấu rõ ràng là "không ăn"
- **Chặn ngày trước**: Không thể đăng ký cho ngày trước hôm nay trên trang `/book`
- **Ủy quyền**: Người dùng không phải admin chỉ có thể quản lý đăng ký của chính họ

---

## 2. Yêu cầu Dữ liệu Test

### 2.1 Người dùng Test

| Tên đăng nhập | Mật khẩu | Vai trò | Mục đích |
|---------------|----------|---------|----------|
| admin | admin123 | admin | Full access testing, IDOR verification |
| hungpx | (bất kỳ) | employee | Regular user flow testing |

### 2.2 Phạm vi Ngày

| Phạm vi | Format | Cách sử dụng |
|---------|--------|--------------|
| Hôm nay | `YYYY-MM-DD` | Baseline cho tất cả date tests |
| Tương lai (1-7 ngày) | `YYYY-MM-DD` | Booking flow tests |
| Quá khứ (1-7 ngày trước) | `YYYY-MM-DD` | Past date blocking tests |
| Ngày đầu tháng | `YYYY-MM-01` | Edge case testing |
| Ngày cuối tháng | `YYYY-MM-DD` | Last day of month tests |

### 2.3 Giá trị Status

| Giá trị API | Hiển thị UI | Mô tả |
|-------------|-------------|-------|
| `eating` | "Ăn" (xanh lá) | Người dùng sẽ ăn |
| `not_eating` | "Không ăn" (đỏ) | Người dùng sẽ không ăn |

---

## 3. API Test Cases

### 3.1 Tạo Đăng ký

#### TC-API-001: Tạo đăng ký cho ngày tương lai (eating)

**Ưu tiên:** P0
**Endpoint:** `POST /api/registrations`
**Auth:** Bắt buộc (bất kỳ vai trò nào)

**Request:**
```json
{
  "date": "2026-05-20",
  "status": "eating"
}
```

**Các bước thực hiện:**
1. Gửi POST request đến `/api/registrations` với JSON body như trên
2. Sử dụng authentication cookie hợp lệ

**Kết quả mong đợi:**
- Status: 201 Created
- Response chứa registration object với UUID được tạo
- Date khớp với ngày yêu cầu
- Status bằng `eating`

**Tiêu chí đạt:** Đăng ký được tạo thành công với status eating

---

#### TC-API-002: Tạo đăng ký cho ngày tương lai (not_eating)

**Ưu tiên:** P0
**Endpoint:** `POST /api/registrations`
**Auth:** Bắt buộc (bất kỳ vai trò nào)

**Request:**
```json
{
  "date": "2026-05-21",
  "status": "not_eating"
}
```

**Các bước thực hiện:**
1. Gửi POST request đến `/api/registrations`
2. Sử dụng authentication cookie hợp lệ

**Kết quả mong đợi:**
- Status: 201 Created
- Response chứa registration với status `not_eating`

**Tiêu chí đạt:** Đăng ký được tạo với status not_eating

---

#### TC-API-003: Tạo đăng ký - trùng lặp (hành vi upsert)

**Ưu tiên:** P1
**Endpoint:** `POST /api/registrations`
**Auth:** Bắt buộc

**Scenario:** Registration đã tồn tại cho user + date

**Các bước thực hiện:**
1. Đăng ký đã tồn tại cho user hôm nay với status eating
2. Gửi POST request để tạo đăng ký cho cùng ngày với status not_eating

**Request:**
```json
{
  "date": "2026-05-20",
  "status": "not_eating"
}
```

**Kết quả mong đợi:**
- Status: 200 OK (upsert - cập nhật existing, không error)
- Existing registration status được cập nhật thành `not_eating`
- Registration ID không đổi (không tạo record mới)

**Tiêu chí đạt:** Hệ thống upserts thay vì tạo duplicate

---

#### TC-API-004: Tạo đăng ký - thiếu date

**Ưu tiên:** P0
**Endpoint:** `POST /api/registrations`
**Auth:** Bắt buộc

**Request:**
```json
{
  "status": "eating"
}
```

**Các bước thực hiện:**
1. Gửi POST request với body không có trường date
2. Sử dụng authentication cookie hợp lệ

**Kết quả mong đợi:**
- Status: 400 Bad Request
- Error: `"Missing date or status"`

**Tiêu chí đạt:** Validation reject request thiếu date

---

#### TC-API-005: Tạo đăng ký - thiếu status

**Ưu tiên:** P0
**Endpoint:** `POST /api/registrations`
**Auth:** Bắt buộc

**Request:**
```json
{
  "date": "2026-05-20"
}
```

**Các bước thực hiện:**
1. Gửi POST request với body không có trường status
2. Sử dụng authentication cookie hợp lệ

**Kết quả mong đợi:**
- Status: 400 Bad Request
- Error: `"Missing date or status"`

**Tiêu chí đạt:** Validation reject request thiếu status

---

#### TC-API-006: Tạo đăng ký - giá trị status không hợp lệ

**Ưu tiên:** P0
**Endpoint:** `POST /api/registrations`
**Auth:** Bắt buộc

**Request:**
```json
{
  "date": "2026-05-20",
  "status": "maybe"
}
```

**Các bước thực hiện:**
1. Gửi POST request với status không hợp lệ
2. Sử dụng authentication cookie hợp lệ

**Kết quả mong đợi:**
- Status: 400 Bad Request
- Error: `"Invalid status"`

**Tiêu chí đạt:** Validation reject status không hợp lệ

---

#### TC-API-007: Tạo đăng ký - format date không hợp lệ

**Ưu tiên:** P1
**Endpoint:** `POST /api/registrations`
**Auth:** Bắt buộc

**Request:**
```json
{
  "date": "05-20-2026",
  "status": "eating"
}
```

**Các bước thực hiện:**
1. Gửi POST request với date format sai
2. Sử dụng authentication cookie hợp lệ

**Kết quả mong đợi:**
- Hành vi: System cố parse; format không hợp lệ có thể gây 500 hoặc tạo với date sai
- Ghi chú: Document actual behavior và thêm vào edge case list

**Tiêu chí đạt:** Hệ thống xử lý date format không hợp lệ

---

#### TC-API-008: Tạo đăng ký - không xác thực

**Ưu tiên:** P0
**Endpoint:** `POST /api/registrations`
**Auth:** Không có

**Request:**
```json
{
  "date": "2026-05-20",
  "status": "eating"
}
```

**Các bước thực hiện:**
1. Gửi POST request KHÔNG có authentication cookie

**Kết quả mong đợi:**
- Status: 401 Unauthorized

**Tiêu chí đạt:** Request không xác thực bị từ chối

---

### 3.2 Lấy Registrations

#### TC-API-009: Lấy tất cả registrations cho user hiện tại

**Ưu tiên:** P0
**Endpoint:** `GET /api/registrations`
**Auth:** Bắt buộc (employee)

**Các bước thực hiện:**
1. Gửi GET request đến `/api/registrations`
2. Sử dụng authentication cookie của employee

**Kết quả mong đợi:**
- Status: 200 OK
- Returns chỉ registrations của authenticated user
- Mỗi registration bao gồm: id, date, status, note, user (name, username)

**Tiêu chí đạt:** API trả về đúng registrations của user

---

#### TC-API-010: Lấy registrations với bộ lọc date range

**Ưu tiên:** P1
**Endpoint:** `GET /api/registrations?startDate=2026-05-01&endDate=2026-05-31`
**Auth:** Bắt buộc

**Các bước thực hiện:**
1. Gửi GET request với query params startDate và endDate
2. Sử dụng authentication cookie hợp lệ

**Kết quả mong đợi:**
- Status: 200 OK
- Returns registrations trong inclusive date range
- Response: `{ registrations: [...] }`

**Tiêu chí đạt:** API filter đúng theo date range

---

#### TC-API-011: Lấy registrations - kết quả rỗng (không có registrations)

**Ưu tiên:** P2
**Endpoint:** `GET /api/registrations`
**Auth:** Bắt buộc (user mới không có lịch sử)

**Các bước thực hiện:**
1. Login sebagai user baru tanpa riwayat
2. Gửi GET request đến `/api/registrations`

**Kết quả mong đợi:**
- Status: 200 OK
- Response: `{ registrations: [] }`

**Tiêu chí đạt:** API trả về empty array khi không có data

---

#### TC-API-012: Lấy single registration by ID (chỉ admin)

**Ưu tiên:** P0
**Endpoint:** `GET /api/registrations/[id]`
**Auth:** Yêu cầu vai trò admin

**Các bước thực hiện:**
1. Gửi GET request với admin authentication cookie
2. Sử dụng registration ID hợp lệ

**Kết quả mong đợi:**
- Status: 200 OK
- Returns registration object
- Admin có thể truy cập bất kỳ registration của user nào

**Tiêu chí đạt:** Admin có thể xem tất cả registrations

---

#### TC-API-013: Lấy single registration by ID - non-admin forbidden

**Ưu tiên:** P0
**Endpoint:** `GET /api/registrations/[id]`
**Auth:** Vai trò employee (không phải admin)

**Scenario:** Cố xem registration của user khác

**Các bước thực hiện:**
1. Login sebagai employee A
2. Gửi GET request đến registration ID của employee B

**Kết quả mong đợi:**
- Status: 403 Forbidden
- Error: `"Forbidden"`

**Tiêu chí đạt:** Employee không thể xem registration của người khác

---

#### TC-API-014: Lấy single registration - không tìm thấy

**Ưu tiên:** P1
**Endpoint:** `GET /api/registrations/[non-existent-id]`
**Auth:** Admin

**Các bước thực hiện:**
1. Gửi GET request với admin cookie và ID không tồn tại

**Kết quả mong đợi:**
- Status: 404 Not Found
- Error: `"Not found"`

**Tiêu chí đạt:** API trả về 404 cho không tìm thấy

---

### 3.3 Cập nhật Registration

#### TC-API-015: Cập nhật registration status (eating → not_eating)

**Ưu tiên:** P0
**Endpoint:** `PATCH /api/registrations/[id]`
**Auth:** Owner (hoặc admin)

**Request:**
```json
{
  "status": "not_eating"
}
```

**Các bước thực hiện:**
1. Login sebagai owner của registration
2. Gửi PATCH request với status mới

**Kết quả mong đợi:**
- Status: 200 OK
- Registration status được cập nhật thành `not_eating`

**Tiêu chí đạt:** Cập nhật status từ eating sang not_eating thành công

---

#### TC-API-016: Cập nhật registration status (not_eating → eating)

**Ưu tiên:** P0
**Endpoint:** `PATCH /api/registrations/[id]`
**Auth:** Owner

**Request:**
```json
{
  "status": "eating"
}
```

**Các bước thực hiện:**
1. Login sebagai owner của registration đang có status not_eating
2. Gửi PATCH request với status eating

**Kết quả mong đợi:**
- Status: 200 OK
- Registration status được cập nhật thành `eating`

**Tiêu chí đạt:** Cập nhật status từ not_eating sang eating thành công

---

#### TC-API-017: Cập nhật registration note

**Ưu tiên:** P1
**Endpoint:** `PATCH /api/registrations/[id]`
**Auth:** Owner

**Request:**
```json
{
  "note": "Vắng mặt vì công tác"
}
```

**Các bước thực hiện:**
1. Login sebagai owner
2. Gửi PATCH request với note mới

**Kết quả mong đợi:**
- Status: 200 OK
- Note field được cập nhật

**Tiêu chí đạt:** Cập nhật note thành công

---

#### TC-API-018: Cập nhật registration - kết hợp status và note

**Ưu tiên:** P1
**Endpoint:** `PATCH /api/registrations/[id]`
**Auth:** Owner

**Request:**
```json
{
  "status": "not_eating",
  "note": "Đi công tác"
}
```

**Các bước thực hiện:**
1. Login sebagai owner
2. Gửi PATCH request với cả status và note

**Kết quả mong đợi:**
- Status: 200 OK
- Cả hai fields được cập nhật

**Tiêu chí đạt:** Cập nhật nhiều fields cùng lúc thành công

---

#### TC-API-019: Cập nhật registration - status không hợp lệ

**Ưu tiên:** P0
**Endpoint:** `PATCH /api/registrations/[id]`
**Auth:** Owner

**Request:**
```json
{
  "status": "maybe"
}
```

**Các bước thực hiện:**
1. Login sebagai owner
2. Gửi PATCH request với status không hợp lệ

**Kết quả mong đợi:**
- Status: 400 Bad Request
- Registration không thay đổi

**Tiêu chí đạt:** Validation reject status không hợp lệ

---

#### TC-API-020: Cập nhật registration - IDOR (registration của user khác)

**Ưu tiên:** P0
**Endpoint:** `PATCH /api/registrations/[other-user-id]`
**Auth:** Employee (không phải owner)

**Các bước thực hiện:**
1. Login sebagai employee A
2. Gửi PATCH request đến registration ID của employee B

**Kết quả mong đợi:**
- Status: 403 Forbidden
- Error: `"Forbidden"`
- Registration không thay đổi

**Tiêu chí đạt:** User không thể sửa registration của người khác

---

#### TC-API-021: Cập nhật registration - không tìm thấy

**Ưu tiên:** P1
**Endpoint:** `PATCH /api/registrations/[non-existent-id]`
**Auth:** Bất kỳ

**Các bước thực hiện:**
1. Gửi PATCH request với ID không tồn tại

**Kết quả mong đợi:**
- Status: 404 Not Found
- Error: `"Not found"`

**Tiêu chí đạt:** API trả về 404 cho không tìm thấy

---

### 3.4 Xóa Registration

#### TC-API-022: Xóa registration (chỉ admin)

**Ưu tiên:** P0
**Endpoint:** `DELETE /api/registrations/[id]`
**Auth:** Yêu cầu vai trò admin

**Các bước thực hiện:**
1. Login sebagai admin
2. Gửi DELETE request với registration ID hợp lệ

**Kết quả mong đợi:**
- Status: 200 OK
- Response: `{ success: true }`
- Registration bị xóa khỏi database

**Tiêu chí đạt:** Admin có thể xóa registration

---

#### TC-API-023: Xóa registration - non-admin forbidden

**Ưu tiên:** P0
**Endpoint:** `DELETE /api/registrations/[id]`
**Auth:** Vai trò employee

**Các bước thực hiện:**
1. Login sebagai employee
2. Gửi DELETE request

**Kết quả mong đợi:**
- Status: 403 Forbidden
- Error: `"Forbidden"`
- Registration KHÔNG bị xóa

**Tiêu chí đạt:** Employee không thể xóa registration

---

#### TC-API-024: Xóa registration - không tìm thấy

**Ưu tiên:** P1
**Endpoint:** `DELETE /api/registrations/[non-existent-id]`
**Auth:** Admin

**Các bước thực hiện:**
1. Login jako admin
2. Gửi DELETE request với ID không tồn tại

**Kết quả mong đợi:**
- Status: 404 Not Found
- Error: `"Not found"`

**Tiêu chí đạt:** API trả về 404 cho không tìm thấy

---

## 4. UI Test Cases: Trang /book

### 4.1 Tải và Hiển thị Trang

#### TC-UI-B01: Trang book hiển thị 8 ngày bắt đầu từ hôm nay

**Ưu tiên:** P0
**UI Path:** `/book`
**Auth:** Employee (đã đăng nhập)

**Các bước thực hiện:**
1. Login sebagai employee
2. Điều hướng đến `/book`

**Kết quả mong đợi:**
- Trang hiển thị chính xác 8 day cards
- Card đầu tiên được gắn nhãn "Hôm nay" (Today badge)
- Các ngày được hiển thị theo thứ tự chronologically (hôm nay + 7 ngày tương lai)
- Mỗi card hiển thị: tên ngày (CN/T2/T3/etc), số ngày, chỉ báo status

**Tiêu chí đạt:** Hiển thị đúng 8 ngày với badge hôm nay

---

#### TC-UI-B02: Day card hiển thị status đúng

**Ưu tiên:** P0
**UI Path:** `/book`

**Scenario:** Người dùng có đăng ký hiện có

**Các bước thực hiện:**
1. Điều kiện tiên quyết: User có đăng ký cho ngày mai với status `eating`
2. Điều hướng đến `/book`

**Kết quả mong đợi:**
- Card ngày mai hiển thị chỉ báo status xanh "Ăn"
- Màu viền card: success (xanh lá)

**Tiêu chí đạt:** Status eating hiển thị đúng với màu xanh

---

#### TC-UI-B03: Day card hiển thị status "không ăn"

**Ưu tiên:** P0
**UI Path:** `/book`

**Scenario:** Người dùng đăng ký không ăn

**Các bước thực hiện:**
1. Điều kiện tiên quyết: User có đăng ký cho ngày mai với status `not_eating`
2. Điều hướng đến `/book`

**Kết quả mong đợi:**
- Card ngày mai hiển thị chỉ báo status đỏ "Không ăn"
- Màu viền card: error (đỏ)

**Tiêu chí đạt:** Status not_eating hiển thị đúng với màu đỏ

---

#### TC-UI-B04: Day card hiển thị status "chưa chọn" cho user mới

**Ưu tiên:** P0
**UI Path:** `/book`

**Scenario:** User mới không có registrations

**Các bước thực hiện:**
1. Login sebagai user không có lịch sử đăng ký
2. Điều hướng đến `/book`

**Kết quả mong đợi:**
- Tất cả 8 ngày hiển thị "Chưa chọn" (Not chosen) status
- Màu viền card: default (trung lập)

**Tiêu chí đạt:** User mới thấy "Chưa chọn" cho tất cả các ngày

---

#### TC-UI-B05: Stats hiển thị số lượng đúng

**Ưu tiên:** P1
**UI Path:** `/book`

**Các bước thực hiện:**
1. User có 3 registrations với status `eating`
2. Điều hướng đến `/book`

**Kết quả mong đợi:**
- Stat "Đã đăng ký" (Registered) hiển thị `3`
- Stat "Tuần này" (This week) hiển thị số ngày không phải quá khứ

**Tiêu chí đạt:** Stats hiển thị đúng số lượng

---

### 4.2 Luồng Chuyển đổi Status

#### TC-UI-B06: Chuyển từ "chưa chọn" sang "ăn"

**Ưu tiên:** P0
**UI Path:** `/book`

**Các bước thực hiện:**
1. Điều hướng đến `/book`
2. Click vào card ngày tương lai (không phải hôm nay)

**Kết quả mong đợi:**
- Status thay đổi từ "Chưa chọn" sang "Ăn"
- Viền card chuyển sang xanh lá
- Toast notification: "Đã đăng ký ăn" xuất hiện
- Toast tự động ẩn sau 3 giây
- Registration được tạo trong database với status `eating`

**Tiêu chí đạt:** Click chuyển thành eating và tạo registration

---

#### TC-UI-B07: Chuyển từ "ăn" sang "không ăn"

**Ưu tiên:** P0
**UI Path:** `/book`

**Các bước thực hiện:**
1. Điều kiện tiên quyết: User có registration `eating` cho ngày tương lai
2. Điều hướng đến `/book`
3. Click vào card ngày đó

**Kết quả mong đợi:**
- Status thay đổi từ "Ăn" sang "Không ăn"
- Viền card chuyển sang đỏ
- Toast notification: "Đã hủy" (hoặc "Đã đăng ký không ăn")
- Registration được cập nhật thành `not_eating` trong database

**Tiêu chí đạt:** Click chuyển từ eating sang not_eating

---

#### TC-UI-B08: Chuyển từ "không ăn" sang "ăn"

**Ưu tiên:** P0
**UI Path:** `/book`

**Các bước thực hiện:**
1. Điều kiện tiên quyết: User có registration `not_eating` cho ngày tương lai
2. Điều hướng đến `/book`
3. Click vào card ngày đó

**Kết quả mong đợi:**
- Status thay đổi từ "Không ăn" sang "Ăn"
- Viền card chuyển sang xanh lá
- Toast: "Đã đăng ký ăn"

**Tiêu chí đạt:** Click chuyển từ not_eating sang eating

---

#### TC-UI-B09: Ngày quá khứ bị vô hiệu hóa và không click được

**Ưu tiên:** P0
**UI Path:** `/book`

**Các bước thực hiện:**
1. Điều hướng đến `/book`

**Kết quả mong đợi:**
- Ngày hôm qua (nếu hiển thị trong lưới) bị làm mờ
- Click vào ngày quá khứ KHÔNG kích hoạt toggle
- Cursor thay đổi thành `not-allowed` trên ngày quá khứ

**Tiêu chí đạt:** Ngày quá khứ không thể tương tác

---

#### TC-UI-B10: Hôm nay được đánh dấu nhưng có thể toggle

**Ưu tiên:** P1
**UI Path:** `/book`

**Các bước thực hiện:**
1. Điều hướng đến `/book`

**Kết quả mong đợi:**
- Card đầu tiên (hôm nay) có ring highlight
- Hôm nay KHÔNG bị vô hiệu hóa (có thể đăng ký/hủy đăng ký cho hôm nay)

**Tiêu chí đạt:** Hôm nay có thể tương tác

---

#### TC-UI-B11: Toggle thất bại hiển thị thông báo lỗi

**Ưu tiên:** P1
**UI Path:** `/book`

**Scenario:** Network failure trong quá trình toggle

**Các bước thực hiện:**
1. Gây network error
2. Thử toggle một ngày

**Kết quả mong đợi:**
- Toast notification: "Cập nhật thất bại" (Update failed) xuất hiện
- Error toast style (nền đỏ)
- Status vẫn không thay đổi
- Không có registration được tạo/cập nhật trong database

**Tiêu chí đạt:** Lỗi network hiển thị notification lỗi

---

## 5. UI Test Cases: Trang /my-history

### 5.1 Tải và Hiển thị Trang

#### TC-UI-H01: Trang history hiển thị tháng hiện tại theo mặc định

**Ưu tiên:** P0
**UI Path:** `/my-history`
**Auth:** Employee

**Các bước thực hiện:**
1. Login sebagai employee
2. Điều hướng đến `/my-history`

**Kết quả mong đợi:**
- Calendar hiển thị tháng và năm hiện tại
- Header hiển thị: "Tháng [N] [YYYY]"

**Tiêu chí đạt:** Mặc định hiển thị tháng hiện tại

---

#### TC-UI-H02: Calendar hiển thị status đăng ký cho mỗi ngày

**Ưu tiên:** P0
**UI Path:** `/my-history`

**Các bước thực hiện:**
1. Điều kiện tiên quyết: User có registrations trong tháng hiện tại
2. Điều hướng đến `/my-history`

**Kết quả mong đợi:**
- Ngày có status `eating` hiển thị chỉ báo dot xanh lá
- Ngày có status `not_eating` hiển thị chỉ báo dot đỏ
- Ngày không có đăng ký không có chỉ báo

**Tiêu chí đạt:** Dot màu hiển thị đúng theo status

---

#### TC-UI-H03: Hàng stats hiển thị số lượng đúng

**Ưu tiên:** P1
**UI Path:** `/my-history`

**Các bước thực hiện:**
1. Điều kiện tiên quyết: Tháng hiện tại có 5 eating, 2 not eating registrations
2. Điều hướng đến `/my-history`

**Kết quả mong đợi:**
- Stat "Tổng" (Total) hiển thị `7`
- Stat "Có ăn" (Eating) hiển thị `5` trong ô xanh lá
- Stat "Không ăn" (Not eating) hiển thị `2` trong ô đỏ

**Tiêu chí đạt:** Stats hiển thị đúng số lượng

---

#### TC-UI-H04: Skeleton loading hiển thị trong quá trình fetch data

**Ưu tiên:** P2
**UI Path:** `/my-history`

**Các bước thực hiện:**
1. Điều hướng đến `/my-history`

**Kết quả mong đợi:**
- Lưới calendar hiển thị skeleton placeholders animated trong khi loading
- Stats hiển thị placeholders `-`

**Tiêu chí đạt:** Loading state hiển thị skeleton

---

### 5.2 Điều hướng Tháng

#### TC-UI-H05: Điều hướng đến tháng trước

**Ưu tiên:** P1
**UI Path:** `/my-history`

**Các bước thực hiện:**
1. Điều hướng đến `/my-history`
2. Click nút mũi tên trái (◀)

**Kết quả mong đợi:**
- Calendar cập nhật để hiển thị tháng trước
- Header cập nhật: "Tháng [N-1] [YYYY]"
- Registrations cho tháng mới được fetch và hiển thị

**Tiêu chí đạt:** Click mũi tên trái hiển thị tháng trước

---

#### TC-UI-H06: Điều hướng đến tháng sau

**Ưu tiên:** P1
**UI Path:** `/my-history`

**Các bước thực hiện:**
1. Điều hướng đến `/my-history`
2. Click nút mũi tên phải (▶)

**Kết quả mong đợi:**
- Calendar cập nhật để hiển thị tháng sau
- Header cập nhật tương ứng

**Tiêu chí đạt:** Click mũi tên phải hiển thị tháng sau

---

#### TC-UI-H07: Điều hướng từ tháng 1 sang tháng 12 (năm trước)

**Ưu tiên:** P2
**UI Path:** `/my-history`

**Các bước thực hiện:**
1. Đặt tháng hiện tại là tháng 1 năm 2026
2. Click mũi tên trái

**Kết quả mong đợi:**
- Calendar hiển thị tháng 12 năm 2025
- Năm giảm trong header

**Tiêu chí đạt:** Cross-year navigation hoạt động đúng

---

#### TC-UI-H08: Điều hướng từ tháng 12 sang tháng 1 (năm sau)

**Ưu tiên:** P2
**UI Path:** `/my-history`

**Các bước thực hiện:**
1. Đặt tháng hiện tại là tháng 12 năm 2026
2. Click mũi tên phải

**Kết quả mong đợi:**
- Calendar hiển thị tháng 1 năm 2027
- Năm tăng trong header

**Tiêu chí đạt:** Cross-year navigation hoạt động đúng

---

### 5.3 Hiển thị Lưới Calendar

#### TC-UI-H09: Hôm nay được highlight trong calendar

**Ưu tiên:** P0
**UI Path:** `/my-history`

**Các bước thực hiện:**
1. Điều hướng đến `/my-history` cho tháng hiện tại

**Kết quả mong đợi:**
- Ô ngày hôm nay có nền màu primary (xanh dương)
- Chữ số ngày màu trắng

**Tiêu chí đạt:** Hôm nay được highlight đặc biệt

---

#### TC-UI-H10: Ngày ngoài tháng hiện tại bị làm mờ

**Ưu tiên:** P1
**UI Path:** `/my-history`

**Các bước thực hiện:**
1. Điều hướng đến `/my-history`

**Kết quả mong đợi:**
- Ngày của tháng trước/sau được hiển thị ở đầu/cuối lưới
- Các ngày này có độ mờ giảm (40%)

**Tiêu chí đạt:** Ngày ngoài tháng hiển thị mờ

---

## 6. UI Test Cases: Trang /dashboard

### 6.1 Hiển thị Menu Hàng tuần

#### TC-UI-D01: Dashboard hiển thị tabs Thứ 2-6

**Ưu tiên:** P0
**UI Path:** `/dashboard`
**Auth:** Employee

**Các bước thực hiện:**
1. Login sebagai employee
2. Điều hướng đến `/dashboard`

**Kết quả mong đợi:**
- Danh sách horizontal có thể cuộn của các nút ngày (T2, T3, T4, T5, T6)
- Ngày hiện tại (hôm nay) được preselect
- Hiển thị 5 ngày làm việc (Thứ 2 đến Thứ 6 của tuần hiện tại)

**Tiêu chí đạt:** Hiển thị 5 ngày làm việc

---

#### TC-UI-D02: Chọn một ngày hiển thị chi tiết menu

**Ưu tiên:** P0
**UI Path:** `/dashboard`

**Các bước thực hiện:**
1. Điều hướng đến `/dashboard`
2. Click vào nút "T3"

**Kết quả mong đợi:**
- Khu vực nội dung chính cập nhật để hiển thị menu ngày thứ 3
- Header hiển thị: "Thứ 3, [date]"
- Các phần menu hiển thị: Món chính (Main), Món rau (Vegetables), Tráng miệng (Dessert)

**Tiêu chí đạt:** Click ngày hiển thị menu tương ứng

---

#### TC-UI-D03: Badge status đăng ký hiển thị

**Ưu tiên:** P1
**UI Path:** `/dashboard`

**Các bước thực hiện:**
1. Điều kiện tiên quyết: User có registration `eating` cho ngày thứ 4
2. Điều hướng đến `/dashboard`
3. Chọn tab thứ 4

**Kết quả mong đợi:**
- Badge hiển thị "Đã đăng ký" (Registered) màu xanh lá
- Badge hiển thị "Chưa đăng ký" (Not registered) màu cam nếu không có đăng ký

**Tiêu chí đạt:** Badge hiển thị đúng trạng thái đăng ký

---

#### TC-UI-D04: Xử lý menu trống

**Ưu tiên:** P1
**UI Path:** `/dashboard`

**Các bước thực hiện:**
1. Điều kiện tiên quyết: Không có menu được cấu hình cho một ngày cụ thể
2. Điều hướng đến `/dashboard`
3. Chọn ngày đó

**Kết quả mong đợi:**
- Thông báo "Chưa có menu" (No menu) hiển thị trong các phần món ăn

**Tiêu chí đạt:** Xử lý đẹp khi không có menu

---

## 7. Edge Cases

### 7.1 Date Edge Cases

| Test Case | Scenario | Expected |
|-----------|----------|----------|
| First day of month | Đăng ký cho `YYYY-01-01` | Thành công |
| Last day of month | Đăng ký cho `YYYY-12-31` | Thành công |
| Leap year Feb 29 | Đăng ký cho 2028-02-29 | Thành công |
| Weekend dates | Đăng ký cho Saturday/Sunday | Được cho phép (không chặn) |

### 7.2 Status Transition Edge Cases

| Current Status | Action | New Status |
|----------------|--------|------------|
| null (none) | Click | eating |
| eating | Click | not_eating |
| not_eating | Click | eating |

### 7.3 Concurrent Access

| Scenario | Expected |
|----------|----------|
| Hai trình duyệt, cùng user, cùng ngày | Last write wins (upsert) |
| Admin updates trong khi user updates | Last write wins |

### 7.4 Empty/Missing Data

| Scenario | Expected |
|----------|----------|
| Không có registrations tồn tại | Empty array `[]` returned |
| Registration not found | 404 response |
| Invalid JSON body | 400 with "Invalid JSON body" |

---

## 8. Ma trận Ủy quyền

| Endpoint | Method | Employee | Admin |
|----------|--------|----------|-------|
| /api/registrations | GET | Chỉ của mình | Chỉ của mình |
| /api/registrations | POST | Được phép | Được phép |
| /api/registrations/[id] | GET | 403 | Được phép |
| /api/registrations/[id] | PATCH | Chỉ của mình | Chỉ của mình |
| /api/registrations/[id] | DELETE | 403 | Được phép |

---

## 9. Test Execution Checklist

### Pre-conditions (Điều kiện tiên quyết)
- [ ] Test database sạch (hoặc có trạng thái đã biết)
- [ ] Test users tồn tại (admin, employee)
- [ ] Test có thể lặp lại mà không có side effects

### Execution Order (Thứ tự thực hiện đề xuất)
1. API tests trước (TC-API-001 đến TC-API-024)
2. UI tests sau (TC-UI-B01 đến TC-UI-D04)
3. Edge cases cuối cùng

### Success Criteria (Tiêu chí thành công)
- Tất cả P0 tests phải pass
- P1 tests nên pass (document any failures)
- P2 tests: document results

---

## 10. Known Limitations (Hạn chế đã biết)

1. **Date format validation**: Date format không hợp lệ có thể không bị reject với clear errors
2. **Double-click prevention**: UI không có explicit prevention cho rapid double-clicks (được mitigate bằng 3s toast auto-dismiss)
3. **Note field**: Notes có thể được cập nhật qua API nhưng UI pages không expose note editing functionality

---

*Tài liệu Phiên bản: 1.0*
*Cập nhật lần cuối: 2026-05-14*
*Tác giả: AI Assistant*