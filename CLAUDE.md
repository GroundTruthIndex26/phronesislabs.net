# phronesislabs.net

Static marketing site for Phronesis Labs, a thought lab and idea incubator. Hand written
HTML and CSS, no build step, no framework, no package.json. A Cloudflare Worker sits in
front of a GitHub Pages origin.

This file is the single briefing for a new session. Read it before touching anything.

---

## Hard rules

1. **Never change the logo, the wordmark, or the favicon.** Non negotiable, stated
   directly by the site owner. The mark is an inline SVG repeated in each page's header
   and footer, with two variants that differ only in the third bar:
   `#15263F` for use on light grounds, `#F4F1EA` for use on dark grounds. Copy the SVG
   from `index.html` rather than redrawing it. Favicons live at `assets/img/favicon.ico`,
   `assets/img/favicon.svg`, `assets/img/apple-touch-icon.png` and are referenced by
   every page. Do not substitute `ideationtocreator/assets/phronesis-phi-mark_*.png`,
   which is a different mark from a third party builder.
2. **No em dashes or en dashes anywhere.** Site wide convention, enforced by an earlier
   cleanup commit. Use a comma, a full stop, or the word. The only exceptions are inside
   the vendored `ideationtocreator/` bundle, which is generated output.
3. **Headings are written for answer engines.** The H1 leads with the entity name and
   category. Every H2 is phrased as the question a person would actually ask, and the
   first sentence after it answers that question directly. Keep this pattern when
   editing any page.
4. **Bump the stylesheet cache buster** when `assets/styles.css` changes. Every page
   links `assets/styles.css?v=N`. It is currently at `v=8` on the home page. Update every
   page that you touch.
5. **Ask before deleting or rewriting `ideationtocreator/`.** It is a 368 KB single file
   React bundle from an external builder, not source you can edit sensibly.

---

## Repo map

```
index.html              home page
about/ the-lab/ consulting/ contact/ privacy/     one index.html each
ideationtocreator/      vendored SPA bundle plus ~19 MB of source images
previews/               three landing directions, noindex, see "Work in flight"
assets/styles.css       the whole site's CSS, one file
assets/fonts/           Hanken Grotesk variable 300-800, EB Garamond roman and italic
assets/img/             logos, favicons, og image, products/
worker/index.js         Cloudflare Worker, the real front door
worker/wrangler.toml    Worker config, D1 binding
robots.txt sitemap.xml 404.html
```

### Hosting and deploy

Pages are served from GitHub Pages through the Worker in `worker/`. The Worker adds:

- 301s from the legacy `the-lab.` and `about.` subdomains onto canonical apex paths
- 301s for root level icon requests that GitHub Pages would otherwise 404
- `POST /api/contact`, which writes to a D1 database and emails through Resend when
  `RESEND_API_KEY` is set

Deploy the Worker with versions commands so routes and custom domains are never touched:

```
wrangler versions upload -c worker/wrangler.toml
wrangler versions deploy -c worker/wrangler.toml
```

Pushing to `main` deploys the static pages. The Worker deploys separately.

### Preview locally

Pages use root relative paths, so open them through a server, not by double clicking.

```
python3 -m http.server 8787
# http://localhost:8787/            home
# http://localhost:8787/previews/   the three landing directions
```

---

## Design system

Brand tokens as used on the live site:

| Token | Value | Role |
|---|---|---|
| navy | `#15263F`, deeper `#122036` | headings, header and footer grounds |
| near black navy | `#0A1119` | cinematic grounds in `previews/` |
| cream | `#F7F6F2`, `#FAF8F2` | page ground |
| orange | `#EE5A1A` | the single accent, hover `#CA4210` |
| red | `#C73B2C` | logo only |
| line | `#E7E2D6` light, `#D8D7CF` in previews | hairlines |

Type: **Hanken Grotesk** for everything, self hosted, variable 300 to 800.
**EB Garamond** italic is used only for the Greek motto `εὖ πράττειν`. In `previews/`
a monospace stack carries small uppercase labels. Do not add a webfont host; the fonts
are in the repo.

---

## Work in flight, September 2026

**Draft pull request 1**: https://github.com/GroundTruthIndex26/phronesislabs.net/pull/1
Branch `claude/bold-mccarthy-6x2cxl`, commit `b21a39b`.

Two things in it:

1. `index.html` headings rewritten for answer engines, plus matching title, meta
   description, Open Graph, Twitter card and the `WebPage` JSON-LD node. Live copy.
2. `previews/` holds three directions for a redesigned home page, all `noindex` and
   disallowed in `robots.txt`. They are for choosing between, not for merging.

### The pending decision

The site owner picks one direction. Then:

- that direction becomes the real `index.html`
- `previews/pl.css` folds into `assets/styles.css`
- the other two directions and the `previews/` folder are deleted
- only then does the pull request merge

The three, all sharing `previews/pl.css` and `previews/pl.js`:

| Path | Name | Hero |
|---|---|---|
| `previews/a/` | The Bench | full bleed photograph that drifts, pulsing markers, a reticle that walks the image reading ideas as they pass or fail the test |
| `previews/b/` | The Instrument | a plate floating on a dark ground, tilting toward the cursor, a live data card, a numbered spec list |
| `previews/c/` | The Brief | a cream reading column against a full height annotated frame |

### The visual direction, and why

The owner rejected a first round that used rounded cards, a cream ground, a serif body
face and gentle scroll reveals. It read as generic. They then supplied a 45 second screen
recording of **alethia.earth** and said "that is what I am looking for: bold, clean,
automatic and dynamic motion, supremely professional."

That recording is **not in this repo**. Everything worth taking from it is written below,
so you do not need it.

**What the reference does**

- Grounds are near black or a deep desaturated colour. Light sections are off white. The
  transition between them is hard: a light panel with rounded top corners slides up over
  the dark section as you scroll.
- Exactly one bright accent, used only for small pill labels, circular number badges,
  arrow buttons, marker dots, and one solid tile per row. Never for body text.
- One geometric neo grotesk carries every headline at medium weight, roughly 450 to 500.
  Sentence case, leading about 1.1, tracking about -0.03em. Headlines are never uppercase.
- A monospace micro voice does all the small work: corner labels, annotations over
  imagery, spec rows, pill labels. Uppercase, wide tracking, about 11px. This carries as
  much of the identity as the headline face.
- Recurring devices: a cinematic hero with objects that float continuously, measurement
  annotations that flicker on and off over them, a translucent data card with one big
  number and a sparkline, a spec list of mono rows separated by hairlines with a `+` at
  the right edge, two large tiles side by side with one solid accent and one photograph,
  a scattered card collage that assembles around a centered headline, a two by two grid
  of numbered pills, and a horizontal case study carousel.
- Motion is ambient first. Something moves without the visitor doing anything: a dot that
  opens into the scene on load, slow continuous drift and rotation, annotations that
  cycle, markers that pulse. Scroll and cursor then steer the rest.

**How that maps onto this brand**

Brand orange takes the reference's lime role. Navy and near black navy take its greens.
Hanken Grotesk at weight 500 takes its grotesk. A system monospace stack takes its mono.
All of this is already implemented in `previews/pl.css`, which is the reference
implementation to copy from.

**Non obvious implementation notes in `previews/`**

- A sticky hero paints above later static siblings, so every block after it needs its own
  stacking layer. See the `.sec, .marq, .ftr` rule.
- Inline custom properties beat any stylesheet rule, so the narrow width override for the
  collage overrides `transform` directly rather than `--dx` and `--dy`.
- Tiles need `isolation: isolate` or a background image at `z-index: -2` escapes behind
  the whole section.
- `previews/assets/` holds resized copies of images that exist at full size in
  `ideationtocreator/assets/`. The originals are 2 to 6 MB each. Never link the originals
  from a page.
- All motion is wrapped for `prefers-reduced-motion: reduce`.

---

## Things that are not in this repo

| Thing | Where it is |
|---|---|
| The three directions as published pages | claude.ai artifacts, linked from the session below |
| The session that produced this work | https://claude.ai/code/session_01DuJdHt1tuH7478kQNqbL98 |
| The alethia.earth reference recording | Uploaded by the owner from their own machine. Worth saving to iCloud Drive if it is wanted again, though the distillation above should make that unnecessary. |
| Cloudflare, D1 and Resend credentials | Cloudflare dashboard and Worker secrets. Never in the repo. |

Published previews, for reviewing the motion without running a server:

- The Bench: https://claude.ai/code/artifact/184650f6-f93b-40b3-a47a-0515165fa1e6
- The Instrument: https://claude.ai/code/artifact/35479917-47b7-46f9-b6cd-8016a6b3b3b6
- The Brief: https://claude.ai/code/artifact/b7123ae1-3d32-4a22-9947-0864165b0031

---

## Gotchas

- `alethia.earth` and some other hosts are blocked by the sandbox egress proxy. Do not
  assume a fetch failure means a site is down.
- `ffmpeg` is not installed. `pip install imageio-ffmpeg` provides a static binary if a
  video ever needs frames pulled from it.
- The intake form inside `ideationtocreator/` has no backend. A script at the bottom of
  that page copies what was typed into `sessionStorage` and forwards to `/contact/`.
- `robots.txt` carries a `Content-Signal` line that allows search and citation but
  refuses training. Preserve it.
- Delete the "Work in flight" section once pull request 1 is merged or closed.
