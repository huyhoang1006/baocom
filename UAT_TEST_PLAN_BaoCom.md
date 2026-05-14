# Kế hoạch Kiểm thử Chấp nhận Người dùng (UAT) - Hệ thống BaoCom
**Mã tài liệu:** BAOCOM-UAT-2026-001
**Phiên bản:** 3.0
**Ngày:** 2026-05-14
**Tác giả:** AI Test Engineer
**Chuẩn:** IEEE 829-2008 (Hồ sơ UAT)

---

## 1. Giới thiệu

### 1.1 Mục đích
Kế hoạch UAT này định nghĩa việc kiểm thử chấp nhận cho hệ thống BaoCom từ **góc độ người dùng cuối**. Kiểm thử tập trung vào luồng công việc của người dùng, yêu cầu kinh doanh và sự phù hợp chức năng - KHÔNG phải chi tiết triển khai nội bộ.

### 1.2 Phạm vi kiểm thử
- **Trong phạm vi:** Chức năng hướng người dùng, luồng công việc, quy tắc nghiệp vụ, hành vi UI/UX
- **Ngoài phạm vi:** Kiểm thử API, xác thực cơ sở dữ liệu, kiểm thử bảo mật, xác minh cấp mã

### 1.3 Phương pháp tiếp cận kiểm thử
```
┌─────────────────────────────────────────────────────────────┐
│                MÔ HÌNH KIỂM THỬ BLACKBOX                     │
├─────────────────────────────────────────────────────────────┤
│  ĐẦU VÀO ──► [ HỆ THỐNG ĐƯỢC KIỂM THỬ ] ──► ĐẦU RA       │
│            (Không có kiến thức về cấu trúc bên trong)      │
├─────────────────────────────────────────────────────────────┤
│  Người kiểm thử tương tác CHỈ thông qua:                   │
│  • Giao diện người dùng (Trình duyệt Web)                   │
│  • Hành động nhập liệu của người dùng (click, gõ, submit)   │
│  • Kết quả mong đợi vs Kết quả thực tế                      │
└─────────────────────────────────────────────────────────────┘
```

### 1.4 Tổng quan Hệ thống Được Kiểm thử

| Thành phần | Mô tả |
|------------|-------|
| **Ứng dụng** | Ứng dụng web Next.js |
| **URLs** | Đăng nhập, Dashboard Nhân viên, Dashboard Admin |
| **Người dùng** | Admin, Nhân viên |
| **Chức năng cốt lõi** | Đăng nhập, Đăng ký suất ăn, Xem thực đơn, Tạo báo cáo |

---

## 2. Hồ sơ Người dùng & Persona

### 2.1 Người dùng Nhân viên
```
┌─────────────────────────────────────────────────────────────┐
│ PERSONA: Nguyễn Văn A - Nhân viên                          │
├─────────────────────────────────────────────────────────────┤
│ Tài khoản: nguyenvana                                       │
│ Mật khẩu: employee123                                       │
│ Vai trò: Nhân viên                                          │
│                                                             │
│ LUỒNG CÔNG VIỆC HÀNG NGÀY:                                  │
│ 1. Đăng nhập vào hệ thống                                  │
│ 2. Xem thực đơn trưa tuần này                              │
│ 3. Đăng ký / hủy đăng ký ăn trưa các ngày trong tuần       │
│ 4. Xem lịch sử đăng ký                                     │
│ 5. Đăng xuất                                               │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Người dùng Quản trị viên
```
┌─────────────────────────────────────────────────────────────┐
│ PERSONA: Admin - Quản trị viên                             │
├─────────────────────────────────────────────────────────────┤
│ Tài khoản: admin                                            │
│ Mật khẩu: admin123                                          │
│ Vai trò: Quản trị viên                                      │
│                                                             │
│ LUỒNG CÔNG VIỆC HÀNG NGÀY:                                  │
│ 1. Đăng nhập vào hệ thống                                  │
│ 2. Xem thống kê đăng ký (tổng NV, đang ăn, không ăn)       │
│ 3. Quản lý nhân sự (xem, thêm, sửa, xóa)                   │
│ 4. Xuất báo cáo đăng ký                                    │
│ 5. Đăng xuất                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. User Stories

### 3.1 User Stories cho Nhân viên

| Story ID | Với tư cách... | Tôi muốn... | Để... | Ưu tiên |
|----------|----------------|-------------|-------|---------|
| US-E-01 | Nhân viên | Đăng nhập bằng username/password | Tôi có thể truy cập hệ thống một cách bảo mật | P0 |
| US-E-02 | Nhân viên | Xem thực đơn trưa tuần này | Tôi biết hôm nay có gì ăn | P0 |
| US-E-03 | Nhân viên | Đăng ký ăn trưa | Bếp biết tôi đang ăn | P0 |
| US-E-04 | Nhân viên | Hủy đăng ký ăn trưa | Tôi có thể không ăn nếu cần | P1 |
| US-E-05 | Nhân viên | Xem lịch sử đăng ký của tôi | Tôi theo dõi được việc điểm danh của mình | P2 |
| US-E-06 | Nhân viên | Đăng xuất | Tôi có thể bảo vệ phiên làm việc của mình | P1 |

### 3.2 User Stories cho Quản trị viên

| Story ID | Với tư cách... | Tôi muốn... | Để... | Ưu tiên |
|----------|----------------|-------------|-------|---------|
| US-A-01 | Quản trị viên | Đăng nhập bằng username/password | Tôi có thể truy cập các tính năng quản trị | P0 |
| US-A-02 | Quản trị viên | Xem thống kê đăng ký hàng ngày | Tôi biết có bao nhiêu người đang ăn | P0 |
| US-A-03 | Quản trị viên | Xem tất cả nhân viên | Tôi có thể quản lý danh sách nhân viên | P1 |
| US-A-04 | Quản trị viên | Thêm nhân viên mới | Nhân viên mới có thể sử dụng hệ thống | P1 |
| US-A-05 | Quản trị viên | Chỉnh sửa thông tin nhân viên | Dữ liệu nhân viên luôn cập nhật | P2 |
| US-A-06 | Quản trị viên | Vô hiệu hóa nhân viên | Cựu nhân viên không thể truy cập hệ thống | P2 |
| US-A-07 | Quản trị viên | Tạo báo cáo đăng ký | Tôi có thể báo cáo cho bếp | P1 |
| US-A-08 | Quản trị viên | Xuất báo cáo ra Excel | Tôi có thể chia sẻ báo cáo bên ngoài | P2 |
| US-A-09 | Quản trị viên | Đăng xuất | Tôi có thể bảo vệ phiên làm việc của mình | P1 |

---

## 4. Yêu cầu Chức năng

### 4.1 Yêu cầu Xác thực

| Mã Yêu cầu | Yêu cầu | Tiêu chí Chấp nhận |
|------------|---------|---------------------|
| FR-AUTH-01 | Hệ thống xác thực người dùng | Thông tin hợp lệ → dashboard; Không hợp lệ → thông báo lỗi |
| FR-AUTH-02 | Phiên làm việc vẫn tồn tại | Đóng trình duyệt và mở lại → vẫn đăng nhập (nếu cookie còn hiệu lực) |
| FR-AUTH-03 | Phiên hết hạn | Sau 7 ngày → người dùng phải đăng nhập lại |
| FR-AUTH-04 | Đăng xuất kết thúc phiên | Nhấn đăng xuất → chuyển hướng đến trang đăng nhập |

### 4.2 Yêu cầu Nhân viên

| Mã Yêu cầu | Yêu cầu | Tiêu chí Chấp nhận |
|------------|---------|---------------------|
| FR-EMP-01 | Xem lưới đặt 8 ngày | Trang đặt hiển thị hôm nay + 7 ngày tiếp theo |
| FR-EMP-02 | Badge "Hôm nay" hiển thị | Thẻ ngày đầu tiên có badge "Hôm nay" |
| FR-EMP-03 | Chuyển đổi trạng thái ăn | Nhấn vào thẻ → trạng thái lần lượt (chưa chọn → ăn → không ăn) |
| FR-EMP-04 | Ngày quá khứ bị vô hiệu hóa | Không thể nhấn vào ngày đã qua |
| FR-EMP-05 | Xem thực đơn hàng tuần | Dashboard hiển thị thực đơn T2-T6 với các món |
| FR-EMP-06 | Xem lịch sử đăng ký | Trang Lịch sử hiển thị lịch với các chấm trạng thái |

### 4.3 Yêu cầu Quản trị viên

| Mã Yêu cầu | Yêu cầu | Tiêu chí Chấp nhận |
|------------|---------|---------------------|
| FR-ADMIN-01 | Xem bảng thống kê | Hiển thị tổng nhân viên, số đang ăn, số không ăn, tỷ lệ đăng ký |
| FR-ADMIN-02 | Danh sách nhân viên | Hiển thị tất cả nhân viên đang hoạt động với tên, username, trạng thái |
| FR-ADMIN-03 | Thêm nhân viên | Form chấp nhận tên → tạo username → tạo nhân viên |
| FR-ADMIN-04 | Chỉnh sửa nhân viên | Có thể cập nhật tên, vai trò (nhân viên/quản trị) |
| FR-ADMIN-05 | Vô hiệu hóa nhân viên | Đặt trạng thái nhân viên thành không hoạt động |
| FR-ADMIN-06 | Tạo báo cáo | Chọn khoảng ngày → hiển thị bảng xem trước |
| FR-ADMIN-07 | Xuất Excel | Nhấn xuất → tải file .xlsx |

---

## 5. Các Trường hợp Kiểm thử UAT (Blackbox)

### 5.1 Các Trường hợp Kiểm thử Xác thực

#### UAT-LOGIN-001: Nhân viên Đăng nhập Thành công
```
Mã Test: UAT-LOGIN-001
User Story: US-E-01
Module: Đăng nhập
Ưu tiên: P0 - Quan trọng

Mục tiêu: Xác minh nhân viên có thể đăng nhập với thông tin hợp lệ

Điều kiện tiên quyết:
- Người dùng có tài khoản nhân viên hợp lệ (nguyenvana / employee123)
- Trình duyệt đang ở trang đăng nhập

Các bước kiểm thử:
 1. Truy cập /login
 2. Nhập "nguyenvana" vào trường username
 3. Nhập "employee123" vào trường password
 4. Nhấn nút "Đăng nhập"
 5. Quan sát URL và nội dung trang

Kết quả mong đợi:
 - URL thay đổi thành /dashboard (không phải /admin/dashboard)
 - Trang hiển thị nội dung dành cho nhân viên (thực đơn hàng tuần)
 - Không có thông báo lỗi hiển thị

Tiêu chí đạt: Đăng nhập thành công, chuyển hướng đến dashboard nhân viên
```

#### UAT-LOGIN-002: Quản trị viên Đăng nhập Thành công
```
Mã Test: UAT-LOGIN-002
User Story: US-A-01
Module: Đăng nhập
Ưu tiên: P0 - Quan trọng

Mục tiêu: Xác minh quản trị viên có thể đăng nhập với thông tin hợp lệ

Điều kiện tiên quyết:
- Người dùng có tài khoản admin hợp lệ (admin / admin123)
- Trình duyệt đang ở trang đăng nhập

Các bước kiểm thử:
 1. Truy cập /login
 2. Nhập "admin" vào trường username
 3. Nhập "admin123" vào trường password
 4. Nhấn nút "Đăng nhập"
 5. Quan sát URL và nội dung trang

Kết quả mong đợi:
 - URL thay đổi thành /admin/dashboard
 - Trang hiển thị nội dung dành cho quản trị (thống kê)
 - Không có thông báo lỗi hiển thị

Tiêu chí đạt: Đăng nhập thành công, chuyển hướng đến dashboard admin
```

#### UAT-LOGIN-003: Thông tin Không hợp lệ Hiển thị Lỗi
```
Mã Test: UAT-LOGIN-003
User Story: US-E-01
Module: Đăng nhập
Ưu tiên: P1 - Cao

Mục tiêu: Xác minh thông báo lỗi khi nhập sai mật khẩu

Điều kiện tiên quyết:
- Người dùng có tài khoản hợp lệ
- Trình duyệt đang ở trang đăng nhập

Các bước kiểm thử:
 1. Truy cập /login
 2. Nhập username hợp lệ
 3. Nhập "wrongpassword" vào trường password
 4. Nhấn nút "Đăng nhập"
 5. Quan sát thông báo lỗi

Kết quả mong đợi:
 - Người dùng vẫn ở trang /login
 - Hiển thị thông báo lỗi: "Sai tên đăng nhập hoặc mật khẩu"
 - Trường username bị xóa
 - Trường password bị xóa

Tiêu chí đạt: Hiển thị thông báo lỗi, người dùng có thể thử lại
```

#### UAT-LOGIN-004: Trường Trống Hiển thị Lỗi Xác thực
```
Mã Test: UAT-LOGIN-004
User Story: US-E-01
Module: Đăng nhập
Ưu tiên: P2 - Trung bình

Mục tiêu: Xác minh xác thực khi để trống các trường

Điều kiện tiên quyết:
- Trình duyệt đang ở trang đăng nhập

Các bước kiểm thử:
 1. Truy cập /login
 2. Để trống cả hai trường
 3. Nhấn nút "Đăng nhập"
 4. Quan sát hành vi

Kết quả mong đợi:
 - Nút bị vô hiệu hóa HOẶC
 - Hiển thị thông báo lỗi cho các trường trống
 - Không có điều hướng xảy ra

Tiêu chí đạt: Xác thực form ngăn chặn gửi trống
```

#### UAT-LOGIN-005: Đăng xuất Xóa Phiên
```
Mã Test: UAT-LOGIN-005
User Story: US-E-06, US-A-09
Module: Đăng nhập
Ưu tiên: P1 - Cao

Mục tiêu: Xác minh đăng xuất xóa phiên và chuyển hướng đến đăng nhập

Điều kiện tiên quyết:
- Người dùng đã đăng nhập

Các bước kiểm thử:
 1. Đăng nhập với tư cách bất kỳ người dùng nào
 2. Nhấn nút/menu đăng xuất
 3. Quan sát điều hướng
 4. Thử truy cập trực tiếp đến dashboard
 5. Quan sát nếu truy cập bị từ chối

Kết quả mong đợi:
 - Chuyển hướng đến trang /login
 - Menu hiển thị tùy chọn "Đăng nhập"
 - Truy cập URL trực tiếp đến /dashboard hoặc /admin/dashboard chuyển hướng đến đăng nhập

Tiêu chí đạt: Phiên bị chấm dứt, không thể truy cập các trang được bảo vệ
```

#### UAT-AUTH-001: Employee Truy cập Admin Route → 403
```
Mã Test: UAT-AUTH-001
User Story: US-A-03
Module: Authorization
Ưu tiên: P0 - Quan trọng

Mục tiêu: Xác minh nhân viên bị chặn truy cập trang admin

Điều kiện tiên quyết:
- Người dùng đã đăng nhập với tư cách nhân viên (nguyenvana/employee123)

Các bước kiểm thử:
 1. Đăng nhập với tư cách nhân viên
 2. Truy cập /admin/dashboard (hoặc /admin/employees, /admin/reports)
 3. Quan sát kết quả

Kết quả mong đợi:
 - Hiển thị trang 403 Forbidden
 - Message: "Bạn không có quyền truy cập trang này"
 - Nút "Quay về trang chủ" hoạt động → chuyển đến /dashboard

Tiêu chí đạt: Nhân viên không truy cập được trang admin
```

#### UAT-AUTH-002: Admin Truy cập Employee Route → 403
```
Mã Test: UAT-AUTH-002
User Story: US-A-03
Module: Authorization
Ưu tiên: P0 - Quan trọng

Mục tiêu: Xác minh admin bị chặn truy cập trang nhân viên

Điều kiện tiên quyết:
- Người dùng đã đăng nhập với tư cách quản trị viên (admin/admin123)

Các bước kiểm thử:
 1. Đăng nhập với tư cách admin
 2. Truy cập /dashboard (hoặc /book, /my-history)
 3. Quan sát kết quả

Kết quả mong đợi:
 - Hiển thị trang 403 Forbidden
 - Message: "Bạn không có quyền truy cập trang này"
 - Nút "Quay về trang chủ" hoạt động → chuyển đến /admin/dashboard

Tiêu chí đạt: Admin không truy cập được trang nhân viên
```

#### UAT-AUTH-003: Unauthenticated User Redirect to Login
```
Mã Test: UAT-AUTH-003
User Story: US-E-01
Module: Authorization
Ưu tiên: P0 - Quan trọng

Mục tiêu: Xác minh user chưa đăng nhập bị redirect về login

Điều kiện tiên quyết:
- Không có session/token (xóa cookie)

Các bước kiểm thử:
 1. Xóa tất cả cookie
 2. Truy cập /dashboard
 3. Quan sát kết quả

Kết quả mong đợi:
 - Redirect NGAY lập tức về /login
 - Không thấy dashboard flash trước khi redirect

Tiêu chí đạt: Không flash, redirect ngay về login
```

---

### 5.2 Các Trường hợp Kiểm thử Đặt Ăn Nhân viên

#### UAT-BOOK-001: Xem Lưới Đặt 8 Ngày
```
Mã Test: UAT-BOOK-001
User Story: US-E-02
Module: Đặt Ăn Nhân viên
Ưu tiên: P0 - Quan trọng

Mục tiêu: Xác minh trang đặt hiển thị 8 ngày bắt đầu từ hôm nay

Điều kiện tiên quyết:
- Người dùng đã đăng nhập với tư cách nhân viên

Các bước kiểm thử:
 1. Đăng nhập với tư cách nhân viên (nguyenvana)
 2. Truy cập /book
 3. Đếm số thẻ ngày được hiển thị
 4. Xác minh thẻ đầu tiên có badge "Hôm nay"
 5. Kiểm tra các ngày là liên tiếp (hôm nay, ngày mai, ...)

Kết quả mong đợi:
 - Chính xác 8 thẻ ngày được hiển thị
 - Thẻ đầu tiên có badge "Hôm nay"
 - Ngày là: hôm nay + 7 ngày tiếp theo
 - Mỗi thẻ hiển thị: tên ngày (T2-T7, CN), số ngày

Tiêu chí đạt: 8 ngày liên tiếp được hiển thị bắt đầu từ hôm nay
```

#### UAT-BOOK-002: Đăng ký Ăn Trưa (Ăn)
```
Mã Test: UAT-BOOK-002
User Story: US-E-03
Module: Đặt Ăn Nhân viên
Ưu tiên: P0 - Quan trọng

Mục tiêu: Xác minh nhân viên có thể đăng ký ăn vào một ngày

Điều kiện tiên quyết:
- Người dùng đã đăng nhập với tư cách nhân viên
- Không có đăng ký hiện tại cho ngày mục tiêu

Các bước kiểm thử:
 1. Đăng nhập với tư cách nhân viên (nguyenvana)
 2. Truy cập /book
 3. Tìm thẻ ngày tương lai (không phải hôm nay)
 4. Nhấn vào thẻ
 5. Quan sát thay đổi trạng thái
 6. Chờ thông báo thành công
 7. Làm mới trang
 8. Xác minh trạng thái được lưu

Kết quả mong đợi:
 - Trạng thái thay đổi từ "Chưa chọn" thành "Ăn"
 - Hiển thị thông báo toast thành công
 - Sau khi làm mới, trạng thái vẫn là "Ăn"
 - Hiển thị chỉ báo màu xanh lá

Tiêu chí đạt: Đăng ký được lưu, trạng thái hiển thị "Ăn"
```

#### UAT-BOOK-003: Hủy Đăng ký Ăn Trưa
```
Mã Test: UAT-BOOK-003
User Story: US-E-04
Module: Đặt Ăn Nhân viên
Ưu tiên: P1 - Cao

Mục tiêu: Xác minh nhân viên có thể hủy đăng ký ăn

Điều kiện tiên quyết:
- Người dùng đã đăng nhập với tư cách nhân viên
- Có đăng ký "Ăn" cho một ngày tương lai

Các bước kiểm thử:
 1. Đăng nhập với tư cách nhân viên
 2. Truy cập /book
 3. Nhấn vào thẻ có trạng thái "Ăn"
 4. Quan sát thay đổi trạng thái
 5. Xác minh thông báo

Kết quả mong đợi:
 - Trạng thái thay đổi từ "Ăn" thành "Không ăn"
 - HOẶC chu kỳ qua "Chưa chọn"
 - Hiển thị thông báo thành công
 - Sau khi làm mới, trạng thái vẫn tồn tại

Tiêu chí đạt: Đăng ký được cập nhật hoặc hủy
```

#### UAT-BOOK-004: Không Thể Đặt cho Ngày Quá khứ
```
Mã Test: UAT-BOOK-004
User Story: US-E-04
Module: Đặt Ăn Nhân viên
Ưu tiên: P1 - Cao

Mục tiêu: Xác minh các ngày quá khứ không thể nhấp được

Điều kiện tiên quyết:
- Người dùng đã đăng nhập với tư cách nhân viên

Các bước kiểm thử:
 1. Đăng nhập với tư cách nhân viên
 2. Truy cập /book
 3. Tìm các ngày quá khứ (nếu 8 ngày bao gồm quá khứ)
 4. Thử nhấn vào ngày quá khứ nếu hiển thị

Kết quả mong đợi:
 - Các ngày quá khứ xuất hiện mờ / bị vô hiệu hóa
 - Nhấn không có hiệu lực
 - Không có thay đổi trạng thái

Tiêu chí đạt: Các ngày quá khứ không thể tương tác
```

#### UAT-BOOK-005: Chu kỳ Chuyển đổi Trạng thái
```
Mã Test: UAT-BOOK-005
User Story: US-E-03, US-E-04
Module: Đặt Ăn Nhân viên
Ưu tiên: P1 - Cao

Mục tiêu: Xác minh nhấn chu kỳ qua các trạng thái đúng

Điều kiện tiên quyết:
- Người dùng đã đăng nhập với tư cách nhân viên

Các bước kiểm thử:
 1. Đăng nhập với tư cách nhân viên
 2. Truy cập /book
 3. Tìm ngày có trạng thái "Chưa chọn"
 4. Nhấn một lần → ghi nhận trạng thái mới
 5. Nhấn lần hai → ghi nhận trạng thái mới
 6. Nhấn lần ba → ghi nhận trạng thái mới

Kết quả mong đợi:
 - Chu kỳ: Chưa chọn → Ăn → Không ăn → Ăn
 - Mỗi lần nhấn thay đổi trạng thái
 - Thông báo xác nhận mỗi thay đổi

Tiêu chí đạt: Trạng thái chu kỳ qua cả 3 trạng thái
```

---

### 5.3 Các Trường hợp Kiểm thử Dashboard Nhân viên

#### UAT-DASH-001: Xem Thực đơn Hàng tuần
```
Mã Test: UAT-DASH-001
User Story: US-E-02
Module: Dashboard Nhân viên
Ưu tiên: P0 - Quan trọng

Mục tiêu: Xác minh nhân viên có thể xem thực đơn trưa hàng tuần

Điều kiện tiên quyết:
- Người dùng đã đăng nhập với tư cách nhân viên

Các bước kiểm thử:
 1. Đăng nhập với tư cách nhân viên
 2. Quan sát chuyển hướng tự động hoặc truy cập /dashboard
 3. Đếm các tab ngày (T2, T3, T4, T5, T6)
 4. Nhấn vào mỗi tab ngày
 5. Quan sát các món được hiển thị

Kết quả mong đợi:
 - Các tab ngày hiển thị cho T2-T6
 - Mỗi ngày hiển thị: món chính, món rau, tráng miệng
 - Các món có tên được hiển thị

Tiêu chí đạt: Thực đơn hàng tuần hiển thị với tất cả loại món
```

#### UAT-DASH-002: Xem Trạng thái Đăng ký của Tôi trên Dashboard
```
Mã Test: UAT-DASH-002
User Story: US-E-02
Module: Dashboard Nhân viên
Ưu tiên: P1 - Cao

Mục tiêu: Xác minh nhân viên thấy trạng thái ăn/không ăn của mình

Điều kiện tiên quyết:
- Người dùng đã đăng nhập với tư cách nhân viên
- Có đăng ký cho một số ngày

Các bước kiểm thử:
 1. Đăng nhập với tư cách nhân viên
 2. Truy cập /dashboard
 3. Tìm chỉ báo trạng thái trên mỗi ngày

Kết quả mong đợi:
 - Mỗi ngày hiển thị trạng thái đăng ký (Ăn/Không ăn/Chưa đăng ký)
 - Trạng thái khớp với các đăng ký đã thực hiện trong /book

Tiêu chí đạt: Trạng thái hiển thị và khớp với các đăng ký thực tế
```

---

### 5.4 Các Trường hợp Kiểm thử Dashboard Quản trị

#### UAT-ADM-001: Xem Thống kê Đăng ký
```
Mã Test: UAT-ADM-001
User Story: US-A-02
Module: Dashboard Quản trị
Ưu tiên: P0 - Quan trọng

Mục tiêu: Xác minh quản trị viên thấy các thống kê hàng ngày chính xác

Điều kiện tiên quyết:
- Người dùng đã đăng nhập với tư cách quản trị viên

Các bước kiểm thử:
 1. Đăng nhập với tư cách quản trị viên (admin/admin123)
 2. Quan sát các thẻ thống kê dashboard
 3. Ghi nhận các giá trị được hiển thị

Kết quả mong đợi:
 - Thẻ thống kê hiển thị:
   - Tổng nhân viên: <số>
   - Đang ăn hôm nay: <số>
   - Không ăn: <số>
   - Tỷ lệ đăng ký: <phần trăm>%
 - Các số là hợp lý (giữa 0 và tổng nhân viên)

Tiêu chí đạt: Thống kê hiển thị với các giá trị hợp lý
```

#### UAT-ADM-002: Truy cập Thao tác Nhanh
```
Mã Test: UAT-ADM-002
User Story: US-A-07
Module: Dashboard Quản trị
Ưu tiên: P1 - Cao

Mục tiêu: Xác minh các nút thao tác nhanh hoạt động

Điều kiện tiên quyết:
- Người dùng đã đăng nhập với tư cách quản trị viên

Các bước kiểm thử:
 1. Đăng nhập với tư cách quản trị viên
 2. Cuộn đến phần "Thao tác nhanh"
 3. Nhấn nút "Xuất báo cáo"
 4. Quan sát điều hướng

Kết quả mong đợi:
 - Nút hiển thị với text "Xuất báo cáo"
 - Nhấn điều hướng đến trang /admin/reports

Tiêu chí đạt: Nút điều hướng đến trang báo cáo
```

#### UAT-ADM-003: Truy cập Quản lý Nhân sự
```
Mã Test: UAT-ADM-003
User Story: US-A-03
Module: Dashboard Quản trị
Ưu tiên: P1 - Cao

Mục tiêu: Xác minh thao tác nhanh quản lý nhân sự hoạt động

Điều kiện tiên quyết:
- Người dùng đã đăng nhập với tư cách quản trị viên

Các bước kiểm thử:
 1. Đăng nhập với tư cách quản trị viên
 2. Nhấn nút "Quản lý nhân sự"
 3. Quan sát điều hướng

Kết quả mong đợi:
 - Nút hiển thị với text "Quản lý nhân sự"
 - Nhấn điều hướng đến /admin/employees

Tiêu chí đạt: Nút điều hướng đến trang nhân viên
```

---

### 5.5 Các Trường hợp Kiểm thử Quản lý Nhân viên

#### UAT-EMP-001: Xem Danh sách Nhân viên
```
Mã Test: UAT-EMP-001
User Story: US-A-03
Module: Quản lý Nhân viên
Ưu tiên: P1 - Cao

Mục tiêu: Xác minh quản trị viên có thể xem danh sách tất cả nhân viên

Điều kiện tiên quyết:
- Người dùng đã đăng nhập với tư cách quản trị viên

Các bước kiểm thử:
 1. Đăng nhập với tư cách quản trị viên
 2. Truy cập /admin/employees
 3. Quan sát danh sách nhân viên

Kết quả mong đợi:
 - Bảng/danh sách hiển thị các cột: Tên, Username, Trạng thái
 - Người dùng admin được liệt kê
 - Các nhân viên được seed được liệt kê (nguyenvana, tranthib, v.v.)
 - Trạng thái hiển thị "Đang hoạt động" cho người dùng active

Tiêu chí đạt: Danh sách nhân viên hiển thị với dữ liệu đúng
```

#### UAT-EMP-002: Thêm Nhân viên Mới
```
Mã Test: UAT-EMP-002
User Story: US-A-04
Module: Quản lý Nhân viên
Ưu tiên: P1 - Cao

Mục tiêu: Xác minh quản trị viên có thể thêm nhân viên mới

Điều kiện tiên quyết:
- Người dùng đã đăng nhập với tư cách quản trị viên
- Tên nhân viên mới chưa có trong hệ thống

Các bước kiểm thử:
 1. Đăng nhập với tư cách quản trị viên
 2. Truy cập /admin/employees
 3. Nhấn nút "Thêm nhân viên" hoặc nút thêm tương tự
 4. Điền form:
    - Họ và tên: "Nhân viên Test"
    - (các trường khác nếu có)
 5. Gửi form
 6. Quan sát nhân viên mới trong danh sách

Kết quả mong đợi:
 - Modal/form mở
 - Form chấp nhận input
 - Sau khi gửi, nhân viên mới xuất hiện trong danh sách
 - Hiển thị thông báo thành công

Tiêu chí đạt: Nhân viên mới được tạo và hiển thị trong danh sách
```

#### UAT-EMP-003: Tìm kiếm Nhân viên
```
Mã Test: UAT-EMP-003
User Story: US-A-03
Module: Quản lý Nhân viên
Ưu tiên: P2 - Trung bình

Mục tiêu: Xác minh quản trị viên có thể tìm kiếm nhân viên

Điều kiện tiên quyết:
- Người dùng đã đăng nhập với tư cách quản trị viên
- Có nhiều nhân viên

Các bước kiểm thử:
 1. Đăng nhập với tư cách quản trị viên
 2. Truy cập /admin/employees
 3. Tìm hộp tìm kiếm
 4. Gõ tên một phần (ví dụ: "nguyen")
 5. Quan sát kết quả được lọc

Kết quả mong đợi:
 - Danh sách lọc để hiển thị chỉ nhân viên phù hợp
 - Gõ trong hộp tìm kiếm cập nhật kết quả theo thời gian thực

Tiêu chí đạt: Tìm kiếm lọc danh sách nhân viên
```

#### UAT-EMP-004: Chỉnh sửa Nhân viên
```
Mã Test: UAT-EMP-004
User Story: US-A-05
Module: Quản lý Nhân viên
Ưu tiên: P2 - Trung bình

Mục tiêu: Xác minh quản trị viên có thể chỉnh sửa thông tin nhân viên

Điều kiện tiên quyết:
- Người dùng đã đăng nhập với tư cách quản trị viên
- Có nhân viên để chỉnh sửa

Các bước kiểm thử:
 1. Đăng nhập với tư cách quản trị viên
 2. Truy cập /admin/employees
 3. Tìm nhân viên (không phải admin)
 4. Nhấn nút chỉnh sửa/biểu tượng
 5. Sửa đổi tên
 6. Lưu thay đổi
 7. Xác minh thay đổi được lưu

Kết quả mong đợi:
 - Form/modal chỉnh sửa mở
 - Thay đổi lưu thành công
 - Tên đã cập nhật hiển thị trong danh sách

Tiêu chí đạt: Thông tin nhân viên được cập nhật
```

#### UAT-EMP-005: Vô hiệu hóa Nhân viên
```
Mã Test: UAT-EMP-005
User Story: US-A-06
Module: Quản lý Nhân viên
Ưu tiên: P2 - Trung bình

Mục tiêu: Xác minh quản trị viên có thể vô hiệu hóa nhân viên

Điều kiện tiên quyết:
- Người dùng đã đăng nhập với tư cách quản trị viên
- Có nhân viên đang hoạt động (không phải admin)

Các bước kiểm thử:
 1. Đăng nhập với tư cách quản trị viên
 2. Truy cập /admin/employees
 3. Tìm nhân viên đang hoạt động
 4. Nhấn nút xóa/vô hiệu hóa
 5. Xác nhận hành động
 6. Quan sát thay đổi trạng thái

Kết quả mong đợi:
 - Hộp thoại xác nhận xuất hiện
 - Sau khi xác nhận, trạng thái nhân viên thay đổi
 - Nhân viên hiển thị là "Không hoạt động" hoặc bị xóa khỏi danh sách active

Tiêu chí đạt: Nhân viên bị vô hiệu hóa thành công
```

---

### 5.6 Các Trường hợp Kiểm thử Tạo Báo cáo

#### UAT-RPT-001: Tạo Báo cáo Ngày
```
Mã Test: UAT-RPT-001
User Story: US-A-07
Module: Báo cáo
Ưu tiên: P1 - Cao

Mục tiêu: Xác minh quản trị viên có thể tạo báo cáo cho một ngày cụ thể

Điều kiện tiên quyết:
- Người dùng đã đăng nhập với tư cách quản trị viên

Các bước kiểm thử:
 1. Đăng nhập với tư cách quản trị viên
 2. Truy cập /admin/reports
 3. Chọn loại báo cáo: "Ngày" hoặc ngày cụ thể
 4. Chọn ngày có đăng ký hiện có
 5. Nhấn "Xem trước"
 6. Quan sát bảng

Kết quả mong đợi:
 - Bảng xem trước hiển thị:
   - STT (Số thứ tự)
   - Tên
   - Số điện thoại
   - Ngày
 - Bảng có các hàng dữ liệu
 - Hiển thị "Tổng cộng"

Tiêu chí đạt: Xem trước báo cáo hiển thị đúng
```

#### UAT-RPT-002: Xuất Báo cáo ra Excel
```
Mã Test: UAT-RPT-002
User Story: US-A-08
Module: Báo cáo
Ưu tiên: P2 - Trung bình

Mục tiêu: Xác minh quản trị viên có thể xuất báo cáo dưới dạng file Excel

Điều kiện tiên quyết:
- Người dùng đã đăng nhập với tư cách quản trị viên
- Xem trước báo cáo đang được hiển thị

Các bước kiểm thử:
 1. Đăng nhập với tư cách quản trị viên
 2. Truy cập /admin/reports
 3. Tạo xem trước báo cáo
 4. Nhấn "Tải Excel" hoặc nút xuất
 5. Quan sát file được tải

Kết quả mong đợi:
 - File được tải
 - File có định dạng .xlsx
 - File chứa dữ liệu báo cáo

Tiêu chí đạt: File Excel được tải với dữ liệu đúng
```

---

## 6. Thiết lập Môi trường Kiểm thử

### 6.1 Tài khoản Kiểm thử

| Username | Password | Vai trò | Mục đích |
|----------|----------|---------|----------|
| admin | admin123 | Admin | Kiểm thử tính năng admin |
| nguyenvana | employee123 | Employee | Kiểm thử tính năng nhân viên |
| tranthib | employee123 | Employee | Kiểm thử kịch bản đa người dùng |
| levanc | employee123 | Employee | Nhân viên bổ sung |
| phamthid | employee123 | Employee | Nhân viên bổ sung |
| hoangvane | employee123 | Employee | Nhân viên bổ sung |

### 6.2 URLs Kiểm thử

| URL | Mục đích |
|-----|----------|
| http://localhost:3000/login | Trang đăng nhập |
| http://localhost:3000/dashboard | Dashboard nhân viên |
| http://localhost:3000/book | Trang đặt ăn |
| http://localhost:3000/my-history | Lịch sử đăng ký |
| http://localhost:3000/admin/dashboard | Dashboard quản trị |
| http://localhost:3000/admin/employees | Quản lý nhân viên |
| http://localhost:3000/admin/reports | Tạo báo cáo |

### 6.3 Điều kiện tiên quyết Dữ liệu Kiểm thử
- Cơ sở dữ liệu đã seed với admin + 5 nhân viên
- 20 món ăn đã tạo (món chính, rau, tráng miệng)
- Thực đơn hàng tuần đã tạo cho tuần hiện tại
- Một số đăng ký tồn tại để kiểm thử

---

## 7. Checklist Thực thi Kiểm thử

### 7.1 Checklist Trước Kiểm thử
- [ ] Môi trường kiểm thử có thể truy cập
- [ ] Tài khoản kiểm thử đang hoạt động
- [ ] Cơ sở dữ liệu đã seed
- [ ] Trình duyệt đã xóa cookie
- [ ] Người kiểm thử UAT đã được đào tạo về user stories

### 7.2 Mẫu Nhật ký Thực thi Kiểm thử

```
Mã Test: ___________
Ngày: ___________
Người kiểm thử: ___________
Điều kiện tiên quyết đã đáp ứng: [ ] Có [ ] Không
Các bước kiểm thử đã thực thi: [ ] Tất cả [ ] Một phần
Kết quả mong đợi khớp: [ ] Có [ ] Không
Kết quả thực tế: ________________
Mã Defect (nếu có): ___________
Pass/Fail: ___________
Ghi chú: ________________
```

### 7.3 Checklist Sau Kiểm thử
- [ ] Tất cả các trường hợp kiểm thử đã thực thi
- [ ] Tất cả các lỗi đã được ghi lại
- [ ] Ảnh chụp màn hình đã được chụp cho các lỗi
- [ ] Báo cáo tổng hợp kiểm thử đã được tạo

---

## 8. Báo cáo Defect

### 8.1 Mẫu Defect
```
Mã Defect: [TỰ ĐỘNG TẠO]
Ngày tìm thấy: ___________
Mã Test: ___________
Mức độ nghiêm trọng: [P0-Critical / P1-High / P2-Medium / P3-Low]
Mô tả: ___________
Các bước để tái tạo: ___________
Hành vi mong đợi: ___________
Hành vi thực tế: ___________
Ảnh chụp màn hình: [ĐÍNH KÈM]
```

### 8.2 Định nghĩa Mức độ Nghiêm trọng

| Mức độ | Định nghĩa | Ví dụ |
|--------|------------|-------|
| P0 - Critical | Hệ thống không sử dụng được, chặn tất cả người dùng | Đăng nhập bị hỏng |
| P1 - High | Tính năng chính bị hỏng | Không thể đăng ký ăn trưa |
| P2 - Medium | Tính năng hoạt động một phần | Báo cáo thiếu một cột |
| P3 - Low | Vấn đề thẩm mỹ | Sai màu văn bản |

---

## 9. Tóm tắt Tiêu chí Chấp nhận

### 9.1 Xác thực
- [x] Nhân viên có thể đăng nhập với thông tin hợp lệ ✅ (Đã fix - login API được gọi)
- [x] Quản trị viên có thể đăng nhập với thông tin hợp lệ ✅
- [x] Thông tin không hợp lệ hiển thị thông báo lỗi ✅ (Đã fix - màu đỏ, không reload)
- [x] Các trường trống được xác thực ✅
- [x] Đăng xuất chấm dứt phiên ✅ (Đã fix - middleware bảo vệ)

### 9.2 Phân quyền (Authorization)
- [ ] Employee không truy cập được /admin/* (middleware redirect về 403)
- [ ] Admin không truy cập được /dashboard, /book, /my-history (middleware redirect về 403)
- [ ] User chưa đăng nhập truy cập protected route → redirect /login (không flash)
- [ ] Token hết hạn → redirect /login

### 9.3 Tính năng Nhân viên
- [ ] Lưới đặt 8 ngày hiển thị đúng
- [ ] Badge "Hôm nay" hiển thị trên thẻ đầu tiên
- [ ] Có thể đăng ký ăn trưa
- [ ] Có thể hủy đăng ký
- [ ] Các ngày quá khứ bị vô hiệu hóa
- [ ] Trạng thái chu kỳ đúng
- [ ] Thực đơn hàng tuần hiển thị

### 9.4 Tính năng Quản trị
- [ ] Dashboard hiển thị thống kê
- [ ] Các thao tác nhanh điều hướng đúng
- [ ] Danh sách nhân viên hiển thị
- [ ] Có thể thêm nhân viên mới
- [ ] Có thể tìm kiếm nhân viên
- [ ] Có thể chỉnh sửa nhân viên
- [ ] Có thể vô hiệu hóa nhân viên
- [ ] Có thể tạo báo cáo
- [ ] Có thể xuất ra Excel

---

## 10. Phê duyệt

| Vai trò | Tên | Ngày | Chữ ký |
|---------|------|------|--------|
| UAT Lead | | | |
| Business Owner | | | |
| Project Manager | | | |
| System Owner | | | |

---

**Kết thúc Tài liệu - Kế hoạch UAT v2.0**
**Tập trung: Kiểm thử Chấp nhận Người dùng Blackbox**