// Build facts available to every template as `build`.
export default function () {
  const now = new Date();
  return {
    now,
    year: new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", year: "numeric" }).format(now),
    context: process.env.CONTEXT || "local", // Netlify sets production, deploy-preview or branch-deploy
  };
}
