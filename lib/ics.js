/**
 * Builds the "Add to calendar" file (.ics, RFC 5545) for one event.
 * Timed events are written in UTC, which Apple Calendar, Google Calendar and Outlook convert to the viewer's zone.
 * Events whose time is still to be announced become all-day entries on their date.
 */
import { utcStamp } from "./dates.js";

/** Escape text values: backslash, semicolon, comma and line breaks. */
function escapeText(value) {
  return String(value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/** Fold lines longer than 75 bytes; continuation lines start with one space. Never splits a character. */
function fold(line) {
  if (Buffer.byteLength(line, "utf8") <= 75) return line;
  const lines = [];
  let current = "";
  let limit = 75;
  for (const character of line) {
    if (Buffer.byteLength(current + character, "utf8") > limit) {
      lines.push(current);
      current = "";
      limit = 74; // the leading space of a continuation line counts toward 75
    }
    current += character;
  }
  lines.push(current);
  return lines.join("\r\n ");
}

/**
 * @param {object} event
 * @param {string} event.uid        stable id, e.g. "2026-12-05-girls-lower-body-workout@events.aquaberry.store"
 * @param {Date}   event.start
 * @param {Date}   event.end        real end, or start + 2 hours when the owner left the end empty
 * @param {{start: string, endExclusive: string}|null} [event.allDay]  "YYYY-MM-DD" dates when the time is TBA
 * @param {string} event.title
 * @param {string} [event.location]
 * @param {string} [event.description]
 * @param {string} [event.url]
 * @param {boolean} [event.canceled]
 * @param {Date}   [event.stamp]    when this file was generated
 */
export function buildIcs({ uid, start, end, allDay = null, title, location, description, url, canceled = false, stamp = new Date() }) {
  const when = allDay
    ? [`DTSTART;VALUE=DATE:${allDay.start.replace(/-/g, "")}`, `DTEND;VALUE=DATE:${allDay.endExclusive.replace(/-/g, "")}`]
    : [`DTSTART:${utcStamp(start)}`, `DTEND:${utcStamp(end)}`];

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//AquaBerry//Events//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${utcStamp(stamp)}`,
    ...when,
    `SUMMARY:${escapeText(title)}`,
    location ? `LOCATION:${escapeText(location)}` : null,
    description ? `DESCRIPTION:${escapeText(description)}` : null,
    url ? `URL:${url}` : null,
    `STATUS:${canceled ? "CANCELLED" : "CONFIRMED"}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);

  return lines.map(fold).join("\r\n") + "\r\n";
}
