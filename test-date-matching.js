// Test the date matching logic from registrationWindow.ts

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

// Menu dates from API response
const menuDates = [
  "2026-05-17T17:00:00.000Z",
  "2026-05-18T00:00:00.000Z",
  "2026-05-18T17:00:00.000Z",
  "2026-05-19T17:00:00.000Z",
  "2026-05-20T17:00:00.000Z"
];

// Week dates that the dashboard is looking for
const weekDates = [
  "2026-05-18", // Monday
  "2026-05-19", // Tuesday
  "2026-05-20", // Wednesday
  "2026-05-21", // Thursday
  "2026-05-22", // Friday
];

console.log("Testing date matching:");
for (const menuDateStr of menuDates) {
  const menuDate = parseLocalDate(menuDateStr);
  const menuDateKey = toDateKey(menuDate);
  console.log(`Menu date: ${menuDateStr} -> parsed: ${menuDate.toISOString()} -> key: ${menuDateKey}`);
}

console.log("\nWeek dates to match:");
for (const weekDate of weekDates) {
  console.log(`Expected: ${weekDate}`);
}
