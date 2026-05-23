export function getDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function addWeeks(date: Date, weeks: number): Date {
  return addDays(date, weeks * 7);
}

export function getWeekDays(startDate: Date, count: number = 5): Date[] {
  return Array.from({ length: count }, (_, i) => addDays(startDate, i));
}

export function formatDateVN(date: Date): string {
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
}