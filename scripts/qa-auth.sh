#!/bin/bash
# Helper: read tokens from files
set -e

# Arg1: admin token file, Arg2: emp token file
ADMIN_FILE="$1"
EMP_FILE="$2"

# Load tokens safely
read_admin() {
  ADMIN_TOKEN=$(cat "$ADMIN_FILE")
}
read_emp() {
  EMP_TOKEN=$(cat "$EMP_FILE")
}

run_test() {
  local desc="$1"
  shift
  echo "=== $desc ==="
  eval "$@"
  echo
}

read_admin
echo "=== AUTH-04: Cookie tampered (đổi 1 char cuối) ==="
TAMPERED="${ADMIN_TOKEN:0:-1}X"
curl -s -H "Cookie: token=$TAMPERED" "http://127.0.0.1:3000/api/auth/me" -w "\nHTTP %{http_code}\n" --max-time 10
echo

echo "=== AUTH-10: tokenVersion bump invalidates token ==="
HUNG_TOKEN=$(curl -s -i -X POST http://127.0.0.1:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"hungpx","password":"employee123"}' --max-time 10 \
  | grep -i "^set-cookie:" | sed 's/.*token=\([^;]*\).*/\1/' | tr -d '\r')
echo "  hungpx token len=${#HUNG_TOKEN}"
echo "  /api/auth/me BEFORE bump:"
curl -s -H "Cookie: token=$HUNG_TOKEN" "http://127.0.0.1:3000/api/auth/me" -w "\n  HTTP %{http_code}\n" --max-time 10

cd /c/Users/ADMIN/Downloads/temp_v9/baocom
node scripts/qa-db.mjs bump-token hungpx > /dev/null
echo "  /api/auth/me AFTER bump:"
curl -s -H "Cookie: token=$HUNG_TOKEN" "http://127.0.0.1:3000/api/auth/me" -w "\n  HTTP %{http_code}\n" --max-time 10
echo

echo "=== /api/settings/cutoff validation (admin) ==="
# Re-login admin (tokenVersion might be bumped)
read_admin
if [ -z "$ADMIN_TOKEN" ] || ! curl -s -H "Cookie: token=$ADMIN_TOKEN" "http://127.0.0.1:3000/api/auth/me" --max-time 5 | grep -q admin; then
  echo "  Re-login admin..."
  ADMIN_TOKEN=$(curl -s -i -X POST http://127.0.0.1:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"admin123"}' --max-time 10 \
    | grep -i "^set-cookie:" | sed 's/.*token=\([^;]*\).*/\1/' | tr -d '\r')
  echo "$ADMIN_TOKEN" > "$ADMIN_FILE"
fi
for case in '{"cutoffHour":-1,"cutoffMinute":0}' \
            '{"cutoffHour":24,"cutoffMinute":0}' \
            '{"cutoffHour":12,"cutoffMinute":60}' \
            '{"cutoffHour":"abc","cutoffMinute":0}' \
            '{}'; do
  echo "  Payload: $case"
  curl -s -H "Cookie: token=$ADMIN_TOKEN" -X POST -H "Content-Type: application/json" \
    -d "$case" "http://127.0.0.1:3000/api/settings/cutoff" \
    -w "\n    HTTP %{http_code}\n" --max-time 10
done
echo "  Restore to 23:00:"
curl -s -H "Cookie: token=$ADMIN_TOKEN" -X POST -H "Content-Type: application/json" \
  -d '{"cutoffHour":23,"cutoffMinute":0}' "http://127.0.0.1:3000/api/settings/cutoff" \
  -w "\n    HTTP %{http_code}\n" --max-time 10