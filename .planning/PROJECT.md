# Báo Cơm Trưa Công Ty

## What This Is

Web app báo cơm trưa nội bộ cho công ty nhỏ dưới 50 người. Nhân viên mặc định có cơm mỗi ngày và chỉ cần báo nghỉ khi không ăn; Admin/HR quản nhân viên, deadline báo nghỉ, menu tuần, và báo cáo số suất.

Mục tiêu của project hiện tại là hoàn thiện v1 từ codebase brownfield đã có, không làm lại từ đầu.

## Core Value

Giảm thao tác tổng hợp cơm trưa thủ công bằng cách cho admin biết đúng số suất cần đặt mỗi ngày.

## Requirements

### Validated

- ✓ Admin/HR có thể đăng nhập và truy cập khu vực quản trị — existing
- ✓ Nhân viên có thể đăng nhập và truy cập khu vực nhân viên — existing
- ✓ Admin/HR có thể quản lý nhân viên — existing
- ✓ Admin/HR có thể quản lý món ăn và menu theo ngày/tuần — existing
- ✓ Admin/HR có thể quản lý ngày nghỉ/lịch nghỉ — existing
- ✓ Nhân viên có thể xem dashboard, lịch sử cá nhân, và thao tác báo cơm/nghỉ — existing
- ✓ Hệ thống có API registrations, users, meals, daily menus, holidays, admin stats, và admin reports — existing
- ✓ Hệ thống có export báo cáo phía admin — existing

### Active

- [ ] Nhân viên dùng luồng mặc định ăn, chỉ báo nghỉ cơm khi không ăn.
- [ ] Admin/HR cấu hình giờ chốt báo nghỉ theo chính sách công ty.
- [ ] Admin/HR xem số suất cần đặt theo ngày.
- [ ] Admin/HR xem danh sách nhân viên báo nghỉ theo ngày.
- [ ] Admin/HR xem lịch sử ăn/nghỉ của từng nhân viên.
- [ ] Admin/HR xuất CSV báo cáo để gửi nhà bếp hoặc đối soát nội bộ.
- [ ] Nhân viên xem menu cơm trưa theo tuần.
- [ ] App đủ ổn định cho v1 nội bộ, gồm sửa các lỗi báo cáo/date/auth quan trọng đã ghi trong codebase concerns.

### Out of Scope

- Tính tiền/khấu trừ lương tự động — không phải mục tiêu v1; hiện ưu tiên giảm thao tác báo cơm.
- Tài khoản self-service cho nhân viên — v1 dùng mô hình admin tạo tài khoản.
- Vai trò nhà bếp riêng — v1 chỉ có nhân viên và Admin/HR.
- Quy mô lớn trên 200 người — v1 phục vụ công ty dưới 50 người, tránh overbuild pagination/export phức tạp.
- Mobile app native — web app đủ cho v1.

## Context

Codebase hiện tại là Next.js App Router + React + TypeScript, có controller/service/repository backend và Prisma SQLite/libSQL persistence. App đã có khu vực nhân viên, khu vực admin, auth bằng cookie JWT, quản lý menu/ngày nghỉ/nhân viên, registrations, admin stats, và reports.

Người dùng chính:
- Nhân viên: mặc định ăn, báo nghỉ khi không ăn, xem menu tuần và lịch sử của mình.
- Admin/HR: tạo/quản lý nhân viên, cấu hình deadline, quản menu tuần, xem số suất/người nghỉ/lịch sử, xuất CSV.

Các concern cần ưu tiên trong v1:
- Admin reports date filtering đang truyền sai argument order, làm báo cáo theo khoảng ngày sai hoặc rỗng.
- Date handling trộn local Date với UTC ISO conversion, dễ lệch ngày.
- Logout không revoke token server-side; cần cân nhắc mức xử lý phù hợp v1 nội bộ.
- API response shape của daily menu by date chưa khớp type client.
- Một số page admin/employee lớn, dễ gây regression khi sửa UX hoặc logic.

## Constraints

- **Tech stack**: Giữ Next.js 16, React 19, TypeScript, Prisma, SQLite/libSQL — codebase đã xây theo stack này.
- **Architecture**: Giữ pattern App Router → API route → Controller → Service → Repository → Prisma — giảm rủi ro trong brownfield.
- **Scope**: Hoàn thiện v1 từ app hiện có, không rebuild toàn bộ — mục tiêu là ship nội bộ nhanh.
- **User model**: Chỉ nhân viên và Admin/HR trong v1 — tránh thêm vai trò nhà bếp/kế toán.
- **Scale**: Dưới 50 nhân viên — ưu tiên đơn giản, không over-engineer pagination hoặc distributed infra.
- **Auth**: Admin tạo tài khoản — không cần self-service signup trong v1.
- **Workflow**: Mặc định ăn, báo nghỉ là hành động chính — UI và logic phải tối ưu cho ít thao tác.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Hoàn thiện v1 trên codebase hiện có | App đã có nhiều module cốt lõi; tận dụng tốt hơn làm lại | — Pending |
| Mặc định nhân viên có cơm | Giảm thao tác hằng ngày cho nhân viên | — Pending |
| Admin cấu hình deadline báo nghỉ | Chính sách công ty có thể đổi, hardcode giờ chốt dễ sai | — Pending |
| V1 chỉ hỗ trợ nhân viên và Admin/HR | Đủ cho quy trình hiện tại, giảm độ phức tạp | — Pending |
| Menu tuần hiển thị cho nhân viên | Người dùng muốn xem trước thực đơn tuần | — Pending |
| Báo cáo v1 gồm số suất, danh sách nghỉ, lịch sử cá nhân, CSV | Phục vụ admin gửi nhà bếp và đối soát nội bộ | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-16 after initialization*
