# 03 — Test Data & Fixtures

## 1. Seed accounts (đã có sẵn sau `npm run seed`)

| # | Username | Password | Role | Tên hiển thị | Trạng thái | Ghi chú |
|---|----------|----------|------|--------------|------------|---------|
| 1 | `admin` | `admin123` | admin | Quản trị viên | active | Quản lý toàn hệ thống |
| 2 | `hungpx` | `employee123` | employee | Phạm Xuân Hùng | active | Employee mặc định |
| 3 | `nguyenvana` | `employee123` | employee | Nguyễn Văn A | active | Test happy path |
| 4 | `tranthib` | `employee123` | employee | Trần Thị B | active | Test edge case |
| 5 | `levanc` | `employee123` | employee | Lê Văn C | active | Test override |
| 6 | `phamthid` | `employee123` | employee | Phạm Thị D | active | |
| 7 | `hoangvane` | `employee123` | employee | Hoàng Văn E | active | |
| 8 | `tranvietf` | `employee123` | employee | Trần Việt F | active | (chỉ trong seed-test-data) |
| 9 | `lehuongg` | `employee123` | employee | Lê Hương G | active | (chỉ trong seed-test-data) |
| 10 | `ngothih` | `employee123` | employee | Ngô Thị H | active | (chỉ trong seed-test-data) |
| 11 | `vothanhk` | `employee123` | employee | Võ Thanh K | active | (chỉ trong seed-test-data) |

> ⚠ Một số tài khoản chỉ có khi chạy `prisma/seed-test-data.ts` (richer seed). Mặc định `npm run seed` chỉ tạo 1 admin + 6 employees.

## 2. Disabled account fixture

Trước khi test case "đăng nhập tài khoản bị vô hiệu", tạo tài khoản disabled:

```sql
-- Qua Prisma Studio hoặc script riêng
UPDATE User SET isActive = 0 WHERE username = 'hoangvane';
```

Sau khi test xong, nhớ bật lại:
```sql
UPDATE User SET isActive = 1 WHERE username = 'hoangvane';
```

## 3. Date fixtures cho testing booking window

App dùng `Asia/Ho_Chi_Minh` (UTC+7, xem `src/lib/registrationWindow.ts`).

Giả định `now = 2026-06-20 (T6) 14:00 ICT`. Áp dụng tương tự cho ngày thực tế khi test:

| Loại ngày | Date (YYYY-MM-DD) | Mục đích test |
|-----------|-------------------|---------------|
| Hôm nay | `2026-06-20` (T6) | Không cho đặt (DATE_NOT_FUTURE) |
| Ngày mai (trong tuần) | `2026-06-22` (T2 tuần sau) | Đặt được nếu trước cutoff T7-CN |
| T7 tuần này | `2026-06-21` | Không cho đặt (WEEKEND) |
| CN tuần này | `2026-06-22` — sai, CN là 2026-06-21 | Không cho đặt |
| Ngày lễ test | `2026-09-02` (Quốc khánh) | Sau khi add vào holiday, không cho đặt |
| Quá khứ | `2026-06-01` | Không cho đặt |
| Hơn 4 tuần | `2026-08-15` | OUTSIDE_CURRENT_WEEK |
| Đang trong cutoff window | Ngày mai nhưng sau 23:00 T7 → CN | LOCKED |

## 4. Test meal set (đã seed)

| Type | Tên | Ghi chú |
|------|-----|---------|
| main | Thịt kho tàu, Chả lá lốt, Cá kho tộ, Gà nướng đất sét, Bún chả Hà Nội | 5 món |
| vegetable | Cải xào, Su su luộc, Đỗ quả xào, Rau muống luộc, Đậu phụ nhồi thịt, Cà rốt xào, Bông cải hấp, Đu đủ luộc, Rau mùi, Thịt gà rang | 10 món |
| dessert | Chuối, Dưa hấu, Nước ép cam, Kem vani, Chè đậu đỏ | 5 món |

Test món với ký tự đặc biệt (cần tạo thủ công):
- `Món cơm & phở "đặc biệt" <script>alert(1)</script>`
- `Món cơm có emoji 🍜`
- `Món   có   nhiều   khoảng   trắng`
- Tên rất dài (>200 ký tự) — test overflow UI

## 5. Holidays fixtures

```bash
# Thêm ngày lễ test
POST /api/holidays
{ "date": "2026-09-02", "description": "Quốc khánh (test)" }
```

## 6. Reset database

```bash
# Xoá sạch và seed lại
rm prisma/dev.db
npx prisma db push
npm run seed
# Hoặc dùng seed phong phú hơn:
npx tsx prisma/seed-test-data.ts
```

## 7. Cutoff config

Mặc định `cutoffHour=23, cutoffMinute=0` (xem `CutoffConfig` model). Có thể đổi trong Settings UI hoặc:
```sql
UPDATE CutoffConfig SET cutoffHour=18, cutoffMinute=0 WHERE id='global';
```

**Quan trọng**: Sau khi đổi cutoff, refresh trang booking để áp dụng.

## 8. Environment variables (xem `.env`)

```
DATABASE_URL=file:./prisma/dev.db
JWT_SECRET=<đã có>
NODE_ENV=development
RATE_LIMIT_BYPASS=true
```

Không cần thêm biến nào để chạy QA.