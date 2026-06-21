#!/bin/bash
# qa-security.sh - additional security probing
set -e
ADMIN_FILE="$1"
EMP_FILE="$2"
read ADMIN_TOKEN < "$ADMIN_FILE"
read EMP_TOKEN < "$EMP_FILE"
BASE="http://127.0.0.1:3000"

admin_curl() { curl -s -H "Cookie: token=$ADMIN_TOKEN" "$@"; }
emp_curl() { curl -s -H "Cookie: token=$EMP_TOKEN" "$@"; }

echo "=== SEC-14: Auth bypass via header ==="
echo "  /api/users with X-User-Role header:"
curl -s -H "X-User-Role: admin" -H "X-User-Id: admin_id" "$BASE/api/users" -w "\n  HTTP %{http_code}\n" --max-time 10

echo
echo "=== SEC-08: SQL injection in URL params ==="
echo "  /api/admin/stats/date/2026-06-20'%20OR%20'1'='1:"
admin_curl "$BASE/api/admin/stats/date/2026-06-20'%20OR%20'1'='1" -w "\n  HTTP %{http_code}\n" --max-time 10

echo
echo "=== SEC-09: Path traversal ==="
echo "  /api/meals/../../etc/passwd:"
admin_curl "$BASE/api/meals/../../etc/passwd" -w "\n  HTTP %{http_code}\n" --max-time 10
echo "  /api/users/../admin:"
admin_curl "$BASE/api/users/../admin" -w "\n  HTTP %{http_code}\n" --max-time 10

echo
echo "=== SEC-15: Race condition - concurrent override ==="
echo "  Get a registration ID:"
REG_ID=$(emp_curl "$BASE/api/registrations" --max-time 10 | grep -oE '"id":"[^"]*"' | head -1 | sed 's/.*"id":"\([^"]*\)".*/\1/')
echo "  ID: $REG_ID"
echo "  Fire 5 concurrent overrides:"
for i in 1 2 3 4 5; do
  curl -s -H "Cookie: token=$ADMIN_TOKEN" -X PATCH -H "Content-Type: application/json" \
    -d "{\"status\":\"eating\",\"note\":\"Override $i\"}" \
    "$BASE/api/registrations/$REG_ID" --max-time 10 &
done
wait
echo "  All done. Final state:"
emp_curl "$BASE/api/registrations" --max-time 10 | grep -oE '"status":"[^"]*"' | head -3

echo
echo "=== SEC-03: IDOR — employee truy cập admin API với user_id của người khác ==="
echo "  /api/admin/employees/{other_id}/registrations (employee cookie):"
OTHER_ID=$(admin_curl "$BASE/api/users" --max-time 10 | grep -oE '"id":"[^"]*","username":"hungpx"' | sed 's/.*"id":"\([^"]*\)".*/\1/' | head -1)
echo "  Other user ID: $OTHER_ID"
emp_curl "$BASE/api/admin/employees/$OTHER_ID/registrations" -w "\n  HTTP %{http_code}\n" --max-time 10

echo
echo "=== SEC-18: Logout invalidates token? ==="
echo "  Login admin fresh:"
NEW_TOKEN=*** -s -i -X POST $BASE/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' --max-time 10 \
  | grep -i "^set-cookie:" | sed 's/.*token=\([^;]*\).*/\1/' | tr -d '\r')
echo "  New token len=${#NEW_TOKEN}"
echo "  Verify token works:"
curl -s -H "Cookie: token=$NEW_TOKEN" "$BASE/api/auth/me" --max-time 10
echo
echo "  Logout:"
curl -s -X POST -H "Cookie: token=$NEW_TOKEN" "$BASE/api/auth/logout" --max-time 10
echo
echo "  Re-use old token (should be 401 if invalidated):"
curl -s -H "Cookie: token=$NEW_TOKEN" "$BASE/api/auth/me" -w "\n  HTTP %{http_code}\n" --max-time 10

echo
echo "=== SEC-11: Sensitive data in error responses ==="
echo "  Force 500 via malformed payload:"
curl -s -H "Cookie: token=$ADMIN_TOKEN" -X POST -H "Content-Type: application/json" \
  -d 'INVALID' "$BASE/api/users" -w "\nHTTP %{http_code}\n" --max-time 10
echo
echo "  Login malformed JSON (re-test for 500):"
curl -s -X POST -H "Content-Type: application/json" -d 'NOT_JSON' "$BASE/api/auth/login" -w "\nHTTP %{http_code}\n" --max-time 10

echo
echo "=== SEC-17: HTTP security headers ==="
echo "  /login headers:"
curl -sI "$BASE/login" --max-time 10 | grep -iE "x-|content-security|strict-transport|referrer|x-frame" | head -20