# AquaBerry Events (events.aquaberry.store)

Event announcements, sign-up forms and photo galleries for AquaBerry.
Hosted as its own project in the AquaBerry Netlify team (Free plan), separate from the store.

| Piece | What it does |
| --- | --- |
| [Eleventy 3](https://www.11ty.dev/) | Builds plain HTML pages from the event files in `src/events/` |
| [Decap CMS 3](https://decapcms.org/) | The admin at `/admin/`: a form for each event, with a live preview |
| Netlify Forms | The sign-up form on each event page. Sign-ups arrive by email and in Netlify > Forms |
| Cloudinary (Free) | Stores and resizes event photos uploaded through the admin |
| Netlify (Free) | Hosts the site |

## How events get onto the site

Since Nov 13, 2026 the project is connected to the GitHub repo `aquaberryswim-dev/events-aquaberry`. It must be
**public** (see step 2 of "Online admin setup"). The repo is the source of
truth, and every change reaches the site through Git:

1. **Online admin** (`events.aquaberry.store/admin/`), for Yasmin, Aryane and Pedro: **Save** keeps a private draft
   with a free Deploy Preview. Setting Status to **Ready** and clicking **Publish** merges it into `main`, which is
   one production deploy (15 credits).
2. **Code changes** (Pedro): work in a local clone on a branch, push it and open a pull request. Netlify builds a
   free Deploy Preview; merging into `main` is the production deploy. `npm run admin` still works locally: Publish
   saves the file in your clone, then commit it like any other change.

Do not use `npm run deploy` or drag-and-drop any more. The next Git deploy replaces a manual one, and the repo and
your folder drift apart. The scripts stay for an emergency only.

## Credits on the Netlify Free plan (read this first)

The Free plan gives the AquaBerry team **300 credits a month, shared with the store**. When they run out,
every project in the team pauses, the store included, until the next billing cycle (the 14th).

- A **production deploy costs 15 credits**, whichever way it is made (Git, CLI or drag-and-drop).
- Deploy Previews (admin drafts and pull requests) and failed builds cost nothing.
- Batch changes: one Publish with the new time and the sponsors costs less than two.
- Commits that change nothing the site uses (like this README) are skipped by the `ignore` rule in `netlify.toml`.
- Form submissions are free on the credit-based plans. Photos load from Cloudinary, so gallery traffic does not use
  Netlify bandwidth credits.

## Sign-up forms (Netlify Forms)

In the admin, set **Sign-up form** to **Open** and the event page gets a form: name, email, optional phone and
Instagram, a photo choice and an email-list choice. Each event has its own form (`rsvp-<event-id>`), so each event
gets its own list and CSV. The form does **not** count people or close itself.

### One-time setup (before the first deploy that has a form)

1. Netlify > events project > **Forms** > **Enable form detection**. Netlify only registers forms it finds while
   deploying, so turn this on first, then deploy. If it was off during a deploy, deploy again.
2. After the deploy, **Forms** should list `rsvp-2026-12-05-girls-lower-body-workout`.
3. **Forms > Submission notifications > Add notification > Email notification**: enter the inbox the owners
   reply from and choose **Any form**, so every future event's form is covered without doing this again.
   Add one notification per address if both owners want the emails.
   - An address outside the Netlify team shows **pending confirmation** until its owner clicks **Confirm** in
     Netlify's email; nothing is sent to it before that.
   - If Netlify says the address must belong to a team member, use the email of the AquaBerry Netlify login.
   - Emails come from `formresponses@netlify.com`. Replying goes straight to the person who signed up, because the
     form field is named `email`. Only verified sign-ups are emailed, never ones Netlify marks as spam.
4. Test once on the live site with your own email: you should land on the thank-you page, see the sign-up in
   Forms, and get the notification. Then delete the test sign-up.

### Day to day

1. Each sign-up arrives by email. Reply to confirm the spot, with the exact address and time.
2. Keep count. When the event is full: Sign-up form > **Waitlist**, Publish, deploy. The form stays, worded as a
   waitlist, and those sign-ups are marked `waitlist` in the CSV.
3. Now and then, open the form's **Spam submissions**. Real people occasionally land there.
4. After the event: download the CSV (it is the list for the discount codes), then delete the submissions in
   Netlify. Netlify recommends not keeping personal data longer than needed.

Private addresses: for a home, leave **Street address** empty and turn on **Private address**. The page then says
the address is sent by email, and no address appears on the page, in the calendar file or in `events.json`.
Never type a home address in the admin: every event file is public in the GitHub repo.

### Participation agreement

Turn on **Require the participation agreement** on an event, and its form gets a required box:
"I have read and agree to the Participation Agreement and Release", with the agreement's short summary above it.
Each sign-up then stores `agreement: agreed` and `agreement_version` (the agreement's version date) in Netlify and
the CSV, so you can see which version every person accepted.

- The agreement is one page for all events: `events.aquaberry.store/participation-agreement/`, edited in the admin
  under **Page text > Participation agreement** (`src/legal/participation-agreement.md`).
- Whenever its text changes, change its **Version date** too, then Publish.
- The build stops with a clear error if an event requires the agreement and the page is missing or has no valid
  version date, so the required box can never disappear without anyone noticing. The live site keeps the last
  good deploy, and failed builds cost no credits.
- The text that ships with this site is a plain-English draft, not legal advice. Have a Florida attorney review
  it before relying on it. People who signed up before the box existed have not agreed to it.

## Run it on your computer

Requires Node 22 or newer. Run `npm install` once in this folder.

| Command | What it does |
| --- | --- |
| `npm run admin` | Admin at http://localhost:8080/admin/ plus the preview. Publish saves files in this folder |
| `npm start` | Preview only, at http://localhost:8080 |
| `npm run preview:samples` | Preview with the sample events in `src/samples/` (never built into `_site`) |
| `npm run build` | Fresh deployable site in `_site/` (no samples, old files removed); Netlify runs this on every Git deploy |
| `npm run deploy:draft` | Emergency only: build, then a Netlify draft deploy from this folder |
| `npm run deploy` | Emergency only: build, then a production deploy from this folder (15 credits) |

Previews write to `.preview/`, never to `_site/`, so a preview can never be deployed by accident.
The admin's local server (`decap-server`, pinned in `scripts/site.js`) is downloaded on first use. It only listens
on your own computer and has no password, so do not change its host setting. `npm audit` would flag two of its
dependencies (joi, zod); they are only reachable from your computer while the admin is running, which is why it is
not a dependency of the site itself.

Google Drive: do not run `npm install` inside a Drive-synced folder (`node_modules` holds thousands of files that
Drive will try to sync). Keep the working copy outside Drive and back up the folder without `node_modules`, `_site`
and `.preview`.

## Folder map

```
src/events/            One Markdown file per event (the admin creates these; do not rename them by hand)
src/_data/home.json    Home page intro text (editable in the admin under "Page text")
src/_data/site.json    Site URL, store and Instagram links
src/admin/             The admin: index.html, config.yml (fields and hints), preview.js (branded preview)
src/_includes/         Page layouts, the event card and the sign-up form
src/event-thanks.njk   The thank-you page after a sign-up (/events/<event-id>/thanks/, not indexed)
src/legal/             The participation agreement page (text edited in the admin; layout and address in legal.11tydata.js)
src/static/_headers    Security and cache headers (works for every deploy method)
src/assets/            CSS, JavaScript, font (Hanken Grotesk, OFL) and logo files from the Brand Kit
src/samples/           Sample events for local previews only
lib/                   Date (Florida time), image, calendar-file and event helpers
scripts/site.js        The build, preview and admin commands (same on Windows, macOS and Linux)
netlify.toml           Build settings for Git deploys
```

## Cloudinary (photo uploads in the admin)

1. Cloudinary Console > **Settings** (gear icon) > **API Keys**: copy the **cloud name** and the **API Key**.
   Never copy the **API Secret** anywhere: it stays in Cloudinary.
2. In `src/admin/config.yml`, replace `REPLACE_WITH_CLOUDINARY_CLOUD_NAME` and `REPLACE_WITH_CLOUDINARY_API_KEY`.
   Both values are public by design and will be visible in the public repo; that is expected.
3. Console Settings > **User Management** > **Invite**: add Yasmin and Aryane with the **Media Library Admin** role
   (full Media Library access, no API keys or billing). Every Media Library user needs a seat; Account Settings
   shows how many the plan includes.
4. Commit and push (one production deploy). In the admin, **Choose an image** opens Cloudinary; each person signs in
   with her own Cloudinary login the first time.

## Online admin setup (reference)

The online admin (`events.aquaberry.store/admin/`) saves events by committing to the Git repository. Steps 1 to 4
were done on Nov 13, 2026; the rest are here for reference.

1. **Check the event files first.** Everything in this folder becomes public: no home addresses, phone numbers
   or other private details in `src/events/`.
2. **GitHub (AquaBerry account `aquaberryswim-dev`, 2FA on):** a **public** repository, `events-aquaberry`, with this
   folder. Public matters: on the Netlify Free plan, only public repos allow deploys from commits by people other
   than the one team member (Netlify pricing: "free & unlimited Git Contributors on public repos").
3. **Netlify:** link the existing events project to the repo (Project configuration > Build & deploy, under
   Continuous deployment). Build settings come from `netlify.toml`. From then on the repo is the source of truth:
   stop deploying from the local folder, or the two will drift apart.
4. **Netlify Identity:** Project configuration > Identity > Enable. Registration: **Invite only**.
   Services > Git Gateway > **Enable** (authorize as the AquaBerry GitHub account).
5. **Invite the owners:** Identity > Invite users. The email comes from `no-reply@netlify.com`, so check spam.
   The link lands on the home page and is forwarded to `/admin/` automatically.
6. Online, the admin uses drafts: **Save** keeps a private draft with a free Deploy Preview; setting Status to
   **Ready** and clicking **Publish** merges it, which is one production deploy (15 credits). Commits that change
   nothing the site uses (like this README) are skipped by the `ignore` rule in `netlify.toml`.

## Domain

Domain management > Add a domain > `events.aquaberry.store`. If aquaberry.store uses Netlify DNS, the record is
added for you. Otherwise add a **CNAME** record at the DNS host: `events` pointing to `<project-name>.netlify.app`.
Netlify issues the HTTPS certificate on its own.

## Removing a photo for good

1. In the admin, open the event, remove the photo from the gallery, Publish, deploy.
2. In Cloudinary, delete the image from the Media Library (this removes it from Cloudinary's CDN).
3. The site files only ever stored the photo's link, never the photo itself.

## Updating Decap CMS

`src/admin/index.html` loads an exact version with a Subresource Integrity hash. To upgrade, pick a version that has
been out for at least two weeks, change the version in the URL, and replace the hash with the output of:

```sh
curl -sL https://cdn.jsdelivr.net/npm/decap-cms@VERSION/dist/decap-cms.js | openssl dgst -sha384 -binary | openssl base64 -A
```

Test it with `npm run admin` first, then deploy.

## Brand and accessibility notes

- Logo, colors and font follow the AquaBerry Brand Kit v1.0. The wordmark is always a logo file, never typed text.
- Buttons use **Berry Deep #D81075** so white labels meet WCAG AA (4.94:1). This is the Brand Kit's recommended
  tune-up and still needs the owners' approval. To match the store's current Raspberry exactly, change `--button`
  in `src/assets/css/site.css` to `var(--ab-raspberry)`.
- Body text is Ink on Cream (13.57:1). Pink text is used only at large sizes.
- Form fields use 17px text (phones do not zoom in), 48px tall inputs and 44px tap areas for the checkboxes.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| Sign-ups do not appear in Netlify > Forms | Form detection was off during the deploy. Turn it on (Forms) and deploy again |
| No notification email | Check the recipient confirmed Netlify's email, the spam folder, and the form's Spam submissions |
| A page from a deleted event is still live | It was deployed without a fresh build. Run `npm run build` (or `npm run deploy`) and deploy again |
| `npm run admin` stops right away | Port 8080 or 8081 is busy: close other previews or servers and try again |
| Admin says it cannot reach the local server | Open it at `localhost`, not at another address, while `npm run admin` is running |
| Photo picker shows an error | Fill in the Cloudinary cloud name and API key in `src/admin/config.yml`; the person must be a Cloudinary user |
| Build fails: "requires the participation agreement" or "needs a version date" | Restore `src/legal/participation-agreement.md` or fix its Version date (YYYY-MM-DD), or turn the event's switch off |
| An entry in the admin shows another entry's text | Reload the page before saving. It can happen after jumping between entries with a pasted /admin link |
| A deploy shows "Canceled" right after a failed one | Fixed Nov 13, 2026: the skip rule in `netlify.toml` now always builds when there is no earlier build to compare with. To force a build: Deploys > Trigger deploy > Clear cache and deploy project |
| Build fails with "Cannot read properties of undefined (reading '0')" in signup-form.njk | `eleventy.config.js` is older than the templates (it lacks the agreement collection): restore the current version |
| Files uploaded on GitHub landed in the repo root | GitHub's "choose your files" picker puts every file in the folder you are viewing. Drag whole folders onto the upload page instead, which keeps their paths |
| Invite link opens the home page and nothing happens (online admin) | Check `src/assets/js/site.js` is deployed; the link should jump to `/admin/` |
| "Unrecognized Git contributor" on a deploy (online admin) | The repo was made private. Make it public again, or move the team to Pro |
