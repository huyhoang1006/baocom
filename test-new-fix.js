const VIETNAM_OFFSET_MS = 7 * 60 * 60 * 1000;

function toDateKey(date) {
  const vietnamDate = new Date(date.getTime() + VIETNAM_OFFSET_MS)
  const year = vietnamDate.getUTCFullYear()
  const month = String(vietnamDate.getUTCMonth() + 1).padStart(2, '0')
  const day = String(vietnamDate.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const menuDates = [
  "2026-05-17T17:00:00.000Z",
  "2026-05-18T00:00:00.000Z",
  "2026-05-18T17:00:00.000Z",
  "2026-05-19T17:00:00.000Z",
  "2026-05-20T17:00:00.000Z",
];

const targetDates = ["2026-05-18", "2026-05-19", "2026-05-20", "2026-05-21", "2026-05-22"];

console.log("Testing new approach:");
for (const menuDate of menuDates) {
  const datePart = menuDate.split('T')[0] + 'T00:00:00';
  const dateObj = new Date(datePart); // Creates Date in LOCAL timezone
  const dateKey = toDateKey(dateObj);
  const match = targetDates.find(d => d === dateKey);
  console.log(`Menu date: ${menuDate}`);
  console.log(`  -> split+concat: ${datePart}`);
  console.log(`  -> new Date result: ${dateObj.toISOString()}`);
  console.log(`  -> toDateKey: ${dateKey}`);
  console.log(`  -> matches: ${match || 'none'}\n`);
}
