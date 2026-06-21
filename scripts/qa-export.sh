#!/bin/bash
set -e
ADMIN_FILE="$1"
read ADMIN_TOKEN < "$ADMIN_FILE"

for url in \
  "/api/admin/reports/export?startDate=2026-06-22&endDate=2026-06-22" \
  "/api/admin/reports/export?type=day&startDate=2026-06-22&endDate=2026-06-22" \
  "/api/admin/reports/export?from=2026-06-22&to=2026-06-22" \
  "/api/admin/reports/export-xlsx?startDate=2026-06-22&endDate=2026-06-22" \
  "/api/admin/reports/export-xlsx?type=day&startDate=2026-06-22&endDate=2026-06-22"; do
  echo "  GET $url:"
  curl -s -H "Cookie: token=$ADMIN_TOKEN" "http://127.0.0.1:3000$url" \
    -w "    HTTP %{http_code} CT=%{content_type} size=%{size_download}\n" \
    --max-time 30 -o /tmp/report_t.tmp
  echo "    First 100 bytes (hex):"
  head -c 100 /tmp/report_t.tmp | od -c | head -3
  rm -f /tmp/report_t.tmp
  echo
done