# Requirements — Báo Cơm Trưa Công Ty v1

**Date:** 2026-05-16
**Scope:** Hoàn thiện v1 cho web app báo cơm trưa nội bộ công ty dưới 50 người.

## v1 Requirements

### Authentication & Users

- [ ] **AUTH-01**: Admin/HR có thể đăng nhập bằng tài khoản được tạo sẵn.
- [ ] **AUTH-02**: Nhân viên có thể đăng nhập bằng tài khoản do Admin/HR tạo.
- [ ] **AUTH-03**: Hệ thống chặn nhân viên inactive khỏi các thao tác báo cơm mới.
- [ ] **USER-01**: Admin/HR có thể tạo, sửa, vô hiệu hóa nhân viên.
- [ ] **USER-02**: Báo cáo v1 chỉ tính nhân viên active cho ngày hiện tại/tương lai.

### Business Dates & Calendar

- [ ] **DATE-01**: Hệ thống dùng `Asia/Ho_Chi_Minh` làm timezone nghiệp vụ cho date key, cutoff, report, menu, và history.
- [ ] **DATE-02**: Hệ thống xử lý mọi ngày báo cơm bằng business date `YYYY-MM-DD`, không lệch ngày do UTC conversion.
- [ ] **DATE-03**: Hệ thống loại trừ cuối tuần khỏi ngày có cơm mặc định.
- [ ] **DATE-04**: Hệ thống loại trừ ngày nghỉ/holiday đã cấu hình khỏi ngày có cơm mặc định.

### Default-Eat Registration

- [ ] **REG-01**: Nhân viên active mặc định được tính là có cơm vào mọi meal-eligible weekday nếu không báo nghỉ.
- [ ] **REG-02**: Nhân viên có thể báo nghỉ cơm cho ngày còn mở trước cutoff.
- [ ] **REG-03**: Nhân viên có thể hủy báo nghỉ để quay lại trạng thái mặc định có cơm trước cutoff.
- [ ] **REG-04**: Nhân viên không thể báo nghỉ hoặc hủy báo nghỉ cho ngày đã qua, holiday, weekend, hoặc sau cutoff.
- [ ] **REG-05**: UI nhân viên hiển thị rõ trạng thái `Mặc định có cơm`, `Đã báo nghỉ`, `Đã chốt`, và lý do không thể chỉnh sửa.

### Cutoff Policy

- [ ] **CUT-01**: Admin/HR có thể cấu hình giờ chốt báo nghỉ cơm toàn hệ thống.
- [ ] **CUT-02**: Backend enforce cutoff khi nhân viên báo nghỉ hoặc hủy báo nghỉ.
- [ ] **CUT-03**: Nhân viên thấy giờ chốt và trạng thái còn mở/đã chốt cho ngày đang xem.
- [ ] **CUT-04**: Admin/HR có thể override đăng ký sau cutoff thay nhân viên.
- [ ] **CUT-05**: Mỗi admin override sau cutoff lưu người thực hiện, thời điểm, ngày áp dụng, trạng thái mới, và ghi chú.

### Weekly Menu

- [ ] **MENU-01**: Admin/HR có thể quản lý menu cơm trưa theo tuần làm việc.
- [ ] **MENU-02**: Nhân viên có thể xem menu cơm trưa theo tuần.
- [ ] **MENU-03**: Menu tuần hiển thị đúng theo business date `Asia/Ho_Chi_Minh`.
- [ ] **MENU-04**: Lưu menu tuần báo lỗi rõ nếu một ngày/món không lưu thành công; không hiển thị thành công giả.

### Admin Daily Operations

- [ ] **OPS-01**: Admin/HR có thể xem số suất cần đặt cho một ngày được chọn.
- [ ] **OPS-02**: Số suất ngày = số nhân viên active meal-eligible trừ số nhân viên báo nghỉ hợp lệ.
- [ ] **OPS-03**: Admin/HR có thể xem danh sách nhân viên đã báo nghỉ theo ngày.
- [ ] **OPS-04**: Admin/HR có thể xem tổng active employees, tổng báo nghỉ, tổng có cơm, trạng thái holiday/weekend, và trạng thái cutoff cho ngày được chọn.
- [ ] **OPS-05**: Admin/HR có thể xem dashboard nhanh cho hôm nay và ngày làm việc tiếp theo.

### History & Reports

- [ ] **RPT-01**: Nhân viên có thể xem lịch sử cá nhân với effective status từng ngày: có cơm mặc định, đã báo nghỉ, holiday/weekend, hoặc đã chốt.
- [ ] **RPT-02**: Admin/HR có thể xem lịch sử ăn/nghỉ của từng nhân viên.
- [ ] **RPT-03**: Admin/HR có thể lọc báo cáo theo khoảng ngày inclusive.
- [ ] **RPT-04**: Báo cáo khoảng ngày dùng cùng logic effective status với dashboard ngày.
- [ ] **RPT-05**: Admin/HR có thể xuất CSV từ server cho ngày hoặc khoảng ngày.
- [ ] **RPT-06**: CSV chứa metadata date/range, generated time, timezone, tổng suất, và danh sách nhân viên báo nghỉ.
- [ ] **RPT-07**: CSV output đúng với preview report trên màn hình cho cùng filter.

### Stability & Quality

- [ ] **QUAL-01**: Admin report date filtering không truyền nhầm `startDate` vào `userId`.
- [ ] **QUAL-02**: Daily menu by-date API và client type dùng cùng response shape.
- [ ] **QUAL-03**: Các API/report/cutoff path touched trong v1 có validation rõ cho query/body input.
- [ ] **QUAL-04**: Date/default-eat/report/cutoff logic có automated tests bao phủ happy path và edge cases chính.
- [ ] **QUAL-05**: Không thêm role nhà bếp, payroll, native app, notifications, hoặc meal choice vào v1.

## v2 Requirements (Deferred)

- [ ] **NOTIF-01**: Nhân viên nhận reminder báo nghỉ qua email/Zalo/Slack.
- [ ] **KITCHEN-01**: Nhà bếp/vendor có role riêng để xem số suất.
- [ ] **PAY-01**: Kế toán có báo cáo tính phí/khấu trừ lương.
- [ ] **MEAL-01**: Nhân viên chọn loại suất/món/dietary preference.
- [ ] **MOBILE-01**: Native mobile app hoặc PWA nâng cao.
- [ ] **AUDIT-01**: Audit ledger đầy đủ cho mọi thay đổi đăng ký.
- [ ] **CONFIG-01**: Timezone/per-department/per-user cutoff policy.
- [ ] **HIST-01**: Snapshot lịch sử nhân viên để báo cáo quá khứ không đổi khi employee inactive sau này.

## Out of Scope

- Self-service signup — v1 dùng admin-created accounts.
- Payroll automation — ưu tiên giảm thao tác báo cơm, không tính tiền.
- Kitchen/vendor portal — CSV đủ cho handoff v1.
- Large enterprise scale >200 employees — v1 phục vụ <50 employees.
- Re-platform backend/frontend — giữ stack hiện có.
- Client-side XLSX as required export — v1 chuẩn hóa CSV server-side only.

## Acceptance Criteria

- Admin can answer before lunch cutoff: "Hôm nay cần đặt bao nhiêu suất? Ai nghỉ cơm?"
- Employee can complete normal flow without daily opt-in: only act when they want to report absence.
- Date shown in menu/report/history matches Vietnamese business date in `Asia/Ho_Chi_Minh`.
- Export CSV matches report preview for same filters.
- Automated tests catch report date-range bug, default-eat count, cutoff enforcement, holiday/weekend exclusion, and CSV/preview consistency.

## Traceability

(To be filled by ROADMAP.md.)
