#!/bin/bash
# qa-admin.sh - admin API tests
set -e
ADMIN_FILE="$1"
EMP_FILE="$2"
read ADMIN_TOKEN < "$ADMIN_FILE"
read EMP_TOKEN < "$EMP_FILE"

BASE="http://127.0.0.1:3000"

echo "=== GET /api/users (admin) ==="
curl -s -H "Cookie: token=$ADMIN_TOKEN" "$BASE/api/users" --max-time 10 | head -c 500
echo
echo
echo "=== GET /api/users — full check for password leak ==="
USERS_JSON=$(curl -s -H "Cookie: token=$ADMIN_TOKEN" "$BASE/api/users" --max-time 10)
echo "$USERS_JSON" | python3 -c "import json,sys; data=json.load(sys.stdin); users=data if isinstance(data,list) else data.get('users',data); print('Total users:', len(users) if isinstance(users,list) else 'N/A'); 
for u in (users if isinstance(users,list) else []):
    has_pwd = 'password' in u
    print(f\"  {u.get('username')}: has_password_field={has_pwd}\")" 2>&1

echo
echo "=== POST /api/users ==="
curl -s -H "Cookie: token=$ADMIN_TOKEN" -X POST -H "Content-Type: application/json" \
  -d '{"username":"test_qa1","password":"test1234","name":"Test QA","role":"employee"}' \
  "$BASE/api/users" -w "\nHTTP %{http_code}\n" --max-time 10

echo
echo "=== POST /api/users — duplicate ==="
curl -s -H "Cookie: token=$ADMIN_TOKEN" -X POST -H "Content-Type: application/json" \
  -d '{"username":"test_qa1","password":"test1234","name":"Test QA","role":"employee"}' \
  "$BASE/api/users" -w "\nHTTP %{http_code}\n" --max-time 10

echo
echo "=== POST /api/users — short password ==="
curl -s -H "Cookie: token=$ADMIN_TOKEN" -X POST -H "Content-Type: application/json" \
  -d '{"username":"test_qa2","password":"ab","name":"X","role":"employee"}' \
  "$BASE/api/users" -w "\nHTTP %{http_code}\n" --max-time 10

echo
echo "=== POST /api/users — invalid role ==="
curl -s -H "Cookie: token=$ADMIN_TOKEN" -X POST -H "Content-Type: application/json" \
  -d '{"username":"test_qa3","password":"test1234","name":"X","role":"superadmin"}' \
  "$BASE/api/users" -w "\nHTTP %{http_code}\n" --max-time 10

echo
echo "=== POST /api/users — XSS in name ==="
curl -s -H "Cookie: token=$ADMIN_TOKEN" -X POST -H "Content-Type: application/json" \
  -d '{"username":"test_qa4","password":"test1234","name":"<script>alert(1)</script>","role":"employee"}' \
  "$BASE/api/users" -w "\nHTTP %{http_code}\n" --max-time 10

echo
echo "=== GET /api/departments (admin) ==="
curl -s -H "Cookie: token=$ADMIN_TOKEN" "$BASE/api/departments" --max-time 10 | head -c 400
echo

echo
echo "=== POST /api/departments ==="
curl -s -H "Cookie: token=$ADMIN_TOKEN" -X POST -H "Content-Type: application/json" \
  -d '{"name":"QA Test Dept","description":"Testing"}' \
  "$BASE/api/departments" -w "\nHTTP %{http_code}\n" --max-time 10

echo
echo "=== POST /api/departments — duplicate ==="
curl -s -H "Cookie: token=$ADMIN_TOKEN" -X POST -H "Content-Type: application/json" \
  -d '{"name":"QA Test Dept","description":"Dup"}' \
  "$BASE/api/departments" -w "\nHTTP %{http_code}\n" --max-time 10

echo
echo "=== GET /api/meals (admin) ==="
curl -s -H "Cookie: token=$ADMIN_TOKEN" "$BASE/api/meals" --max-time 10 | head -c 400
echo

echo
echo "=== POST /api/meals/find-or-create ==="
curl -s -H "Cookie: token=$ADMIN_TOKEN" -X POST -H "Content-Type: application/json" \
  -d '{"name":"Món QA Test","type":"main"}' \
  "$BASE/api/meals/find-or-create" -w "\nHTTP %{http_code}\n" --max-time 10
echo
echo "  Same name again (should be idempotent):"
curl -s -H "Cookie: token=$ADMIN_TOKEN" -X POST -H "Content-Type: application/json" \
  -d '{"name":"Món QA Test","type":"main"}' \
  "$BASE/api/meals/find-or-create" -w "\nHTTP %{http_code}\n" --max-time 10

echo
echo "=== GET /api/holidays ==="
curl -s -H "Cookie: token=$ADMIN_TOKEN" "$BASE/api/holidays" --max-time 10 | head -c 400
echo
echo "  (employee also?):"
curl -s -H "Cookie: token=$EMP_TOKEN" "$BASE/api/holidays" --max-time 10 -w "\n  HTTP %{http_code}\n" | head -c 400
echo

echo
echo "=== POST /api/holidays ==="
curl -s -H "Cookie: token=$ADMIN_TOKEN" -X POST -H "Content-Type: application/json" \
  -d '{"date":"2026-09-02","description":"QA Test holiday"}' \
  "$BASE/api/holidays" -w "\nHTTP %{http_code}\n" --max-time 10
echo
echo "  Duplicate:"
curl -s -H "Cookie: token=$ADMIN_TOKEN" -X POST -H "Content-Type: application/json" \
  -d '{"date":"2026-09-02","description":"Dup"}' \
  "$BASE/api/holidays" -w "\nHTTP %{http_code}\n" --max-time 10

echo
echo "=== GET /api/admin/stats (admin) ==="
curl -s -H "Cookie: token=$ADMIN_TOKEN" "$BASE/api/admin/stats" --max-time 10 | head -c 500
echo

echo
echo "=== GET /api/admin/stats/date/2026-06-22 ==="
curl -s -H "Cookie: token=$ADMIN_TOKEN" "$BASE/api/admin/stats/date/2026-06-22" --max-time 10 | head -c 500
echo

echo
echo "=== POST /api/daily-menus (admin) ==="
curl -s -H "Cookie: token=$ADMIN_TOKEN" -X POST -H "Content-Type: application/json" \
  -d '{"date":"2026-06-22"}' \
  "$BASE/api/daily-menus" -w "\nHTTP %{http_code}\n" --max-time 10

echo
echo "=== Cleanup test users ==="
node scripts/qa-db.mjs list 2>&1 | head -3