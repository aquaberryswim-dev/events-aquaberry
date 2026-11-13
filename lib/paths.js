/**
 * Where Eleventy writes the site.
 *
 * `npm run build` writes the deployable site to _site/ (the folder you drag into Netlify, or that the CLI uploads).
 * Local previews (`npm start`, `npm run admin`, `npm run preview:samples`) write to .preview/ instead,
 * so a preview with sample events or half-finished edits can never end up in a deploy by accident.
 * scripts/site.js sets AQUABERRY_OUTPUT for each command; Netlify Git builds use the default.
 */
export const OUTPUT_DIR = process.env.AQUABERRY_OUTPUT || "_site";
