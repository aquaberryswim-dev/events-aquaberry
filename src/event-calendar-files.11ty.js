// One "Add to calendar" file per event: /events/<event-id>/event.ics
// Events whose time is still to be announced become all-day entries on their date.
import { buildIcs } from "../lib/ics.js";

export const data = {
  pagination: { data: "collections.events", size: 1, alias: "event" },
  permalink: (data) => `/events/${data.event.data.eventSlug}/event.ics`,
  eleventyExcludeFromCollections: true,
};

export function render({ event, site }) {
  const { info } = event.data;
  const pageUrl = new URL(event.url, site.url).href;
  return buildIcs({
    uid: `${event.data.eventSlug}@${new URL(site.url).hostname}`,
    start: info.start,
    end: info.calendarEnd,
    allDay: info.allDay,
    title: `${event.data.title} (AquaBerry)`,
    location: info.place, // never includes a private address
    description: [info.calendarDetails, pageUrl].filter(Boolean).join("\n\n"),
    url: pageUrl,
    canceled: info.status === "canceled",
  });
}
