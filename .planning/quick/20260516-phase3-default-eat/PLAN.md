# Phase 3: Default-Eat Employee Registration

## Description
Display default-eat status labels in employee booking UI.

## Success Criteria
1. Active employees counted as eating by default — ✅ already works (null from getStatusForDate = eating)
2. Employee can report absence for open date before cutoff — ✅ already works
3. Employee can cancel prior absence before cutoff — ✅ already works
4. Employee cannot change for past/weekend/holiday/locked — ✅ already works via isAllowedRegistrationDate
5. UI shows distinct labels: Mặc định có cơm, Đã báo nghỉ, Đã chốt — ✅ NEW

## Changes
- book/page.tsx: Added isDefault flag, status badge showing distinct labels
- Status badge shows: "Mặc định có cơm" (default, no record), "Đã báo nghỉ" (not-eating), "Đã chốt" (locked), "Đã đăng ký" (explicit eating)