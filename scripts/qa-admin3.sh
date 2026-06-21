#!/bin/bash
# qa-admin3.sh - simpler admin tests
set -e
ADMIN_FILE="$1"
EMP_FILE="$2"
read ADMIN_TOKEN < "$ADMIN_FILE"
read EMP_TOKEN < "$EMP_FILE"

BASE="http://127.0.0.1:3000"

# Auth wrapper
admin_curl() { curl -s -H "Cookie: token=$ADMIN_TOKEN" "$@"; }
emp_curl() { curl -s -H "Cookie: token=$EMP_TOKEN" "$@"; }
admin_post() { curl -s -H "Cookie: token=$ADMIN_TOKEN" -X POST -H "Content-Type: application/json" "$@"; }

echo "=== GET /api/users/nonexistent ==="
admin_curl "$BASE/api/users/nonexistent" -w "\nHTTP %{http_code}\n" --max-time 10

echo
echo "=== GET /api/users/{ID} (admin) ==="
TEST_ID=$(admin_curl "$BASE/api/users" --max-time 10 | grep -oE '"id":"[^"]*","username":"test_qa1"' | sed 's/.*"id":"\([^"]*\)".*/\1/' | head -1)
echo "test_qa1 ID: $TEST_ID"
if [ -n "$TEST_ID" ]; then
  admin_curl "$BASE/api/users/$TEST_ID" -w "\nHTTP %{http_code}\n" --max-time 10
fi

echo
echo "=== PATCH name (admin) ==="
admin_curl -X PATCH -H "Content-Type: application/json" \
  -d '{"name":"Test QA Updated"}' "$BASE/api/users/$TEST_ID" \
  -w "\nHTTP %{http_code}\n" --max-time 10

echo
echo "=== PATCH (employee) — 403 expected ==="
emp_curl -X PATCH -H "Content-Type: application/json" \
  -d '{"name":"Hacker"}' "$BASE/api/users/$TEST_ID" \
  -w "\nHTTP %{http_code}\n" --max-time 10

echo
echo "=== PATCH set isActive=false ==="
admin_curl -X PATCH -H "Content-Type: application/json" \
  -d '{"isActive":false}' "$BASE/api/users/$TEST_ID" \
  -w "\nHTTP %{http_code}\n" --max-time 10

echo
echo "=== Verify test_qa1 cannot login when disabled ==="
curl -s -X POST -H "Content-Type: application/json" \
  -d '{"username":"test_qa1","password":"test1234"}' "$BASE/api/auth/login" \
  -w "\nHTTP %{http_code}\n" --max-time 10

echo
echo "=== Re-enable ==="
admin_curl -X PATCH -H "Content-Type: application/json" \
  -d '{"isActive":true}' "$BASE/api/users/$TEST_ID" \
  -w "\nHTTP %{http_code}\n" --max-time 10

echo
echo "=== PATCH role to admin ==="
admin_curl -X PATCH -H "Content-Type: application/json" \
  -d '{"role":"admin"}' "$BASE/api/users/$TEST_ID" \
  -w "\nHTTP %{http_code}\n" --max-time 10

echo
echo "=== DELETE /api/users/{id} (admin) ==="
admin_curl -X DELETE "$BASE/api/users/$TEST_ID" \
  -w "\nHTTP %{http_code}\n" --max-time 10

echo
echo "=== DELETE (employee) — 403 expected ==="
emp_curl -X DELETE "$BASE/api/users/$TEST_ID" \
  -w "\nHTTP %{http_code}\n" --max-time 10

echo
echo "=== Verify deleted (404) ==="
admin_curl "$BASE/api/users/$TEST_ID" -w "\nHTTP %{http_code}\n" --max-time 10

echo
echo "=== XSS via name field — verify stored and returned safely ==="
RESP=$(admin_post -d '{"username":"test_qa_xss","password":"test1234","name":"<img src=x onerror=alert(1)>","role":"employee"}' "$BASE/api/users")
echo "$RESP" -w "\nHTTP %{http_code}\n"

echo
echo "=== Verify XSS in /api/users response (should be escaped/safe in HTML context) ==="
XSS_ID=$(admin_curl "$BASE/api/users" --max-time 10 | grep -oE '"id":"[^"]*","username":"test_qa_xss"' | sed 's/.*"id":"\([^"]*\)".*/\1/' | head -1)
echo "XSS user ID: $XSS_ID"
admin_curl "$BASE/api/users/$XSS_ID" --max-time 10
echo

echo
echo "=== Cleanup XSS user ==="
admin_curl -X DELETE "$BASE/api/users/$XSS_ID" -w "\nHTTP %{http_code}\n" --max-time 10