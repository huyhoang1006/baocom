#!/bin/bash
# qa-leak.sh - verify password leak
set -e
ADMIN_FILE="$1"
read ADMIN_TOKEN < "$ADMIN_FILE"
BASE="http://127.0.0.1:3000"

echo "=== POST /api/users with known password ==="
RESP=$(curl -s -H "Cookie: token=$ADMIN_TOKEN" -X POST -H "Content-Type: application/json" \
  -d '{"username":"test_qa_leakcheck","password":"Sup3rS3cret!","name":"Leak Check","role":"employee"}' \
  "$BASE/api/users" --max-time 10)
echo "Response:"
echo "$RESP"
echo
echo "=== Search for 'Sup3rS3cret!' in response ==="
if echo "$RESP" | grep -q "Sup3rS3cret"; then
  echo "BUG CONFIRMED: Password leaked in cleartext!"
else
  echo "No plain-text leak detected."
fi

# Cleanup
LEAK_ID=$(curl -s -H "Cookie: token=$ADMIN_TOKEN" "$BASE/api/users" --max-time 10 | grep -oE '"id":"[^"]*","username":"test_qa_leakcheck"' | sed 's/.*"id":"\([^"]*\)".*/\1/' | head -1)
echo "Cleanup ID: $LEAK_ID"
curl -s -H "Cookie: token=$ADMIN_TOKEN" -X DELETE "$BASE/api/users/$LEAK_ID" --max-time 10
echo