# BUG-012: CLOSED — Không phải bug

**Severity**: N/A (closed)
**Status**: Closed after re-investigation

Sau khi re-verify `src/services/RegistrationService.ts:70-90`, permission check tại dòng 75
(`if (role !== 'admin' && registration.userId !== userId) throw new Error('Forbidden')`)
chạy TRƯỚC date validation tại dòng 88-90.

Test ban đầu trả HTTP 400 "Ngay nay khong nam trong lich bao com" là behavior ĐÚNG:
employee PATCH registration CỦA CHÍNH MÌNH (không phải người khác) với date cũ (past date)
→ permission check pass (của mình) → date validation fail (past) → 400 LOCKED.

Không cần fix code. Đóng bug này.

Refs: docs/qa/reports/baocom-qa-report.md
