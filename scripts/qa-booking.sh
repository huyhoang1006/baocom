#!/bin/bash
# qa-booking.sh - Test booking flows
set -e
ADMIN_FILE="$1"
EMP_FILE="$2"
read ADMIN_TOKEN < "$ADMIN_FILE"
read EMP_TOKEN < "$EMP_FILE"

BASE="http://127.0.0.1:3000"

# Compute test dates (using date command)
# Today = 2026-06-21 (Sunday per system date)
TODAY=$(date +%Y-%m-%d)
# Tomorrow = first workday (skip Sunday → Monday)
TOMORROW=$(date -d "+1 day" +%Y-%m-%d 2>/dev/null || date -v+1d +%Y-%m-%d)
# 2 days from now
DAY_AFTER=$(date -d "+2 days" +%Y-%m-%d 2>/dev/null || date -v+2d +%Y-%m-%d)
# Last week
LAST_WEEK=$(date -d "-7 days" +%Y-%m-%d 2>/dev/null || date -v-7d +%Y-%m-%d)
# 30 days from now (out of 4-week window)
WAY_OUT=$(date -d "+30 days" +%Y-%m-%d 2>/dev/null || date -v+30d +%Y-%m-%d)

echo "Today=$TODAY Tomorrow=$TOMORROW DayAfter=$DAY_AFTER LastWeek=$LAST_WEEK WayOut=$WAY_OUT"
echo

# Find a Saturday (weekend)
for offset in 1 2 3 4 5 6 7; do
  d=$(date -d "+$offset days" +%Y-%m-%d 2>/dev/null || date -v+${offset}d +%Y-%m-%d)
  dow=$(date -d "$d" +%u 2>/dev/null || date -j -f "%Y-%m-%d" "$d" +%u)
  if [ "$dow" = "6" ] || [ "$dow" = "7" ]; then
    WEEKEND_DATE="$d"
    break
  fi
done
echo "Weekend date=$WEEKEND_DATE (dow=$dow)"

echo
echo "=== BOOK-12: List registrations của employee ==="
curl -s -H "Cookie: token=$EMP_TOKEN" "$BASE/api/registrations" -w "\nHTTP %{http_code}\n" --max-time 10

echo
echo "=== BOOK-01: POST eating cho tomorrow ==="
curl -s -H "Cookie: token=$EMP_TOKEN" -X POST -H "Content-Type: application/json" \
  -d "{\"date\":\"$TOMORROW\",\"status\":\"eating\"}" \
  "$BASE/api/registrations" -w "\nHTTP %{http_code}\n" --max-time 10

echo
echo "=== BOOK-02: POST not_eating ==="
curl -s -H "Cookie: token=$EMP_TOKEN" -X POST -H "Content-Type: application/json" \
  -d "{\"date\":\"$DAY_AFTER\",\"status\":\"not_eating\"}" \
  "$BASE/api/registrations" -w "\nHTTP %{http_code}\n" --max-time 10

echo
echo "=== BOOK-04: POST today (DATE_NOT_FUTURE) ==="
curl -s -H "Cookie: token=$EMP_TOKEN" -X POST -H "Content-Type: application/json" \
  -d "{\"date\":\"$TODAY\",\"status\":\"eating\"}" \
  "$BASE/api/registrations" -w "\nHTTP %{http_code}\n" --max-time 10

echo
echo "=== BOOK-04b: POST past date ==="
curl -s -H "Cookie: token=$EMP_TOKEN" -X POST -H "Content-Type: application/json" \
  -d "{\"date\":\"$LAST_WEEK\",\"status\":\"eating\"}" \
  "$BASE/api/registrations" -w "\nHTTP %{http_code}\n" --max-time 10

echo
echo "=== BOOK-05: POST weekend ==="
if [ -n "$WEEKEND_DATE" ]; then
  curl -s -H "Cookie: token=$EMP_TOKEN" -X POST -H "Content-Type: application/json" \
    -d "{\"date\":\"$WEEKEND_DATE\",\"status\":\"eating\"}" \
    "$BASE/api/registrations" -w "\nHTTP %{http_code}\n" --max-time 10
fi

echo
echo "=== BOOK-08: POST way out (30 days) ==="
curl -s -H "Cookie: token=$EMP_TOKEN" -X POST -H "Content-Type: application/json" \
  -d "{\"date\":\"$WAY_OUT\",\"status\":\"eating\"}" \
  "$BASE/api/registrations" -w "\nHTTP %{http_code}\n" --max-time 10

echo
echo "=== BOOK-02: Update existing (PUT same date, different status) ==="
curl -s -H "Cookie: token=$EMP_TOKEN" -X POST -H "Content-Type: application/json" \
  -d "{\"date\":\"$TOMORROW\",\"status\":\"not_eating\"}" \
  "$BASE/api/registrations" -w "\nHTTP %{http_code}\n" --max-time 10

echo
echo "=== BOOK-03: Double POST same date (race) ==="
curl -s -H "Cookie: token=$EMP_TOKEN" -X POST -H "Content-Type: application/json" \
  -d "{\"date\":\"$TOMORROW\",\"status\":\"eating\"}" \
  "$BASE/api/registrations" -w "\nHTTP %{http_code}\n" --max-time 10

echo
echo "=== Invalid status ==="
curl -s -H "Cookie: token=$EMP_TOKEN" -X POST -H "Content-Type: application/json" \
  -d "{\"date\":\"$TOMORROW\",\"status\":\"INVALID\"}" \
  "$BASE/api/registrations" -w "\nHTTP %{http_code}\n" --max-time 10

echo
echo "=== Empty body ==="
curl -s -H "Cookie: token=$EMP_TOKEN" -X POST -H "Content-Type: application/json" \
  -d '{}' \
  "$BASE/api/registrations" -w "\nHTTP %{http_code}\n" --max-time 10

echo
echo "=== SQL injection date ==="
curl -s -H "Cookie: token=$EMP_TOKEN" -X POST -H "Content-Type: application/json" \
  -d "{\"date\":\"2026-06-01' OR '1'='1\",\"status\":\"eating\"}" \
  "$BASE/api/registrations" -w "\nHTTP %{http_code}\n" --max-time 10