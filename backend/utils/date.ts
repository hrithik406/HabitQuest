export function getDateIsoInTimeZone(
  timeZone?: string,
  date: Date = new Date()
): string {
  try {
    // 1. If timeZone is undefined or empty, dynamically detect the user's local timezone
    // (e.g., "Asia/Kolkata", "America/New_York", etc.)
    const resolvedTimeZone =
      timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone;

    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: resolvedTimeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

    const parts = formatter.formatToParts(date);
    const values = Object.fromEntries(
      parts.map((part) => [part.type, part.value])
    );

    return `${values.year}-${values.month}-${values.day}`;
  } catch {
    // 2. Fallback to the user's local system clock (NOT .toISOString() which forces UTC)
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }
}