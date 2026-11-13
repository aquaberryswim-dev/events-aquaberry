/**
 * Eleventy configuration for events.aquaberry.store.
 * Build: `npm run build` (fresh output in _site/). Local previews write to .preview/ (see scripts/site.js).
 */
import yaml from "js-yaml";
import { parseEventTime } from "./lib/dates.js";
import { imageHtml, largeImageUrl, socialImageUrl } from "./lib/images.js";
import { OUTPUT_DIR } from "./lib/paths.js";

// Sample events (src/samples/) only appear in `npm run preview:samples`, never in a build or a Netlify production build.
const INCLUDE_SAMPLES = process.env.SAMPLES === "1" && process.env.CONTEXT !== "production";
const EVENT_GLOBS = INCLUDE_SAMPLES ? ["src/events/*.md", "src/samples/*.md"] : ["src/events/*.md"];

// Registration values that need a thank-you page ("closed" too, for anyone who submits an old copy of the page).
const SIGNUP_STATES = ["open", "waitlist", "closed"];

// The participation agreement that sign-up forms link to when an event requires it (edited under Page text).
const AGREEMENT_GLOB = "src/legal/participation-agreement.md";
const AGREEMENT_VERSION = /^\d{4}-\d{2}-\d{2}$/;

/** Escape text for HTML text or attribute values. */
function escapeHtml(text) {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Escape, then turn *word* into <em>word</em> (used for the pink word in the headline). */
function emphasize(text) {
  return escapeHtml(text).replace(/\*([^*]+)\*/g, "<em>$1</em>");
}

export default function (eleventyConfig) {
  // Keep YAML dates as plain text: event times are Florida wall-clock times, parsed in lib/dates.js.
  eleventyConfig.setFrontMatterParsingOptions({
    engines: { yaml: (input) => yaml.load(input, { schema: yaml.CORE_SCHEMA }) },
  });

  // Markdown typed in the CMS: no raw HTML (safer), links become clickable, no automatic dashes or curly quotes.
  eleventyConfig.amendLibrary("md", (markdown) => markdown.set({ html: false, linkify: true, typographer: false }));

  // Escape every {{ value }} by default; only trusted HTML is printed with | safe.
  eleventyConfig.setNunjucksEnvironmentOptions({ autoescape: true });

  if (!INCLUDE_SAMPLES) eleventyConfig.ignores.add("src/samples/**");

  // Files copied as they are.
  eleventyConfig.addPassthroughCopy({
    "src/admin": "admin",
    "src/assets/css": "assets/css",
    "src/assets/js": "assets/js",
    "src/assets/fonts": "assets/fonts",
    "src/assets/brand": "assets/brand",
    "src/static": "/",
  });

  // All events, soonest first. Events without a start date are skipped instead of breaking the build.
  eleventyConfig.addCollection("events", (collectionApi) =>
    collectionApi
      .getFilteredByGlob(EVENT_GLOBS)
      .filter((event) => parseEventTime(event.data.start))
      .sort((a, b) => parseEventTime(a.data.start) - parseEventTime(b.data.start)),
  );

  // Events with a sign-up form: each gets a thank-you page at /events/<event-id>/thanks/ (src/event-thanks.njk).
  eleventyConfig.addCollection("signupEvents", (collectionApi) =>
    collectionApi
      .getFilteredByGlob(EVENT_GLOBS)
      .filter((event) => parseEventTime(event.data.start) && SIGNUP_STATES.includes(event.data.registration)),
  );

  // The participation agreement, as a one-item collection: templates read its title, version, summary and url.
  // A required legal checkbox must never disappear quietly, so the build stops if an event requires the
  // agreement and the agreement is missing or has no valid version date.
  eleventyConfig.addCollection("agreement", (collectionApi) => {
    const agreement = collectionApi.getFilteredByGlob(AGREEMENT_GLOB);
    const needed = collectionApi.getFilteredByGlob(EVENT_GLOBS).filter((event) => event.data.agreement_required === true);
    if (needed.length) {
      const names = needed.map((event) => event.inputPath).join(", ");
      if (!agreement.length) {
        throw new Error(`${names} requires the participation agreement, but ${AGREEMENT_GLOB} is missing.`);
      }
      if (!AGREEMENT_VERSION.test(String(agreement[0].data.version ?? ""))) {
        throw new Error(`${AGREEMENT_GLOB} needs a version date like 2026-11-13 (required by ${names}).`);
      }
    }
    return agreement;
  });

  // Filters
  eleventyConfig.addFilter("newestFirst", (events) => [...(events || [])].reverse());
  eleventyConfig.addFilter("upcomingOnly", (events) => (events || []).filter((event) => event.data.info?.upcoming));
  eleventyConfig.addFilter("pastOnly", (events) => (events || []).filter((event) => !event.data.info?.upcoming));
  eleventyConfig.addFilter("emphasize", (text) => emphasize(text));
  eleventyConfig.addFilter("absoluteUrl", (urlPath, base) => new URL(urlPath, base).href);
  eleventyConfig.addFilter("plural", (count, one, many) => `${count} ${count === 1 ? one : many}`);
  // "2026-11-13" -> "November 13, 2026" (a plain date, no time zone shift).
  eleventyConfig.addFilter("longDate", (value) => {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value ?? "").trim());
    if (!match) return String(value ?? "");
    return new Date(Date.UTC(+match[1], +match[2] - 1, +match[3])).toLocaleDateString("en-US", {
      timeZone: "UTC",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  });

  // Images (async: local files are resized at build time; Cloudinary URLs are only rewritten).
  eleventyConfig.addAsyncShortcode("eventImage", (src, alt, sizes, eager) =>
    imageHtml(src, alt, { sizes: sizes || "100vw", eager: Boolean(eager) }),
  );
  eleventyConfig.addAsyncShortcode("galleryItem", async (src, alt, eventTitle, number, total) => {
    const description = String(alt || "").trim();
    const fallback = `${eventTitle}, photo ${number} of ${total}`;
    const thumb = await imageHtml(src, description || fallback, {
      sizes: "(min-width: 1000px) 240px, (min-width: 640px) 30vw, 46vw",
    });
    const large = await largeImageUrl(src);
    const caption = description ? ` data-caption="${escapeHtml(description)}"` : "";
    return `<a class="gallery-link" href="${escapeHtml(large)}"${caption}>${thumb}</a>`;
  });
  eleventyConfig.addAsyncShortcode("socialImage", (src, siteUrl) =>
    socialImageUrl(src, siteUrl, "/assets/brand/aquaberry-social-share.png"),
  );
}

export const config = {
  dir: { input: "src", output: OUTPUT_DIR, includes: "_includes", data: "_data" },
  templateFormats: ["njk", "md", "11ty.js"],
  markdownTemplateEngine: false, // CMS text is plain Markdown, never template code
  htmlTemplateEngine: "njk",
};
