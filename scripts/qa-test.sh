#!/bin/bash
# qa-test.sh - generic QA test runner với token files
# Usage: qa-test.sh <admin_token_file> <emp_token_file>
set -e
ADMIN_FILE="$1"
EMP_FILE="$2"
read ADMIN_TOKEN < "$ADMIN_FILE"
read EMP_TOKEN < "$EMP_FILE"
echo "Admin token len=${#ADMIN_TOKEN}"
echo "Emp token len=${#EMP_TOKEN}"

echo "=== GET /api/admin/settings/cutoff (admin) ==="
curl -s -H "Cookie: token=$ADMIN_TOKEN" "http://127.0.0.1:3000/api/admin/settings/cutoff" -w "\nHTTP %{http_code}\n" --max-time 10

echo
echo "=== GET /api/admin/settings/cutoff (employee) ==="
curl -s -H "Cookie: token=$EMP_TOKEN" "http://127.0.0.1:3000/api/admin/settings/cutoff" -w "\nHTTP %{http_code}\n" --max-time 10

echo
echo "=== GET /api/settings/cutoff (no auth) — security check ==="
curl -s "http://127.0.0.1:3000/api/settings/cutoff" -w "\nHTTP %{http_code}\n" --max-time 10

echo
echo "=== PUT /api/admin/settings/cutoff validation ==="
for case in '{"cutoffHour":-1,"cutoffMinute":0}' \
            '{"cutoffHour":24,"cutoffMinute":0}' \
            '{"cutoffHour":12,"cutoffMinute":60}' \
            '{"cutoffHour":"abc","cutoffMinute":0}' \
            '{}' \
            '{"cutoffHour":null,"cutoffMinute":null}' \
            '{"cutoffHour":12.5,"cutoffMinute":0}'; do
  echo "  $case"
  curl -s -H "Cookie: token=$ADMIN_TOKEN" -X PUT -H "Content-Type: application/json" \
    -d "$case" "http://127.0.0.1:3000/api/admin/settings/cutoff" \
    -w "\n    HTTP %{http_code}\n" --max-time 10
done
echo "  Valid (20:00):"
curl -s -H "Cookie: token=$ADMIN_TOKEN" -X PUT -H "Content-Type: application/json" \
  -d '{"cutoffHour":20,"cutoffMinute":0}' "http://127.0.0.1:3000/api/admin/settings/cutoff" \
  -w "\n    HTTP %{http_code}\n" --max-time 10
echo "  Restore 23:00:"
curl -s -H "Cookie: token=$ADMIN_TOKEN" -X PUT -H "Content-Type: application/json" \
  -d '{"cutoffHour":23,"cutoffMinute":0}' "http://127.0.0.1:3000/api/admin/settings/cutoff" \
  -w "\n    HTTP %{http_code}\n" --max-time 10

echo
echo "=== PUT (employee) — should be 403 ==="
curl -s -H "Cookie: token=$EMP_TOKEN" -X PUT -H "Content-Type: application/json" \
  -d '{"cutoffHour":18,"cutoffMinute":0}' "http://127.0.0.1:3000/api/admin/settings/cutoff" \
  -w "\nHTTP %{http_code}\n" --max-time 10

echo
echo "=== Malformed JSON ==="
curl -s -H "Cookie: token=$ADMIN_TOKEN" -X PUT -H "Content-Type: application/json" \
  -d 'NOT_JSON' "http://127.0.0.1:3000/api/admin/settings/cutoff" \
  -w "\nHTTP %{http_code}\n" --max-time 10