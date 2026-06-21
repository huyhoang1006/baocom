#!/bin/bash
set -e
ADMIN_FILE="$1"
read ADMIN_TOKEN < "$ADMIN_FILE"

echo "=== Reports — try various params ==="
for url in \
  "/api/admin/reports?type=day&startDate=2026-06-20&endDate=2026-06-22" \
  "/api/admin/reports?from=2026-06-20&to=2026-06-22" \
  "/api/admin/reports?start=2026-06-20&end=2026-06-22" \
  "/api/admin/reports?date=2026-06-22" \
  "/api/admin/reports?type=week&date=2026-06-22" \
  "/api/admin/reports?type=month&date=2026-06-22" \
  "/api/admin/reports?type=day&from=2026-06-22&to=2026-06-22" \
  "/api/admin/reports?type=day&startDate=2026-06-22&endDate=2026-06-22"; do
  echo "  GET $url:"
  curl -s -H "Cookie: token=$ADMIN_TOKEN" "http://127.0.0.1:3000$url" --max-time 10 | head -c 300
  echo
done

echo
echo "=== Export with correct params ==="
curl -s -H "Cookie: token=$ADMIN_TOKEN" "http://127.0.0.1:3000/api/admin/reports/export?type=day&from=2026-06-22&to=2026-06-22" \
  -w "HTTP %{http_code} CT=%{content_type} size=%{size_download}\n" \
  --max-time 30 -o /tmp/report.csv
echo "  File first 200 bytes:"
head -c 200 /tmp/report.csv
echo
echo "  BOM:"
head -c 3 /tmp/report.csv | xxd | head -1