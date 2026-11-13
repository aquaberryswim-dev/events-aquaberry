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

## How events get onto the site today (no GitHub needed)

Right now the site is deployed from this folder, the same way as the store. GitHub is only needed later, when
Yasmin and Aryane edit events themselves online (see "Later: the owners edit online").

1. `npm run admin`, then open http://localhost:8080/admin/ and click **Login** (no password on your own computer).
2. Add or edit the event. **Publish > Publish now** saves the file in `src/events/` right away. Nothing is live yet.
3. Check the page at http://localhost:8080 (it refreshes on its own). Stop the admin with Ctrl+C.
4. Put it live, either way:
   - `npm run deploy` (builds, then uploads with the Netlify CLI), or
   - `npm run build`, then in Netlify open the events project > **Deploys** and drag the `_site` folder onto the
     drop area. Always run the build right before: it empties `_site` first, so old files never go live.

You can also edit the Markdown file in `src/events/` by hand; the admin just makes it harder to break the format.

First time with the CLI (once per computer):

```sh
npx netlify-cli@27.15.0 login   # opens the browser to sign in to the AquaBerry Netlify account
npx netlify-cli@27.15.0 link    # pick the events project; saves its ID in .netlify/ (not a secret)
npm run deploy:draft            # optional: a private draft link to check before going live
```

## Credits on the Netlify Free plan (read this first)

The Free plan gives the AquaBerry team **300 credits a month, shared with the store**. When they run out,
every project in the team pauses, the store included, until the next billing cycle (the 14th).

- A **production deploy costs 15 credits**, whichever way it is made (CLI, drag-and-drop or Git).
- `npm run deploy:draft` makes a draft deploy, which is not a production deploy. Check Netlify > Usage after
  the first one to confirm it used no credits.
- Batch changes: one deploy with the new time and the sponsors costs less than two.
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
3. **Forms > Submission notifications**: add an email notification for this form (or for any form) to the inbox
   the owners check. An address outside the Netlify team gets a confirmation email first; notifications start once
   it is confirmed. Emails come from `formresponses@netlify.com`. Replying to one goes straight to the person who
   signed up, because the form field is named `email`.
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
Never type a home address in the admin: these files become public if the folder is pushed to a public GitHub repo.

## Run it on your computer

Requires Node 22 or newer. Run `npm install` once in this folder.

| Command | What it does |
| --- | --- |
| `npm run admin` | Admin at http://localhost:8080/admin/ plus the preview. Publish saves files in this folder |
| `npm start` | Preview only, at http://localhost:8080 |
| `npm run preview:samples` | Preview with the sample events in `src/samples/` (never built into `_site`) |
| `npm run build` | Fresh deployable site in `_site/` (no samples, old files removed) |
| `npm run deploy:draft` | Build, then a Netlify draft deploy (private link) |
| `npm run deploy` | Build, then a production deploy (15 credits) |

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
src/static/_headers    Security and cache headers (works for every deploy method)
src/assets/            CSS, JavaScript, font (Hanken Grotesk, OFL) and logo files from the Brand Kit
src/samples/           Sample events for local previews only
lib/                   Date (Florida time), image, calendar-file and event helpers
scripts/site.js        The build, preview and admin commands (same on Windows, macOS and Linux)
netlify.toml           Build settings for later Git deploys
```

## Cloudinary (needed for photo uploads in the admin)

1. Create a Free Cloudinary account with the AquaBerry email. Settings > Users: invite Yasmin and Aryane
   (the Free plan includes 3 users).
2. Copy the **cloud name** and **API key** (never the API secret) into `src/admin/config.yml`, replacing the two
   `REPLACE_WITH_` values. Both are public by design.
3. Each person who uploads signs in to Cloudinary once inside the admin's image picker.

## Later: the owners edit online (needs GitHub)

The online admin (`events.aquaberry.store/admin/`) saves events by committing to a Git repository, so it needs one.
Do these in order, once the owners are ready to post events themselves.

1. **Check the event files first.** Everything in this folder becomes public: no home addresses, phone numbers
   or other private details in `src/events/`.
2. **GitHub (AquaBerry account, 2FA on):** create a **public** repository named `aquaberry-events` and push this
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
| Invite link opens the home page and nothing happens (online admin) | Check `src/assets/js/site.js` is deployed; the link should jump to `/admin/` |
| "Unrecognized Git contributor" on a deploy (online admin) | The repo was made private. Make it public again, or move the team to Pro |
