/**
 * Image markup for event flyers and gallery photos.
 *
 * Two sources are supported:
 * 1. Cloudinary URLs (the recommended setup): sizes and formats come from Cloudinary's CDN,
 *    so photos never sit in the public GitHub repo and their traffic does not spend Netlify credits.
 * 2. Files in the repo under /assets/uploads/ (only for a private repo, or for the local samples):
 *    resized at build time with eleventy-img.
 */
import path from "node:path";
import Image, { generateHTML } from "@11ty/eleventy-img";
import { OUTPUT_DIR } from "./paths.js";

const WIDTHS = [400, 800, 1200, 1600];
const CLOUDINARY_UPLOAD = /^https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\//;

/** Escape a value for an HTML attribute. */
function attr(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function isCloudinary(src) {
  return CLOUDINARY_UPLOAD.test(String(src || ""));
}

/** Insert a Cloudinary transformation (e.g. "f_auto,q_auto,c_limit,w_800") right after /image/upload/. */
export function cloudinary(src, transformation) {
  return String(src).replace("/image/upload/", `/image/upload/${transformation}/`);
}

/** Map a CMS value like "/assets/uploads/photo.jpg" to the file in the repo. Rejects anything outside src/. */
function localPath(src) {
  const clean = String(src).split(/[?#]/)[0].replace(/^\/+/, "");
  const resolved = path.resolve("src", clean);
  if (!resolved.startsWith(path.resolve("src") + path.sep)) {
    throw new Error(`Image path escapes src/: ${src}`);
  }
  return resolved;
}

function localImage(src, widths = WIDTHS, formats = ["webp", "jpeg"]) {
  return Image(localPath(src), {
    widths,
    formats,
    outputDir: path.join(OUTPUT_DIR, "assets", "img"), // same folder as the pages (see lib/paths.js)
    urlPath: "/assets/img/",
    fixOrientation: true, // phone photos often rely on EXIF rotation
    sharpWebpOptions: { quality: 78 },
    sharpJpegOptions: { quality: 80, mozjpeg: true },
  });
}

/**
 * Responsive <img> (Cloudinary) or <picture> (repo file).
 * Layout boxes are set in CSS with aspect-ratio, so pages do not jump while images load.
 */
export async function imageHtml(src, alt, { sizes = "100vw", className = "", eager = false } = {}) {
  if (!src) return "";
  const loading = eager ? "eager" : "lazy";

  if (isCloudinary(src)) {
    const srcset = WIDTHS.map((width) => `${cloudinary(src, `f_auto,q_auto,c_limit,w_${width}`)} ${width}w`).join(", ");
    return `<img src="${attr(cloudinary(src, "f_auto,q_auto,c_limit,w_800"))}" srcset="${attr(srcset)}" sizes="${attr(sizes)}" alt="${attr(alt)}" loading="${loading}" decoding="async"${eager ? ' fetchpriority="high"' : ""}${className ? ` class="${attr(className)}"` : ""}>`;
  }

  const metadata = await localImage(src);
  const attributes = { alt: alt ?? "", sizes, loading, decoding: "async" };
  if (className) attributes.class = className;
  if (eager) attributes.fetchpriority = "high";
  return generateHTML(metadata, attributes);
}

/** URL of the biggest rendition, opened by the gallery viewer. */
export async function largeImageUrl(src) {
  if (!src) return "";
  if (isCloudinary(src)) return cloudinary(src, "f_auto,q_auto,c_limit,w_1600");
  const metadata = await localImage(src);
  const renditions = metadata.webp || metadata.jpeg;
  return renditions[renditions.length - 1].url;
}

/** Absolute URL of a 1200 x 630 link-preview image (og:image), padded on Cream so flyers are not cropped. */
export async function socialImageUrl(src, siteUrl, fallbackPath) {
  if (!src) return new URL(fallbackPath, siteUrl).href;
  if (isCloudinary(src)) return cloudinary(src, "c_pad,b_rgb:FCF7EC,w_1200,h_630,f_jpg,q_auto");
  const metadata = await localImage(src, [1200], ["jpeg"]);
  return new URL(metadata.jpeg[0].url, siteUrl).href;
}
