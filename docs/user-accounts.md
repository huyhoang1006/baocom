# Quy tắc Tạo và Quản lý Tài khoản - Hệ thống Báo Cơm

> Phiên bản: 1.0  
> Ngày: 2026-05-10  
> Trạng thái: Final  
> Áp dụng cho: Tất cả tài khoản nhân viên và admin

---

## Mục lục

1. [Tổng quan](#1-tổng-quan)
2. [Quy tắc tạo Username](#2-quy-tắc-tạo-username)
3. [Quy tắc tạo Password](#3-quy-tắc-tạo-password)
4. [Quy trình tạo tài khoản](#4-quy-trình-tạo-tài-khoản)
5. [Quản lý tài khoản](#5-quản-lý-tài-khoản)
6. [Bảng mẫu tài khoản](#6-bảng-mẫu-tài-khoản)

---

## 1. Tổng quan

### Mục đích

Tài liệu này định nghĩa quy tắc thống nhất để tạo và quản lý tài khoản cho hệ thống Báo Cơm (BaoCom).

### Nguyên tắc cốt lõi

| Nguyên tắc | Mô tả |
|------------|-------|
| **Duy nhất** | Mỗi người có 1 username duy nhất, không trùng lặp |
| **Dễ nhớ** | Username dựa trên tên thật, dễ đoán và nhớ |
| **Bảo mật** | Password ngẫu nhiên, không đặt theo ngày sinh/số quen thuộc |
| **Phân quyền** | Admin có username riêng, không dùng chung với nhân viên |

---

## 2. Quy tắc tạo Username

### Công thức

```
Username = <tên cuối không dấu> + <viết tắt họ và tên đệm>
```

### Cách phân tách tên

```
Họ và tên: Phạm Xuân Hùng
           │    │    │
           │    │    └── Tên: Hùng
           │    │
           │    └── Tên đệm: Xuân
           │
           └── Họ: Phạm

Cách lấy:
- Lấy TÊN (không dấu): Hùng → hung
- Lấy chữ cái đầu của HỌ + TÊN ĐỆM (không dấu): P + X → px

Username: hungpx
```

### Bảng ví dụ

| # | Họ và tên đầy đủ | Tên | Họ + Tên đệm | Username | Ghi chú |
|---|------------------|-----|--------------|----------|----------|
| 1 | Phạm Xuân Hùng | Hùng | P + X | hungpx | |
| 2 | Nguyễn Văn Minh | Minh | N + V | minhnv | |
| 3 | Trần Thị Lan Anh | Lan | T + TH | lanhtt | |
| 4 | Lê Hoàng Nam | Nam | L + H | namlh | |
| 5 | Đặng Thị Mai Linh | Linh | D + TM | linhdtm | |
| 6 | Võ Đình Tuấn | Tuấn | V + Đ | tuannvd | |
| 7 | Bùi Thị Hương Giang | Giang | B + TH | giangbth | |
| 8 | Trịnh Minh Quang | Quang | T + M | quangtmq | |

### Quy tắc xử lý tên có dấu

```
Quy tắc: Bỏ dấu tiếng Việt khi tạo username

Phạm → Pham → P
Nguyễn → Nguyen → N
Trần → Tran → T
Lê → Le → L
Đặng → Dang → D
Võ → Vo → V
Bùi → Bui → B
Trịnh → Trinh → T
```

### Quy tắc khi trùng username

```
Nếu 2 người có cùng username (VD: 2 người tên "Hùng"):

├── Phạm Xuân Hùng → hungpx
└── Nguyễn Thị Hùng → hungpnt (thêm chữ cái cuối)

Cách xử lý:
1. Thêm chữ cái đầu của họ vào cuối: hungpnt (p=Phạm, nt=Nguyễn Thị)
2. Hoặc thêm số: hungpx01
```

### Username cho Admin

```
Admin sử dụng username riêng, không theo công thức nhân viên:

├── admin
├── cook
├── manager
└── baocom
```

---

## 3. Quy tắc tạo Password

### Yêu cầu

| Yêu cầu | Mô tả |
|---------|-------|
| **Độ dài** | Tối thiểu 8 ký tự |
| **Ký tự** | Bao gồm chữ hoa, chữ thường, số |
| **Ngẫu nhiên** | Sử dụng random string, KHÔNG theo quy tắc cá nhân |
| ** Bí mật** | Không tiết lộ cho người khác |

### Ví dụ Password hợp lệ

```
✓ Kx9@mNp2Q
✓ Tr7$ghJ#kL
✓ bvN3@qWz7
✓ Mn4$pL8kJ
✓ Ht6^XyN2#m
```

### Password KHÔNG hợp lệ

```
✗ 12345678 (toàn số)
✗ password (quá đơn giản)
✗ hungpx123 (theo username)
✗ 01011990 (ngày sinh)
✗ abcdefgh (toàn chữ)
```

### Cách tạo Password ngẫu nhiên

```
Có thể sử dụng các công cụ:
├── 1Password / LastPass password generator
├── Random string trong Excel: =RANDBETWEEN(0,9)&CHAR(RANDBETWEEN(65,90))&...
├── Hoặc dùng mật khẩu mặc định của hệ thống
```

---

## 4. Quy trình tạo tài khoản

### Bước 1: Thu thập thông tin

```
Admin thu thập thông tin nhân viên:
├── Họ và tên đầy đủ
├── Số điện thoại (liên lạc)
├── Email công ty (nếu có)
├── Phòng ban (nếu có)
└── Ngày bắt đầu làm việc
```

### Bước 2: Tạo Username

```
Theo công thức: <tên cuối không dấu><viết tắt họ + tên đệm>

Ví dụ: Phạm Xuân Hùng → hungpx
```

### Bước 3: Tạo Password

```
Tạo password ngẫu nhiên 8-12 ký tự

Ví dụ: Kx9@mNp2Q
```

### Bước 4: Ghi nhận thông tin

```
Lưu vào hệ thống:
├── Username
├── Password (đã mã hóa)
├── Họ tên
├── SĐT
├── Ngày tạo
├── Người tạo
└── Trạng thái (active/inactive)
```

### Bước 5: Gửi thông tin cho nhân viên

```
Cách gửi:
├── Gửi qua email công ty
├── Gửi qua tin nhắn SMS
├── Hoặc in ra giấy giao trực tiếp

Nội dung gửi:
Chào [Họ tên],

Tài khoản đăng nhập hệ thống Báo Cơm:
- Username: hungpx
- Password: Kx9@mNp2Q

Vui lòng đổi password sau khi đăng nhập lần đầu.

Trân trọng,
[Admin]
```

---

## 5. Quản lý tài khoản

### 5.1 Khóa/Mở tài khoản

```
Tài khoản bị khóa khi:
├── Nhân viên nghỉ việc
├── Quên password nhiều lần (5 lần)
├── Phát hiện bất thường bảo mật
└── Yêu cầu của nhân viên

Cách khóa: Admin đổi trạng thái trong hệ thống
Cách mở: Admin reset password và gửi lại
```

### 5.2 Reset Password

```
Quy trình reset password:
1. Nhân viên yêu cầu reset (quên password)
2. Admin xác nhận danh tính (qua SĐT/email)
3. Admin tạo password mới ngẫu nhiên
4. Gửi password mới cho nhân viên
5. Nhân viên đổi password sau khi đăng nhập
```

### 5.3 Đổi Username

```
Không khuyến khích đổi username vì:
├── Liên quan đến lịch sử dữ liệu
├── Có thể ảnh hưởng đến integration

Chỉ đổi khi:
├── Username bị trùng lặp (xử lý trùng)
├── Yêu cầu đặc biệt từ cấp cao
└── Phải cập nhật tất cả dữ liệu liên quan
```

### 5.4 Xóa tài khoản

```
Xóa tài khoản khi:
├── Nhân viên nghỉ việc vĩnh viễn
└── Tài khoản không còn sử dụng

Cách xử lý:
├── Đổi trạng thái thành "inactive" (không xóa hẳn)
├── Giữ lại dữ liệu lịch sử đăng ký
└── Không cho đăng nhập nữa
```

---

## 6. Bảng mẫu tài khoản

### Mẫu danh sách tài khoản

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        BẢNG TÀI KHOẢN NHÂN VIÊN                       │
├─────┬──────────────────┬──────────┬───────────┬─────────────┬───────────┤
│ STT │ Họ và tên        │ Username │ Password  │ SĐT         │ Trạng thái│
├─────┼──────────────────┼──────────┼───────────┼─────────────┼───────────┤
│  1  │ Phạm Xuân Hùng  │ hungpx    │ Kx9@mNp2Q │ 0912xxx456 │ Active    │
│  2  │ Nguyễn Văn Minh  │ minhnv   │ Tm7$ NkL3 │ 0933xxx789 │ Active    │
│  3  │ Trần Thị Lan Anh │ lanhtt   │ Qw4#Zr8Y  │ 0944xxx123 │ Active    │
│  4  │ Lê Hoàng Nam     │ namlh    │ Xy6@Bc9K  │ 0955xxx234 │ Active    │
│  5  │ Đặng Thị Mai Linh│ linhdtm  │ Vn2$Mp7L  │ 0966xxx345 │ Active    │
│  6  │ Võ Đình Tuấn    │ tuannvd  │ Kj3#Wx8N  │ 0977xxx456 │ Active    │
│  7  │ Bùi Thị Hương Giang│ giangbth│ Hz5@Yq2R │ 0988xxx567 │ Inactive │
└─────┴──────────────────┴──────────┴───────────┴─────────────┴───────────┘
```

### Mẫu gửi thông tin tài khoản

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           THÔNG TIN TÀI KHOẢN                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Họ và tên: Phạm Xuân Hùng                                            │
│  Phòng ban: Phòng Kỹ thuật                                            │
│                                                                         │
│  ─────────────────────────────────────────────                         │
│                                                                         │
│  Username: hungpx                                                      │
│  Password: Kx9@mNp2Q                                                   │
│                                                                         │
│  ─────────────────────────────────────────────                         │
│                                                                         │
│  Hướng dẫn:                                                           │
│  1. Truy cập: http://baocom.company.com/login                         │
│  2. Nhập username và password bên trên                                │
│  3. Đổi password sau lần đăng nhập đầu tiên                          │
│                                                                         │
│  Liên hệ: admin@company.com | 0123-456-789                            │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Phụ lục

### Kiểm tra trùng lặp

```
Trước khi tạo tài khoản mới, kiểm tra:

1. Username đã tồn tại?
   → Tra cứu trong hệ thống

2. Tên đầy đủ đã có trong hệ thống?
   → Tránh trùng lặp nhân viên

3. SĐT đã được sử dụng?
   → Mỗi người 1 SĐT duy nhất
```

### Checklist khi tạo tài khoản

- [ ] Thu thập thông tin nhân viên (Họ tên, SĐT)
- [ ] Tạo username theo công thức
- [ ] Kiểm tra username không trùng
- [ ] Tạo password ngẫu nhiên
- [ ] Lưu vào hệ thống (username, password mã hóa, thông tin)
- [ ] Gửi thông tin cho nhân viên
- [ ] Ghi nhận ngày tạo và người tạo