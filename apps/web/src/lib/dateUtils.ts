/**
 * Formats a timestamp into a WhatsApp-style chat date divider string:
 * - "Today" (if message is from today)
 * - "Yesterday" (if message is from yesterday)
 * - Weekday name, e.g. "Monday" (if within the last 6 days)
 * - "Month Day", e.g. "September 14" (if in the current year)
 * - "Month Day, Year", e.g. "September 14, 2025" (if in an earlier year)
 */
export function formatChatDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const msPerDay = 1000 * 60 * 60 * 24;
  const diffDays = Math.round((today.getTime() - target.getTime()) / msPerDay);

  if (diffDays === 0) {
    return 'Today';
  }
  if (diffDays === 1) {
    return 'Yesterday';
  }
  if (diffDays > 1 && diffDays < 7) {
    return date.toLocaleDateString(undefined, { weekday: 'long' });
  }
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString(undefined, {
      month: 'long',
      day: 'numeric',
    });
  }
  return date.toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Compares two timestamp strings and returns true if they fall on different calendar days.
 */
export function isDifferentDay(dateStr1?: string, dateStr2?: string): boolean {
  if (!dateStr1 || !dateStr2) return true;
  const d1 = new Date(dateStr1);
  const d2 = new Date(dateStr2);
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return true;
  return (
    d1.getFullYear() !== d2.getFullYear() ||
    d1.getMonth() !== d2.getMonth() ||
    d1.getDate() !== d2.getDate()
  );
}
