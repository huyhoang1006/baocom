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

// Menu dates from API
const menuDates = [
  "2026-05-17T17:00:00.000Z",
  "2026-05-18T00:00:00.000Z", 
  "2026-05-18T17:00:00.000Z",
  "2026-05-19T17:00:00.000Z",
  "2026-05-20T17:00:00.000Z"
];

// Target week dates
const weekDates = ["2026-05-18", "2026-05-19", "2026-05-20", "2026-05-21", "2026-05-22"];

console.log("Testing current buggy approach:");
for (const menuDate of menuDates) {
  const datePart = menuDate.split('T')[0];
  const parsed = parseLocalDate(datePart);
  const menuDateKey = toDateKey(parsed);
  const matched = weekDates.find(d => d === menuDateKey);
  console.log(`${menuDate} -> datePart=${datePart} -> parsed=${parsed.toISOString()} -> dateKey=${menuDateKey} -> matched=${matched || 'none'}`);
}

console.log("\nWeek dates to find:", weekDates);
