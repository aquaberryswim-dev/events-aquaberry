// Directory data for src/legal/: the participation agreement (and any later legal pages).
// Layout and address live here, not in the page's front matter, so the admin can edit the page
// (title, version, summary, text) without ever touching them.
export default {
  layout: "layouts/agreement.njk",
  eleventyComputed: {
    permalink: (data) => `/${data.page.fileSlug}/`, // participation-agreement.md -> /participation-agreement/
    metaTitle: (data) => `${data.title} | AquaBerry Events`,
    metaDescription: (data) => data.summary || "",
  },
};
