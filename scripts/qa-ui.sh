#!/bin/bash
set -e
ADMIN_FILE="$1"
EMP_FILE="$2"
read ADMIN_TOKEN < "$ADMIN_FILE"
read EMP_TOKEN < "$EMP_FILE"
BASE="http://127.0.0.1:3000"

admin_curl() { curl -s -H "Cookie: token=$ADMIN_TOKEN" "$@"; }
emp_curl() { curl -s -H "Cookie: token=$EMP_TOKEN" "$@"; }

echo "=== UI snapshot (raw HTML, top 2KB) ==="

for path in "/login" "/dashboard" "/book" "/my-history"; do
  echo "--- $path (employee cookie) ---"
  emp_curl "$BASE$path" --max-time 10 | head -c 1500
  echo
done

for path in "/admin/dashboard" "/admin/menu" "/admin/employees" "/admin/holidays" "/admin/reports" "/admin/settings" "/admin/departments"; do
  echo "--- $path (admin cookie) ---"
  admin_curl "$BASE$path" --max-time 10 | head -c 1500
  echo
done

echo
echo "=== Look for 'Có ăn' / 'Không ăn' on book page ==="
emp_curl "$BASE/book" --max-time 10 | grep -oE '(Có ăn|Không ăn|Báo cơm|Tuần [0-9]+)' | sort -u | head -10

echo
echo "=== Check admin sidebar ==="
admin_curl "$BASE/admin/dashboard" --max-time 10 | grep -oE '(Dashboard|Thực đơn|Ngày lễ|Nhân sự|Báo cáo|Cài đặt|Phòng ban)' | sort -u | head -10

echo
echo "=== Check Vietnamese (no diacritics) error pattern in login page ==="
curl -s "$BASE/login" --max-time 10 | grep -oE '(Ngay nay|Nhan vien|Dang nhap|Mat khau)[^<]*' | head -10

echo
echo "=== Login page accessibility ==="
echo "  Buttons:"
curl -s "$BASE/login" --max-time 10 | grep -oE '<button[^>]*>[^<]*</button>' | head -10
echo
echo "  Inputs:"
curl -s "$BASE/login" --max-time 10 | grep -oE '<input[^>]*>' | head -10