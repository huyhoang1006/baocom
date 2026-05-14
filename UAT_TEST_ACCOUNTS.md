# UAT Test Accounts - BaoCom System

**Document Version:** 1.0
**Date:** 2026-05-14
**Database:** `prisma/dev.db`

---

## Test Accounts for UAT (Blackbox Testing)

### Employee Personas

| Username | Password | Name | Role | Purpose |
|----------|----------|------|------|---------|
| `nguyenvana` | `employee123` | Nguyễn Văn A | Employee | Primary employee tester |
| `tranthib` | `employee123` | Trần Thị B | Employee | Multi-user scenario testing |
| `levanc` | `employee123` | Lê Văn C | Employee | Additional employee |
| `phamthid` | `employee123` | Phạm Thị D | Employee | Additional employee |
| `hoangvane` | `employee123` | Hoàng Văn E | Employee | Additional employee |

### Admin Personas

| Username | Password | Name | Role | Purpose |
|----------|----------|------|------|---------|
| `admin` | `admin123` | Administrator | Admin | Primary admin tester |

---

## How to Use These Accounts

### For Manual UAT Testing

1. **Start the application:**
   ```bash
   npm run dev
   ```

2. **Navigate to:** http://localhost:3000/login

3. **Login as Employee:**
   - Username: `nguyenvana`
   - Password: `employee123`
   - Expected: Redirects to `/dashboard` (employee view)

4. **Login as Admin:**
   - Username: `admin`
   - Password: `admin123`
   - Expected: Redirects to `/admin/dashboard` (admin view)

---

## Test Scenarios by Account

### Employee (nguyenvana) - UAT Scenarios

| Scenario ID | Description | Steps |
|-------------|-------------|-------|
| EMP-01 | Login as employee | Login with nguyenvana/employee123 |
| EMP-02 | View weekly menu | Navigate to /dashboard |
| EMP-03 | Book lunch for tomorrow | Go to /book, click on future day |
| EMP-04 | Cancel lunch booking | Go to /book, click on day with "Ăn" status |
| EMP-05 | View booking history | Navigate to /my-history |
| EMP-06 | Logout | Click logout button |
| EMP-07 | Access admin page (should fail) | Try to access /admin/dashboard |

### Admin (admin) - UAT Scenarios

| Scenario ID | Description | Steps |
|-------------|-------------|-------|
| ADM-01 | Login as admin | Login with admin/admin123 |
| ADM-02 | View dashboard stats | See total employees, eating count |
| ADM-03 | Navigate to employee management | Click "Quản lý nhân sự" |
| ADM-04 | View employee list | See all employees in table |
| ADM-05 | Add new employee | Click "Thêm", fill form |
| ADM-06 | Edit employee | Click edit on an employee |
| ADM-07 | Deactivate employee | Click delete, confirm |
| ADM-08 | Generate report | Navigate to /admin/reports |
| ADM-09 | Export report to Excel | Click "Tải Excel" |
| ADM-10 | Logout | Click logout button |

---

## Database Verification

### Query to verify users in database:

```bash
python .claude/skills/sqlite-tools/scripts/sqlite_query.py \
  --database prisma/dev.db \
  --query "SELECT id, username, name, role, isActive FROM User WHERE isActive = 1"
```

### Expected output (active users only):
- admin (role: admin)
- nguyenvana, tranthib, levanc, phamthid, hoangvane (role: employee)

---

## Troubleshooting

### Issue: "Invalid credentials" when logging in

**Possible causes:**
1. Wrong password - ensure using exact credentials from table above
2. Database not seeded - run `npx prisma db seed`
3. Using wrong database file - verify `prisma/dev.db` exists

### Issue: UI shows wrong data

**Solution:**
```bash
# Reset database to clean state
rm prisma/dev.db
npx prisma db push
npx prisma db seed
```

### Issue: Cannot see employee registration

**Verification query:**
```bash
python .claude/skills/sqlite-tools/scripts/sqlite_query.py \
  --database prisma/dev.db \
  --query "SELECT * FROM Registration"
```

---

## Session Information

- **Token Expiry:** 7 days (Max-Age=604800)
- **Cookie Settings:** HttpOnly, SameSite=Lax
- **Rate Limiting:** 5 failed attempts → 15 min lockout (in production)

---

## Test Data Summary

| Entity | Count | Notes |
|--------|-------|-------|
| Users (active) | 28 | 1 admin + 5 seeded employees + 22 test users |
| Meals | 20 | 5 main + 10 vegetable + 5 dessert |
| Daily Menus | 5 | Mon-Fri of current week |

---

**Prepared for UAT by:** AI Test Engineer
**Status:** Ready for Testing