/**
 * Directory data shared by src/events/ (real events) and src/samples/ (local-only samples).
 * Everything a template needs about an event is computed once here, as `info`.
 */
import path from "node:path";
import { parseEventTime, endsAt, formatInZone, isoInZone, timeRange, utcStamp, ymdInZone } from "./dates.js";

const BUILD_TIME = new Date();
const TWO_HOURS = 2 * 60 * 60 * 1000;

const STATUS_LABELS = { scheduled: "", postponed: "Postponed", canceled: "Canceled" };
// "none": no form. "open": sign-up form. "waitlist": same form, worded as a waitlist. "closed": no form, a note.
const REGISTRATION_STATES = ["none", "open", "waitlist", "closed"];
const HTTPS_LINK = /^https:\/\/\S+$/;

/** "2026-12-05" -> "20261205" (all-day calendar dates). */
const compactDate = (ymd) => ymd.replace(/-/g, "");

/** The day after a "YYYY-MM-DD" date, for all-day calendar entries (their end date is exclusive). */
function nextDay(ymd) {
  const [year, month, day] = ymd.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + 1)).toISOString().slice(0, 10);
}

const clean = (value) => String(value ?? "").trim();

export function describeEvent(data, slug = "") {
  const start = parseEventTime(data.start);
  const timeTba = data.time_tba === true;
  // With the time to be announced, the end time is ignored and the event counts as the whole Florida day.
  const end = timeTba ? null : parseEventTime(data.end);
  const ends = endsAt(start, end);
  const status = STATUS_LABELS[data.status] !== undefined ? data.status : "scheduled";
  const upcoming = Boolean(ends && ends > BUILD_TIME);
  const startDay = start ? ymdInZone(start) : "";

  // A private address (someone's home) never reaches the page, the calendar file or the map link.
  // It should not be typed into the CMS at all; it goes out in the confirmation email.
  const addressPrivate = data.address_private === true;
  const placeLines = [data.venue, addressPrivate ? "" : data.address, data.city].map(clean).filter(Boolean);
  const place = placeLines.join(", ");

  const registration = REGISTRATION_STATES.includes(data.registration) ? data.registration : "none";
  const hasSignup = (registration === "open" || registration === "waitlist") && status !== "canceled";
  const spots = Number.isInteger(data.spots) && data.spots > 0 ? data.spots : null;

  const calendarEnd = end && start && end > start ? end : start ? new Date(start.getTime() + TWO_HOURS) : null;
  const allDay = timeTba && startDay ? { start: startDay, endExclusive: nextDay(startDay) } : null;
  const calendarDetails = [clean(data.summary), timeTba ? "Time to be announced. Check the event page for updates." : ""]
    .filter(Boolean)
    .join("\n\n");

  return {
    start,
    end,
    calendarEnd,
    timeTba,
    allDay,
    calendarDetails,
    startIso: isoInZone(start),
    // For <time datetime>: just the date while the time is still to be announced.
    timeAttr: timeTba ? startDay : isoInZone(start),
    endsIso: isoInZone(ends),
    upcoming,
    status,
    statusLabel: STATUS_LABELS[status],
    tile: {
      month: formatInZone(start, { month: "short" }).toUpperCase(),
      day: formatInZone(start, { day: "numeric" }),
      weekday: formatInZone(start, { weekday: "short" }).toUpperCase(),
    },
    dateShort: formatInZone(start, { weekday: "short", month: "short", day: "numeric", year: "numeric" }),
    dateLong: formatInZone(start, { weekday: "long", month: "long", day: "numeric", year: "numeric" }),
    timeShort: timeTba ? "Time TBA" : formatInZone(start, { hour: "numeric", minute: "2-digit" }),
    timeRange: timeTba ? "Time to be announced" : timeRange(start, end),
    place,
    placeLines,
    placeShort: [data.venue, data.city].map(clean).filter(Boolean).join(", "),
    addressPrivate,
    mapUrl: place && !addressPrivate ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place)}` : "",
    photoCount: Array.isArray(data.gallery) ? data.gallery.filter((photo) => photo && photo.image).length : 0,
    registration,
    hasSignup,
    spots,
    waiverUrl: HTTPS_LINK.test(clean(data.waiver_url)) ? clean(data.waiver_url) : "",
    // One Netlify form per event, so each event's sign-ups get their own list (and CSV) in Netlify > Forms.
    formName: `rsvp-${slug}`.slice(0, 80),
    googleCalendarUrl: start
      ? "https://calendar.google.com/calendar/render?" +
        new URLSearchParams({
          action: "TEMPLATE",
          text: clean(data.title),
          dates: allDay
            ? `${compactDate(allDay.start)}/${compactDate(allDay.endExclusive)}`
            : `${utcStamp(start)}/${utcStamp(calendarEnd)}`,
          details: calendarDetails,
          location: place,
        }).toString()
      : "",
  };
}

export default {
  layout: "layouts/event.njk",
  eleventyComputed: {
    // The file name (without .md) is the event's id: "2026-12-05-girls-lower-body-workout".
    eventSlug: (data) => path.basename(data.page.inputPath, ".md"),
    permalink: (data) => `/events/${path.basename(data.page.inputPath, ".md")}/`,
    info: (data) => describeEvent(data, path.basename(data.page.inputPath, ".md")),
    metaTitle: (data) => `${data.title} | AquaBerry Events`,
    metaDescription: (data) => data.summary || "",
    ogType: () => "article",
  },
};
