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

// Simulate the getMenuByDate matching
const menus = [
  { date: "2026-05-17T17:00:00.000Z", name: "Thịt kho tàu" },
  { date: "2026-05-18T00:00:00.000Z", name: "Empty" },
  { date: "2026-05-18T17:00:00.000Z", name: "Chả lá lốt" },
  { date: "2026-05-19T17:00:00.000Z", name: "Cá kho tộ" },
  { date: "2026-05-20T17:00:00.000Z", name: "Gà nướng đất sét" },
];

const targetDates = ["2026-05-18", "2026-05-19", "2026-05-20", "2026-05-21", "2026-05-22"];

console.log("Menu matching analysis:");
for (const menu of menus) {
  const menuDateObj = new Date(menu.date);
  const menuDateKey = toDateKey(parseLocalDate(menu.date));
  const match = targetDates.find(d => d === menuDateKey);
  console.log(`Menu "${menu.name}" at ${menu.date}`);
  console.log(`  -> parsed date: ${menuDateObj.toISOString()}`);
  console.log(`  -> toDateKey(parseLocalDate(menu.date)): ${menuDateKey}`);
  console.log(`  -> matches target: ${match || 'none'}\n`);
}
