# 14 — Execution Script (chạy với skill `dogfood`)

Đây là **kịch bản từng bước** để agent chạy QA toàn bộ web baocom bằng skill `dogfood` của Hermes. Mỗi phase dưới đây tương ứng một block tool calls.

---

## Phase 0 — Setup (offline)

```bash
# Terminal: kiểm tra môi trường
cd /c/Users/ADMIN/Downloads/temp_v9/baocom
ls prisma/dev.db || echo "Cần seed DB"

# Nếu cần seed:
rm -f prisma/dev.db
npx prisma db push
npm run seed
# Hoặc seed giàu hơn:
npx tsx prisma/seed-test-data.ts

# Start dev server (background)
NODE_ENV=test RATE_LIMIT_BYPASS=true npm run dev
```

Đợi `Ready in ...ms` xuất hiện.

---

## Phase 1 — Initial reconnaissance (1 turn)

```python
browser_navigate(url="http://127.0.0.1:3000/")
browser_console(clear=True)
browser_snapshot()
browser_vision(question="Mô tả layout trang hiện tại. Redirect tới đâu? Có lỗi visual không?")
```

**Kiểm tra**:
- `/` redirect → `/login`?
- Console sạch?
- Layout đẹp?

---

## Phase 2 — Auth matrix (file `04-auth-flows.md`)

Với mỗi case AUTH-01 → AUTH-12:
```python
browser_navigate(url="<URL>")
# snapshot → tìm ref element
browser_click(ref="@eN")  # hoặc browser_type
browser_console()  # check error
browser_vision(question="Trang có gì bất thường?")  # nếu có vấn đề visual
```

Đăng nhập lần lượt: admin, employee, sai password, account disabled.

Ghi nhận pass/fail vào file `checklists/auth-results.md`:
```
AUTH-01 ✓  AUTH-02 ✓  AUTH-03 ✗ BUG-001  ...
```

---

## Phase 3 — Employee booking flow (file `05-employee-booking.md`)

Login `nguyenvana` → chạy BOOK-01 → BOOK-16.

Với mỗi test:
1. `browser_navigate` đến URL
2. `browser_snapshot` lấy refs
3. Thực hiện action
4. `browser_console` check lỗi
5. Nếu có vấn đề → `browser_vision` chụp lại

---

## Phase 4 — Admin CRUD flows (file 06, 07, 08, 10)

Login admin → chạy từng test case. Batch parallel nếu các test độc lập:

```python
# Có thể chạy song song nhiều case độc lập trong 1 turn
browser_navigate(url="...")
browser_snapshot()
```

---

## Phase 5 — Reports & Export (file 09)

Click "Xuất Excel" / "Xuất CSV" → đợi download → verify file:

```bash
# Download về ~/Downloads, kiểm tra
file ~/Downloads/report-*.csv
file ~/Downloads/report-*.xlsx
# Mở CSV
head -5 ~/Downloads/report-*.csv
```

---

## Phase 6 — API contract (file 11)

Mở terminal song song, dùng `curl`:

```bash
# Trong 1 turn có thể batch nhiều curl độc lập
curl -s -c admin.cookies -X POST http://127.0.0.1:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
# Sau đó test các endpoint
```

---

## Phase 7 — Security probing (file 12)

Đặc biệt chú ý:
- SEC-13: route `/employees` không có prefix `/admin/`
- SEC-05: JWT alg confusion
- SEC-18: logout invalidates token

---

## Phase 8 — Visual & a11y (file 13)

Dùng `browser_vision` ở mỗi trang với viewport khác nhau:

```python
# Set viewport (nếu browser cho phép)
browser_navigate(url="...")
browser_vision(question="Mô tả layout. Có element bị tràn, che, hay contrast kém không?")
```

---

## Phase 9 — Bug write-up

Mỗi bug phát hiện:
1. Chụp ảnh cuối cùng: `browser_vision(question="Mô tả bug")`
2. Tạo file `evidence/BUG-NNN-<slug>.md` theo template `15-bug-report-template.md`
3. Include MEDIA:<path> trong report.

---

## Phase 10 — Final report

Compile tất cả vào `reports/baocom-qa-report.md`:

```markdown
# BAOCOM QA REPORT — <DATE>

## Executive summary
- Total issues: N
- By severity: Critical X, High Y, Medium Z, Low W
- By category: Functional, Visual, Accessibility, Console, Security

## Scope
- Modules tested
- Out of scope

## Environment
- App version, browser, date

## Findings
[Link từng evidence/BUG-NNN-*.md]

## Summary table
| ID | Title | Severity | Category | Status |
|----|-------|----------|----------|--------|

## Test coverage
- % pass per module

## Recommendations
- Top 3 fix priorities
```

---

## Tips tối ưu

1. **Batch parallel tool calls**: nhiều navigate/snapshot độc lập → gửi 1 turn.
2. **Dùng `delegate_task`**: nếu cần QA song song nhiều module (auth + booking + admin), chia subagent.
3. **Không dừng ở bug đầu tiên**: tiếp tục khám phá, có thể tìm thêm bug khác.
4. **Ghi nhận "không có bug"** cũng có giá trị: "AUTH-01: ✓ verified at 14:32, evidence/auth-01.png".
5. **Console check SAU MỖI navigation**: silent JS error là finding rất giá trị.
6. **Screenshot cho mọi FAIL**: MEDIA:path trong report để user thấy trực tiếp.

---

## Done criteria

Phase 10 hoàn tất + reports/baocom-qa-report.md đã viết + tất cả checklist đều có Pass/Fail rõ ràng.