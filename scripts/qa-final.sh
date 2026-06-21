#!/bin/bash
set -e
ADMIN_FILE="$1"
EMP_FILE="$2"
read ADMIN_TOKEN < "$ADMIN_FILE"
read EMP_TOKEN < "$EMP_FILE"
BASE="http://127.0.0.1:3000"

admin_curl() { curl -s -H "Cookie: token=$ADMIN_TOKEN" "$@"; }

echo "=== Check API responses for password leak ==="
echo "--- /api/users (admin) ---"
admin_curl "$BASE/api/users" --max-time 10 | grep -oE '"password"' | wc -l | xargs -I {} echo "  'password' occurrences: {}"

echo "--- /api/users/{id} (admin) ---"
USER_ID=$(admin_curl "$BASE/api/users" --max-time 10 | grep -oE '"id":"[^"]*","username":"nguyenvana"' | sed 's/.*"id":"\([^"]*\)".*/\1/' | head -1)
echo "  nguyenvana ID: $USER_ID"
admin_curl "$BASE/api/users/$USER_ID" --max-time 10 | head -c 500
echo
echo "  'password' occurrences:"
admin_curl "$BASE/api/users/$USER_ID" --max-time 10 | grep -oE '"password"' | wc -l

echo "--- /api/auth/me (admin) ---"
admin_curl "$BASE/api/auth/me" --max-time 10
echo
echo "  'password' occurrences:"
admin_curl "$BASE/api/auth/me" --max-time 10 | grep -oE '"password"' | wc -l

echo
echo "--- /api/registrations (employee) — KNOWN LEAK ---"
EMP_ID=$(admin_curl "$BASE/api/users" --max-time 10 | grep -oE '"id":"[^"]*","username":"nguyenvana"' | sed 's/.*"id":"\([^"]*\)".*/\1/' | head -1)
curl -s -H "Cookie: token=$EMP_TOKEN" "$BASE/api/registrations" --max-time 10 | head -c 300
echo
echo "  'password' occurrences:"
curl -s -H "Cookie: token=$EMP_TOKEN" "$BASE/api/registrations" --max-time 10 | grep -oE '"password":"\$2b\$' | wc -l

echo
echo "--- /api/admin/employees/[id]/registrations ---"
admin_curl "$BASE/api/admin/employees/$EMP_ID/registrations" --max-time 10 | head -c 600
echo
echo "  'password' occurrences:"
admin_curl "$BASE/api/admin/employees/$EMP_ID/registrations" --max-time 10 | grep -oE '"password"' | wc -l

echo
echo "=== Holiday endpoint GET as anonymous ==="
curl -s "$BASE/api/holidays" --max-time 10 -w "\n  HTTP %{http_code}\n" | head -c 300

echo
echo "=== /api/daily-menus — verify caching headers ==="
curl -sI -H "Cookie: token=$EMP_TOKEN" "$BASE/api/daily-menus" --max-time 10 | grep -iE "cache|etag|last-modified" | head -5

echo
echo "=== Performance: /api/admin/reports timing ==="
for i in 1 2 3; do
  time_t=$(curl -s -H "Cookie: token=$ADMIN_TOKEN" "$BASE/api/admin/reports?type=day&startDate=2026-06-22&endDate=2026-06-22" --max-time 30 -w "%{time_total}\n" -o /dev/null)
  echo "  Request $i: ${time_t}s"
done