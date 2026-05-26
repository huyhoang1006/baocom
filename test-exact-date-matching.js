const VIETNAM_OFFSET_MS = 7 * 60 * 60 * 1000;

function parseLocalDate(dateStr) {
  const dateOnly = dateStr.split('T')[0]
  const [year, month, day] = dateOnly.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0) - VIETNAM_OFFSET_MS)
}

function toDateKey(date) {
  const vietnamDate = new Date(date.getTime() + VIETNAM_OFFSET_MS)
  const year = vietnamDate.getUTCFullYear()
  const month = String(vietnamDate.getUTCMonth() + 1).padStart(2, '0')
  const day = String(vietnamDate.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// API menu dates with time component
const menuDates = [
  "2026-05-17T17:00:00.000Z",  // Monday 17:00 UTC = Tuesday 00:00 Vietnam
  "2026-05-18T00:00:00.000Z", // Monday 00:00 UTC = Monday 07:00 Vietnam  
  "2026-05-18T17:00:00.000Z",  // Tuesday 17:00 UTC = Wednesday 00:00 Vietnam
  "2026-05-19T17:00:00.000Z",  // Wednesday 17:00 UTC = Thursday 00:00 Vietnam
  "2026-05-20T17:00:00.000Z",  // Thursday 17:00 UTC = Friday 00:00 Vietnam
];

// Week date keys the dashboard is looking for
const weekDateKeys = ["2026-05-18", "2026-05-19", "2026-05-20", "2026-05-21", "2026-05-22"];

console.log("Correct approach: parse UTC directly and apply toDateKey\n");
for (const menuDateStr of menuDates) {
  const menuDate = new Date(menuDateStr);
  const menuDateKey = toDateKey(menuDate);
  const matches = weekDateKeys.includes(menuDateKey);
  console.log(`${menuDateStr} -> new Date: ${menuDate.toISOString()} -> toDateKey: ${menuDateKey} -> matches week: ${matches}`);
}
