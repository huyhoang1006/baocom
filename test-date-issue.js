// Simulate what happens when we get menus from API and try to match them

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

// When we get menu.date from API (it's in UTC ISO format)
const menuDateFromAPI = "2026-05-18T17:00:00.000Z";

// The code does: menu.date.split('T')[0] => "2026-05-18"
// Then parseLocalDate("2026-05-18")
const afterSplit = menuDateFromAPI.split('T')[0];
const parsed = parseLocalDate(afterSplit);
console.log('After split:', afterSplit);
console.log('Parsed date:', parsed.toISOString());
console.log('toDateKey(parsed):', toDateKey(parsed));

// But what should it be for 2026-05-18T17:00:00.000Z in Vietnam time?
// 2026-05-18T17:00:00.000Z = 2026-05-19 00:00:00 Vietnam time
const actualVietnamDate = new Date(Date.parse(menuDateFromAPI) + VIETNAM_OFFSET_MS);
console.log('\nActual Vietnam date from ISO string:', actualVietnamDate.toISOString());
console.log('Actual toDateKey:', toDateKey(actualVietnamDate));

// So the problem is the code doesn't parse the ISO string directly
// It splits and parses, losing the time information
// When menu is at 17:00 UTC, it should be next day in Vietnam

console.log('\n--- The issue ---');
console.log('menu.date from API:', menuDateFromAPI);
console.log('Expected Vietnam date: 2026-05-19');
console.log('Code computes:', toDateKey(parsed));
console.log('But it should be:', toDateKey(actualVietnamDate));
