#!/bin/bash
# ============================================================
# BaoCom API Authentication Test Suite
# Standard: IEEE 829-2008
# Version: 1.0
# Date: 2026-05-14
# ============================================================

BASE_URL="http://localhost:3000"
PASS=0
FAIL=0

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

check_response() {
  local test_name="$1"
  local expected_status="$2"
  local actual_status="$3"
  local response="$4"

  echo "Testing: $test_name"
  echo "  Expected: HTTP $expected_status"
  echo "  Actual:   HTTP $actual_status"

  if [ "$actual_status" == "$expected_status" ]; then
    echo -e "  ${GREEN}PASS${NC}"
    ((PASS++))
  else
    echo -e "  ${RED}FAIL${NC}"
    echo "  Response: $response"
    ((FAIL++))
  fi
  echo "---"
}

echo "=== Checking server availability ==="
curl -s --fail "$BASE_URL/api/auth" > /dev/null 2>&1
if [ $? -ne 0 ]; then
  echo -e "${RED}ERROR: Server not available at $BASE_URL${NC}"
  echo "Please start the dev server: npm run dev"
  exit 1
fi
echo -e "${GREEN}Server is running${NC}"
echo "---"

# TC-AUTH-001: Login Success - Admin
echo "=== TC-AUTH-001: Login Success - Admin ==="
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}')

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed 's/HTTP_STATUS.*//')
check_response "TC-AUTH-001" "200" "$HTTP_STATUS" "$BODY"

ADMIN_LOGIN=$(curl -s -c - -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}')
ADMIN_TOKEN=$(echo "$ADMIN_LOGIN" | grep token | awk '{print $7}')

# TC-AUTH-002: Login Success - Employee
echo "=== TC-AUTH-002: Login Success - Employee ==="
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"nguyenvana","password":"employee123"}')

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed 's/HTTP_STATUS.*//')
check_response "TC-AUTH-002" "200" "$HTTP_STATUS" "$BODY"

EMP_LOGIN=$(curl -s -c - -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"nguyenvana","password":"employee123"}')
EMP_TOKEN=$(echo "$EMP_LOGIN" | grep token | awk '{print $7}')

# TC-AUTH-003: Login Failure - Invalid Password
echo "=== TC-AUTH-003: Login Failure - Invalid Password ==="
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"wrongpassword"}')

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed 's/HTTP_STATUS.*//')
check_response "TC-AUTH-003" "401" "$HTTP_STATUS" "$BODY"

# TC-AUTH-004: Login Failure - Missing Fields
echo "=== TC-AUTH-004: Login Failure - Missing Fields ==="
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin"}')

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed 's/HTTP_STATUS.*//')
check_response "TC-AUTH-004" "400" "$HTTP_STATUS" "$BODY"

# TC-AUTH-005: Auth Health Check
echo "=== TC-AUTH-005: Auth Health Check ==="
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X GET "$BASE_URL/api/auth")

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed 's/HTTP_STATUS.*//')
check_response "TC-AUTH-005" "200" "$HTTP_STATUS" "$BODY"

# TC-AUTH-401-001: No Token
echo "=== TC-AUTH-401-001: No Token ==="
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X GET "$BASE_URL/api/auth/me")

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed 's/HTTP_STATUS.*//')
check_response "TC-AUTH-401-001" "401" "$HTTP_STATUS" "$BODY"

# TC-AUTH-401-002: Invalid Token
echo "=== TC-AUTH-401-002: Invalid Token ==="
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X GET "$BASE_URL/api/auth/me" \
  -H "Cookie: token=invalid-token-format")

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed 's/HTTP_STATUS.*//')
check_response "TC-AUTH-401-002" "401" "$HTTP_STATUS" "$BODY"

# TC-AUTH-403-001: Employee Access Admin Stats (403)
echo "=== TC-AUTH-403-001: Employee Access Admin Stats ==="
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X GET "$BASE_URL/api/admin/stats" \
  -H "Cookie: token=$EMP_TOKEN")

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed 's/HTTP_STATUS.*//')
check_response "TC-AUTH-403-001" "403" "$HTTP_STATUS" "$BODY"

# TC-AUTH-403-002: Employee Access Admin Users (403)
echo "=== TC-AUTH-403-002: Employee Access Admin Users ==="
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X GET "$BASE_URL/api/users" \
  -H "Cookie: token=$EMP_TOKEN")

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed 's/HTTP_STATUS.*//')
check_response "TC-AUTH-403-002" "403" "$HTTP_STATUS" "$BODY"

# TC-USER-001: Get Current User (Me)
echo "=== TC-USER-001: Get Current User ==="
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X GET "$BASE_URL/api/auth/me" \
  -H "Cookie: token=$ADMIN_TOKEN")

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed 's/HTTP_STATUS.*//')
check_response "TC-USER-001" "200" "$HTTP_STATUS" "$BODY"

# TC-USER-002: Get Daily Menus
echo "=== TC-USER-002: Get Daily Menus ==="
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X GET "$BASE_URL/api/daily-menus" \
  -H "Cookie: token=$EMP_TOKEN")

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed 's/HTTP_STATUS.*//')
check_response "TC-USER-002" "200" "$HTTP_STATUS" "$BODY"

# TC-USER-003: Get Daily Menu by Date
echo "=== TC-USER-003: Get Daily Menu by Date ==="
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X GET "$BASE_URL/api/daily-menus/2026-05-20" \
  -H "Cookie: token=$EMP_TOKEN")

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed 's/HTTP_STATUS.*//')

if [ "$HTTP_STATUS" == "200" ] || [ "$HTTP_STATUS" == "404" ]; then
  echo "Testing: TC-USER-003"
  echo "  Expected: HTTP 200 or 404"
  echo "  Actual:   HTTP $HTTP_STATUS"
  echo -e "  ${GREEN}PASS${NC}"
  ((PASS++))
else
  echo "Testing: TC-USER-003"
  echo "  Expected: HTTP 200 or 404"
  echo "  Actual:   HTTP $HTTP_STATUS"
  echo -e "  ${RED}FAIL${NC}"
  ((FAIL++))
fi
echo "---"

# TC-USER-004: Get Registrations
echo "=== TC-USER-004: Get Registrations ==="
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X GET "$BASE_URL/api/registrations" \
  -H "Cookie: token=$EMP_TOKEN")

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed 's/HTTP_STATUS.*//')
check_response "TC-USER-004" "200" "$HTTP_STATUS" "$BODY"

# TC-USER-005: Logout
echo "=== TC-USER-005: Logout ==="
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "$BASE_URL/api/auth/logout" \
  -H "Cookie: token=$ADMIN_TOKEN")

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed 's/HTTP_STATUS.*//')
check_response "TC-USER-005" "200" "$HTTP_STATUS" "$BODY"

# TC-ADMIN-001: Admin Get Stats
echo "=== TC-ADMIN-001: Admin Get Stats ==="
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X GET "$BASE_URL/api/admin/stats" \
  -H "Cookie: token=$ADMIN_TOKEN")

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed 's/HTTP_STATUS.*//')
check_response "TC-ADMIN-001" "200" "$HTTP_STATUS" "$BODY"

# TC-ADMIN-002: Admin Get Users
echo "=== TC-ADMIN-002: Admin Get Users ==="
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X GET "$BASE_URL/api/users" \
  -H "Cookie: token=$ADMIN_TOKEN")

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed 's/HTTP_STATUS.*//')
check_response "TC-ADMIN-002" "200" "$HTTP_STATUS" "$BODY"

# TC-ADMIN-003: Admin Get Holidays
echo "=== TC-ADMIN-003: Admin Get Holidays ==="
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X GET "$BASE_URL/api/holidays" \
  -H "Cookie: token=$ADMIN_TOKEN")

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed 's/HTTP_STATUS.*//')
check_response "TC-ADMIN-003" "200" "$HTTP_STATUS" "$BODY"

# TC-ADMIN-004: Admin Get Meals
echo "=== TC-ADMIN-004: Admin Get Meals ==="
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X GET "$BASE_URL/api/meals" \
  -H "Cookie: token=$ADMIN_TOKEN")

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed 's/HTTP_STATUS.*//')
check_response "TC-ADMIN-004" "200" "$HTTP_STATUS" "$BODY"

echo ""
echo "=========================================="
echo "TEST SUMMARY"
echo "=========================================="
echo -e "Passed: ${GREEN}$PASS${NC}"
echo -e "Failed: ${RED}$FAIL${NC}"
echo "=========================================="

if [ $FAIL -eq 0 ]; then
  echo -e "${GREEN}All tests passed!${NC}"
  exit 0
else
  echo -e "${RED}Some tests failed!${NC}"
  exit 1
fi