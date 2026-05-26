// Simulate the browser environment

// Menu dates from API (in UTC ISO format)
const menuDates = [
  "2026-05-17T17:00:00.000Z",
  "2026-05-18T00:00:00.000Z",
  "2026-05-18T17:00:00.000Z",
  "2026-05-19T17:00:00.000Z",
  "2026-05-20T17:00:00.000Z",
];

// The target dates the dashboard is looking for
const targetDates = ["2026-05-18", "2026-05-19", "2026-05-20", "2026-05-21", "2026-05-22"];

// Simulate getWeekDates (uses local time)
function getWeekDatesLocal() {
  const today = new Date();
  const monday = new Date(today);
  const day = monday.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  monday.setDate(monday.getDate() + diff);

  const dates = [];
  for (let i = 0; i < 5; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(d);
  }
  return dates;
}

// Simulate toDateKey from registrationWindow
function toDateKey(date) {
  const VIETNAM_OFFSET_MS = 7 * 60 * 60 * 1000;
  const vietnamDate = new Date(date.getTime() + VIETNAM_OFFSET_MS);
  const year = vietnamDate.getUTCFullYear();
  const month = String(vietnamDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(vietnamDate.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Current approach (buggy): parse date, then apply toDateKey
console.log("Current buggy approach:");
for (const menuDate of menuDates) {
  const splitPart = menuDate.split('T')[0];
  const parsed = new Date(splitPart + 'T00:00:00');
  const menuDateKey = toDateKey(parsed);
  const matches = targetDates.includes(menuDateKey);
  console.log(`${menuDate} -> split: ${splitPart} -> local Date: ${parsed.toISOString()} -> toDateKey: ${menuDateKey} -> matches: ${matches}`);
}

// Correct approach: convert UTC ISO string directly to Vietnam dateKey
console.log("\nCorrect approach (parsing UTC directly):");
for (const menuDate of menuDates) {
  const menuDateObj = new Date(menuDate);
  const menuDateKey = toDateKey(menuDateObj);
  const matches = targetDates.includes(menuDateKey);
  console.log(`${menuDate} -> Date: ${menuDateObj.toISOString()} -> toDateKey: ${menuDateKey} -> matches: ${matches}`);
}
