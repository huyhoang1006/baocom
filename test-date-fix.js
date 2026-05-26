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

// The problematic case
const menuDateStr = "2026-05-18T17:00:00.000Z";
const splitPart = menuDateStr.split('T')[0]; // "2026-05-18"
const parsed = parseLocalDate(splitPart);
console.log('Split result:', splitPart);
console.log('Parsed:', parsed.toISOString());
console.log('toDateKey(parsed):', toDateKey(parsed));

// What it should be (parse the full ISO string)
const fullParsed = parseLocalDate(menuDateStr);
console.log('\nFull parsed:', fullParsed.toISOString());
console.log('toDateKey(full):', toDateKey(fullParsed));

// But with our fix (not splitting), what happens?
const dateKeyFromFull = toDateKey(parseLocalDate(menuDateStr));
console.log('\nWith full ISO (proposed fix result):', dateKeyFromFull);
