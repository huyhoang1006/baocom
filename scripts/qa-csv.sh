#!/bin/bash
set -e
ADMIN_FILE="$1"
read ADMIN_TOKEN < "$ADMIN_FILE"

echo "=== Search for CSV endpoint ==="
for url in \
  "/api/admin/reports/csv?startDate=2026-06-22&endDate=2026-06-22" \
  "/api/admin/reports/export-csv?startDate=2026-06-22&endDate=2026-06-22" \
  "/api/admin/reports.csv?startDate=2026-06-22&endDate=2026-06-22" \
  "/api/admin/reports?format=csv&startDate=2026-06-22&endDate=2026-06-22" \
  "/api/admin/reports/export?format=csv&startDate=2026-06-22&endDate=2026-06-22"; do
  echo "  GET $url:"
  curl -s -H "Cookie: token=$ADMIN_TOKEN" "http://127.0.0.1:3000$url" \
    -w "    HTTP %{http_code} CT=%{content_type} size=%{size_download}\n" \
    --max-time 30 -o /tmp/csv_t.tmp
  head -c 80 /tmp/csv_t.tmp | od -c | head -2
  rm -f /tmp/csv_t.tmp
  echo
done

echo "=== Search source for CSV/Excel route ==="
find /c/Users/ADMIN/Downloads/temp_v9/baocom/app/api/admin/reports -type f 2>&1