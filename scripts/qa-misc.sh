#!/bin/bash
# qa-misc.sh - test remaining endpoints
set -e
ADMIN_FILE="$1"
EMP_FILE="$2"
read ADMIN_TOKEN < "$ADMIN_FILE"
read EMP_TOKEN < "$EMP_FILE"
BASE="http://127.0.0.1:3000"

admin_curl() { curl -s -H "Cookie: token=$ADMIN_TOKEN" "$@"; }
emp_curl() { curl -s -H "Cookie: token=$EMP_TOKEN" "$@"; }
admin_post() { curl -s -H "Cookie: token=$ADMIN_TOKEN" -X POST -H "Content-Type: application/json" "$@"; }

echo "=== Daily menu endpoints ==="
echo "  GET /api/daily-menus (admin):"
admin_curl "$BASE/api/daily-menus" --max-time 10 | head -c 400
echo
echo "  GET /api/daily-menus (employee):"
emp_curl "$BASE/api/daily-menus" --max-time 10 | head -c 400
echo
echo "  GET /api/daily-menus/2026-06-22 (employee):"
emp_curl "$BASE/api/daily-menus/2026-06-22" -w "\n  HTTP %{http_code}\n" --max-time 10

echo
echo "=== POST /api/daily-menus/batch ==="
admin_curl -X POST -H "Content-Type: application/json" \
  -d '{"weekStart":"2026-06-22","menus":[{"date":"2026-06-22","mealIds":[]}]}' \
  "$BASE/api/daily-menus/batch" -w "\nHTTP %{http_code}\n" --max-time 10

echo
echo "=== Reports endpoints ==="
echo "  GET /api/admin/reports (admin):"
admin_curl "$BASE/api/admin/reports?type=day&date=2026-06-22" -w "\nHTTP %{http_code}\n" --max-time 10 | head -c 500
echo
echo "  GET /api/admin/reports (employee) — 403:"
emp_curl "$BASE/api/admin/reports?type=day&date=2026-06-22" -w "\nHTTP %{http_code}\n" --max-time 10

echo
echo "=== Export CSV ==="
admin_curl "$BASE/api/admin/reports/export?type=day&date=2026-06-22" \
  -w "HTTP %{http_code}, Content-Type: %{content_type}, Size: %{size_download}\n" \
  --max-time 30 -o /tmp/report.csv
echo "  File first 200 bytes:"
head -c 200 /tmp/report.csv
echo
echo "  BOM check:"
head -c 3 /tmp/report.csv | xxd | head -1

echo
echo "=== Export XLSX ==="
admin_curl "$BASE/api/admin/reports/export-xlsx?type=day&date=2026-06-22" \
  -w "HTTP %{http_code}, Content-Type: %{content_type}, Size: %{size_download}\n" \
  --max-time 30 -o /tmp/report.xlsx
echo "  File first 4 bytes (should be PK):"
head -c 4 /tmp/report.xlsx | xxd | head -1

echo
echo "=== Registration override by admin ==="
echo "  PATCH /api/registrations/{id} (admin):"
REG_ID=$(emp_curl "$BASE/api/registrations" --max-time 10 \
  | grep -oE '"id":"[^"]*"' | head -1 | sed 's/.*"id":"\([^"]*\)".*/\1/')
echo "  Picking registration ID: $REG_ID"
admin_curl -X PATCH -H "Content-Type: application/json" \
  -d '{"status":"not_eating","note":"Admin override test"}' \
  "$BASE/api/registrations/$REG_ID" -w "\nHTTP %{http_code}\n" --max-time 10

echo
echo "=== PATCH registration by employee — should be 403 ==="
emp_curl -X PATCH -H "Content-Type: application/json" \
  -d '{"status":"eating"}' \
  "$BASE/api/registrations/$REG_ID" -w "\nHTTP %{http_code}\n" --max-time 10

echo
echo "=== DELETE registration by employee — should be 403 ==="
emp_curl -X DELETE "$BASE/api/registrations/$REG_ID" -w "\nHTTP %{http_code}\n" --max-time 10

echo
echo "=== Holiday CRUD ==="
echo "  POST holiday (admin):"
admin_post -d '{"date":"2026-12-25","description":"QA Test"}' "$BASE/api/holidays" -w "\nHTTP %{http_code}\n" --max-time 10
echo "  POST holiday (employee) — 403:"
emp_curl -X POST -H "Content-Type: application/json" \
  -d '{"date":"2026-12-26","description":"X"}' "$BASE/api/holidays" -w "\nHTTP %{http_code}\n" --max-time 10

echo
echo "=== Auth boundary on /api/admin/employees/[id]/registrations ==="
ADMIN_EMP_REG=$(admin_curl "$BASE/api/admin/employees/cmpi1h1rc00017ov6be7isuhf/registrations" -w "\nHTTP %{http_code}\n" --max-time 10 | head -c 300)
echo "  Admin: $ADMIN_EMP_REG"
echo "  Employee:"
emp_curl "$BASE/api/admin/employees/cmpi1h1rc00017ov6be7isuhf/registrations" -w "\nHTTP %{http_code}\n" --max-time 10

echo
echo "=== Departments endpoints ==="
echo "  GET (admin):"
admin_curl "$BASE/api/departments" --max-time 10 | head -c 300
echo
echo "  GET (employee):"
emp_curl "$BASE/api/departments" -w "\nHTTP %{http_code}\n" --max-time 10

echo
echo "=== Method not allowed tests ==="
echo "  PUT /api/auth/login (should be 405):"
curl -s -X PUT "http://127.0.0.1:3000/api/auth/login" -w "\nHTTP %{http_code}\n" --max-time 10
echo "  DELETE /api/auth/me:"
curl -s -X DELETE "http://127.0.0.1:3000/api/auth/me" -w "\nHTTP %{http_code}\n" --max-time 10