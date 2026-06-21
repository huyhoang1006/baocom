#!/bin/bash
# qa-admin2.sh - test user CRUD + admin override
set -e
ADMIN_FILE="$1"
EMP_FILE="$2"
read ADMIN_TOKEN < "$ADMIN_FILE"
read EMP_TOKEN < "$EMP_FILE"

BASE="http://127.0.0.1:3000"

# Create test user
echo "=== Create test_qa1 ==="
curl -s -H "Cookie: token=$ADMIN_TOKEN" -X POST -H "Content-Type: application/json" \
  -d '{"username":"test_qa1","password":"test1234","name":"Test QA","role":"employee"}' \
  "$BASE/api/users" -w "\nHTTP %{http_code}\n" --max-time 10

# Get ID
TEST_ID=$(curl -s -H "Cookie: token=$ADMIN_TOKEN" "$BASE/api/users" --max-time 10 | grep -oE '"id":"[^"]*","username":"test_qa1"' | sed 's/.*"id":"\([^"]*\)".*/\1/' | head -1)
echo "test_qa1 ID: $TEST_ID"
echo

echo "=== GET /api/users/nonexistent (404 expected) ==="
curl -s -H "Cookie: token=$ADMIN_TOKEN" "$BASE/api/users/nonexistent" -w "\nHTTP %{http_code}\n" --max-time 10

echo
echo "=== GET /api/users/{id} (admin) ==="
curl -s -H "Cookie: token=$ADMIN_TOKEN" "$BASE/api/users/$TEST_ID" -w "\nHTTP %{http_code}\n" --max-time 10

echo
echo "=== PATCH name (admin) ==="
curl -s -H "Cookie: token=$ADMIN_TOKEN" -X PATCH -H "Content-Type: application/json" \
  -d '{"name":"Test QA Updated"}' "$BASE/api/users/$TEST_ID" \
  -w "\nHTTP %{http_code}\n" --max-time 10

echo
echo "=== PATCH (employee) — should be 403 ==="
curl -s -H "Cookie: token=$EMP_TOKEN" -X PATCH -H "Content-Type: application/json" \
  -d '{"name":"Hacker"}' "$BASE/api/users/$TEST_ID" \
  -w "\nHTTP %{http_code}\n" --max-time 10

echo
echo "=== PATCH set isActive=false ==="
curl -s -H "Cookie: token=$ADMIN_TOKEN" -X PATCH -H "Content-Type: application/json" \
  -d '{"isActive":false}' "$BASE/api/users/$TEST_ID" \
  -w "\nHTTP %{http_code}\n" --max-time 10

echo
echo "=== Verify test_qa1 cannot login when disabled ==="
curl -s -X POST -H "Content-Type: application/json" \
  -d '{"username":"test_qa1","password":"test1234"}' "$BASE/api/auth/login" \
  -w "\nHTTP %{http_code}\n" --max-time 10

echo
echo "=== Re-enable ==="
curl -s -H "Cookie: token=$ADMIN_TOKEN" -X PATCH -H "Content-Type: application/json" \
  -d '{"isActive":true}' "$BASE/api/users/$TEST_ID" \
  -w "\nHTTP %{http_code}\n" --max-time 10

echo
echo "=== PATCH role to admin (vertical escalation) ==="
curl -s -H "Cookie: token=$ADMIN_TOKEN" -X PATCH -H "Content-Type: application/json" \
  -d '{"role":"admin"}' "$BASE/api/users/$TEST_ID" \
  -w "\nHTTP %{http_code}\n" --max-time 10

echo
echo "=== DELETE /api/users/{id} (admin) ==="
curl -s -H "Cookie: token=$ADMIN_TOKEN" -X DELETE "$BASE/api/users/$TEST_ID" \
  -w "\nHTTP %{http_code}\n" --max-time 10

echo
echo "=== DELETE (employee) — should be 403 ==="
curl -s -H "Cookie: token=$EMP_TOKEN" -X DELETE "$BASE/api/users/$TEST_ID" \
  -w "\nHTTP %{http_code}\n" --max-time 10

echo
echo "=== Verify test_qa1 deleted (404) ==="
curl -s -H "Cookie: token=$ADMIN_TOKEN" "$BASE/api/users/$TEST_ID" -w "\nHTTP %{http_code}\n" --max-time 10

echo
echo "=== XSS in name (XSS payload) ==="
curl -s -H "Cookie: token=$ADMIN_TOKEN" -X POST -H "Content-Type: application/json" \
  -d '{"username":"test_qa_xss","password":"test1234","name":"<img src=x onerror=alert(1)>","role":"employee"}' \
  "$BASE/api/users" -w "\nHTTP %{http_code}\n" --max-time 10

echo
echo "=== Login as test_qa_xss and fetch /api/auth/me ==="
XSS_TOKEN=*** -s -i -X POST $BASE/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test_qa_xss","password":"test1234"}' --max-time 10 \
  | grep -i "^set-cookie:" | sed 's/.*token=\([^;]*\).*/\1/' | tr -d '\r')
echo "  XSS_TOKEN len=${#XSS_TOKEN}"
curl -s -H "Cookie: token=$XSS_TOKEN" "$BASE/api/auth/me" --max-time 10
echo

echo
echo "=== Cleanup XSS user ==="
XSS_ID=$(curl -s -H "Cookie: token=$ADMIN_TOKEN" "$BASE/api/users" --max-time 10 | grep -oE '"id":"[^"]*","username":"test_qa_xss"' | sed 's/.*"id":"\([^"]*\)".*/\1/' | head -1)
echo "  XSS ID: $XSS_ID"
curl -s -H "Cookie: token=$ADMIN_TOKEN" -X DELETE "$BASE/api/users/$XSS_ID" -w "\nHTTP %{http_code}\n" --max-time 10