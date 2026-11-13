/**
 * Date and time helpers for AquaBerry events.
 *
 * Owners type event times in the CMS as Florida wall-clock time ("2026-12-05 17:00").
 * Those strings always mean America/New_York, wherever the owner is when she types them,
 * so a post written from Brazil still shows the right Florida time.
 *
 * Netlify builds run in UTC, so nothing here relies on the server's local time zone.
 */

export const TIME_ZONE = "America/New_York";
export const LOCALE = "en-US";

/** Minutes between UTC and the time zone at one instant (-300 in winter, -240 in summer for Florida). */
function zoneOffsetMinutes(utcMillis, timeZone = TIME_ZONE) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
      .formatToParts(new Date(utcMillis))
      .map((part) => [part.type, part.value]),
  );
  const wallAsUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
  return Math.round((wallAsUtc - utcMillis) / 60000);
}

/**
 * Turn a CMS value into a real instant (Date), or null when empty or unreadable.
 * Accepts "YYYY-MM-DD HH:mm", "YYYY-MM-DDTHH:mm", "YYYY-MM-DD" (midnight),
 * a full ISO string with Z or an offset (taken as-is), or a Date object.
 */
export function parseEventTime(value, timeZone = TIME_ZONE) {
  if (value === undefined || value === null || value === "") return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const text = String(value).trim();

  // An explicit Z or offset already names the instant.
  if (/(?:[zZ]|[+-]\d{2}:?\d{2})$/.test(text) && text.includes("T")) {
    const absolute = new Date(text);
    return Number.isNaN(absolute.getTime()) ? null : absolute;
  }

  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
  if (!match) return null;

  const [, year, month, day, hour = "0", minute = "0", second = "0"] = match;
  const wallAsUtc = Date.UTC(+year, +month - 1, +day, +hour, +minute, +second);

  // Guess with the offset at that moment, then correct once so daylight saving changes land right.
  const guess = wallAsUtc - zoneOffsetMinutes(wallAsUtc, timeZone) * 60000;
  return new Date(wallAsUtc - zoneOffsetMinutes(guess, timeZone) * 60000);
}

/** Format an instant for people in Florida. */
export function formatInZone(date, options, timeZone = TIME_ZONE) {
  if (!date) return "";
  return new Intl.DateTimeFormat(LOCALE, { timeZone, ...options }).format(date);
}

/** Calendar date in Florida as "YYYY-MM-DD" (used to compare days and to find the end of a day). */
export function ymdInZone(date, timeZone = TIME_ZONE) {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

/** ISO 8601 with the Florida offset, e.g. "2026-12-05T17:00:00-05:00", for <time datetime> and the browser check. */
export function isoInZone(date, timeZone = TIME_ZONE) {
  if (!date) return "";
  const offset = zoneOffsetMinutes(date.getTime(), timeZone);
  const shifted = new Date(date.getTime() + offset * 60000).toISOString().slice(0, 19);
  const sign = offset < 0 ? "-" : "+";
  const hours = String(Math.floor(Math.abs(offset) / 60)).padStart(2, "0");
  const minutes = String(Math.abs(offset) % 60).padStart(2, "0");
  return `${shifted}${sign}${hours}:${minutes}`;
}

/** iCalendar and Google Calendar UTC stamp, e.g. "20261205T220000Z". */
export function utcStamp(date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/** When an event stops being "upcoming": its end time, or the end of its start day in Florida. */
export function endsAt(start, end) {
  if (!start) return null;
  if (end && end > start) return end;
  return parseEventTime(`${ymdInZone(start)} 23:59`);
}

/** "5:00 PM to 8:00 PM" on one day, or both dates when the event runs past midnight. */
export function timeRange(start, end) {
  if (!start) return "";
  const time = (date) => formatInZone(date, { hour: "numeric", minute: "2-digit" });
  if (!end || end <= start) return time(start);
  if (ymdInZone(start) === ymdInZone(end)) return `${time(start)} to ${time(end)}`;
  const dayAndTime = (date) => formatInZone(date, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  return `${dayAndTime(start)} to ${dayAndTime(end)}`;
}
