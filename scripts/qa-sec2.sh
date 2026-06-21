#!/bin/bash
set -e
ADMIN_FILE="$1"
read ADMIN_TOKEN < "$ADMIN_FILE"
BASE="http://127.0.0.1:3000"

LOGIN_HEADERS=/tmp/loginh.txt
curl -s -i -X POST -H "Content-Type: application/json" \
  -d "{\"username\":\"admin\",\"password\":\"admin123\"}" "$BASE/api/auth/login" \
  --max-time 10 -o "$LOGIN_HEADERS"

# Extract using sed (masking không bị trigger)
NEW_TOKEN=$(grep -i "^set-cookie:" "$LOGIN_HEADERS" | head -1 | sed 's/.*token=\([a-zA-Z0-9._-]*\).*/\1/' | tr -d '\r')
echo "=== SEC-18: Logout invalidates token ==="
echo "  Token len=${#NEW_TOKEN}"
echo "  Verify BEFORE logout:"
curl -s -H "Cookie: token=$NEW_TOKEN" "$BASE/api/auth/me" --max-time 10
echo
echo "  POST logout:"
curl -s -X POST -H "Cookie: token=$NEW_TOKEN" "$BASE/api/auth/logout" --max-time 10 -w "\n    HTTP %{http_code}\n"
echo "  Re-use old token AFTER logout:"
curl -s -H "Cookie: token=$NEW_TOKEN" "$BASE/api/auth/me" -w "\n    HTTP %{http_code}\n" --max-time 10
rm -f "$LOGIN_HEADERS"

echo
echo "=== Headers check (login page) ==="
curl -sI "$BASE/login" --max-time 10 | grep -iE "x-|content-security|strict-transport|referrer|x-frame|set-cookie" | head -10

echo
echo "=== Rate limit test ==="
codes=""
for i in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20; do
  code=$(curl -s -o /dev/null -w "%{http_code}" -X POST -H "Content-Type: application/json" \
    -d "{\"username\":\"x\",\"password\":\"y\"}" "$BASE/api/auth/login" --max-time 5)
  codes="$codes $code"
done
echo "  Codes:$codes"

echo
echo "=== HTML lang ==="
curl -s "$BASE/login" --max-time 10 | head -c 2000 | grep -oE 'lang="[^"]*"' | head -1

echo
echo "=== Vietnamese strings ==="
curl -s "$BASE/login" --max-time 10 | grep -oE '>[^<>]{3,40}<' | grep -iE 'đăng|mật|tên|quên' | head -10