/**
 * ISO week utilities — consistent week ID generation across the app.
 * Week IDs follow ISO 8601: "2026-W10" format.
 */

/** Get ISO week ID for a given date */
export function getWeekId(date: Date = new Date()): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  // Set to nearest Thursday: current date + 4 - current day number (Monday=1, Sunday=7)
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

/** Get the Monday and Sunday dates for a given week ID */
export function getWeekDateRange(weekId: string): { start: Date; end: Date } {
  const [yearStr, weekStr] = weekId.split('-W');
  const year = parseInt(yearStr, 10);
  const week = parseInt(weekStr, 10);

  // January 4th is always in week 1 (ISO 8601)
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const dayOfWeek = jan4.getUTCDay() || 7; // Monday = 1

  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - dayOfWeek + 1 + (week - 1) * 7);

  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);

  return { start: monday, end: sunday };
}

/** Format a week ID for display: "Mar 4 – Mar 10, 2026" */
export function formatWeekRange(weekId: string): string {
  const { start, end } = getWeekDateRange(weekId);
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const startMonth = monthNames[start.getUTCMonth()];
  const endMonth = monthNames[end.getUTCMonth()];
  const startDay = start.getUTCDate();
  const endDay = end.getUTCDate();
  const year = end.getUTCFullYear();

  if (startMonth === endMonth) {
    return `${startMonth} ${startDay} – ${endDay}, ${year}`;
  }
  return `${startMonth} ${startDay} – ${endMonth} ${endDay}, ${year}`;
}

/** Get the previous week's ID */
export function getPreviousWeekId(weekId: string): string {
  const { start } = getWeekDateRange(weekId);
  start.setUTCDate(start.getUTCDate() - 7);
  return getWeekId(start);
}

/** Get the next week's ID */
export function getNextWeekId(weekId: string): string {
  const { start } = getWeekDateRange(weekId);
  start.setUTCDate(start.getUTCDate() + 7);
  return getWeekId(start);
}
