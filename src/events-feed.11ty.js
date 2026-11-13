// Machine-readable list of events at /events.json.
// Lets the store (aquaberry.store) show "next event" later without redeploying the store for every event.
// Public: never add street addresses, sign-ups or anything else private here.
export const data = {
  permalink: "/events.json",
  eleventyExcludeFromCollections: true,
};

export function render({ collections, site }) {
  const events = collections.events.map((event) => ({
    title: event.data.title,
    url: new URL(event.url, site.url).href,
    start: event.data.info.startIso,
    ends: event.data.info.endsIso,
    time_tba: event.data.info.timeTba,
    status: event.data.info.status,
    registration: event.data.info.registration,
    place: event.data.info.placeShort,
    summary: event.data.summary || "",
    upcoming_at_build: event.data.info.upcoming,
  }));
  return JSON.stringify({ generated: new Date().toISOString(), events }, null, 2);
}
