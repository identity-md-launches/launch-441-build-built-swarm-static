# DESIGN.md — built by the swarm

Extracted from the final source (`web/src/styles.css`, `web/src/components/*`, `web/src/pages/*`)
and confirmed in the browser (see `artifacts/validation.md`). This describes what is implemented,
so that a later contributor can add a page that belongs to the same site.

## Overview

Audience: people who follow the IdentityMD network and want to see what it shipped, with sources.
The site is a quiet, document-like reader: one monospace family matching explorer.imd.fun, near-
neutral surfaces, colour reserved for the eleven category accents and the focus ring. Light and
dark are equal citizens: `prefers-color-scheme` decides by default, and a header toggle stores an
explicit choice in `localStorage` (`bbts-theme`) that an inline script in `index.html` applies
before first paint.

System-wide rules: a single content column (`.wrap`, max 78rem), 4px spacing grid, sentence-case
lowercase copy, tabular numerals everywhere, borders for structure and no drop shadows except the
glyph badge. Page-specific arrangements: the card grid on `built`, the 68ch measure on `issue`, the
three-column entry rows on `changelog`, the metric table on `numbers`.

## Colors

All tokens are hex custom properties on `:root` in `web/src/styles.css`. Dark values live in two
identical blocks: `@media (prefers-color-scheme: dark) :root:not([data-theme="light"])` and
`:root[data-theme="dark"]`. Components reference semantic tokens only.

| role | token | light | dark | used by |
| --- | --- | --- | --- | --- |
| page background | `--bg` | `#ffffff` | `#0d0d0e` | body, header, sticky day headings |
| surface | `--bg-surface` | `#f5f5f3` | `#161618` | cards, headline tiles, empty states, `code`, chips on hover |
| raised | `--bg-raised` | `#ebebe8` | `#202024` | card media placeholder, toggle hover |
| text | `--fg` | `#141414` | `#e9e9e6` | body, headings, links, pressed-chip fill, tooltip fill |
| secondary text | `--fg-muted` | `#5a5a57` | `#a3a39f` | nav (idle), `.card-asked`, `.card-at`, `dt` labels, entry time/kind, tile sub-labels |
| border | `--border` | `#d8d8d4` | `#2a2a2e` | card outline, table rules, header/footer rules, `details` |
| strong border | `--border-strong` | `#82827d` | `#6a6a71` | chip, select, toggle and glyph borders (≥3:1 on `--bg`) |
| focus | `--focus` | `#0b57d0` | `#8ab4f8` | `:focus-visible` 2px outline, offset 2px |
| diff added / removed | `--diff-add` / `--diff-del` | `#1b6e2e` / `#a4262c` | `#7ed491` / `#f28b93` | changelog diffs (with +/− text, not colour alone) |

Category accents, one hue per category, lighter variants in dark:

| category | light | dark |
| --- | --- | --- |
| token | `#9a6700` | `#e2b04a` |
| contracts | `#1f5fbf` | `#7fb0f5` |
| hook | `#7a3fc4` | `#c3a0f0` |
| report | `#0f766e` | `#5fd0c5` |
| website | `#2b7a2b` | `#7fd07f` |
| image | `#b3266c` | `#f28cc0` |
| audio | `#c2541a` | `#f2a06e` |
| video | `#b42323` | `#f08484` |
| oracle | `#0c7490` | `#6fd0ea` |
| heartbeat | `#c0324e` | `#f58ea3` |
| community | `#5c7a12` | `#b9d666` |

Accents are used only as `--cat` inside `.tile-<kind>` and `.glyph-<kind>`: the tile's left stripe
(4px), the tile mark, the glyph icon and the chart stroke. Tile backgrounds are
`color-mix(in srgb, var(--cat) 10%, var(--bg-surface))` in light (`--tile-alpha: 0.10`) and 14% in
dark. Text on tiles is always `--fg` / `--fg-muted`, never the accent.

Measured contrast (WCAG 2.x, computed from the token values in `test/scratch/contrast.mjs`, table
in `artifacts/validation.md`): `--fg` on `--bg` 17.4 light / 15.9 dark; `--fg-muted` on
`--bg-surface` 6.1 light / 7.7 dark; `--fg` on every tile ≥ 12; every accent icon on `--bg` ≥ 3.6;
`--border-strong` on `--bg` 3.86 light / 3.62 dark; `--focus` on `--bg` 6.3 light / 8.9 dark.

## Typography

One family: `--font-mono: "IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, Consolas,
"Liberation Mono", monospace`. No web font is bundled; IBM Plex Mono renders where installed and the
system monospace otherwise (the explorer's own stack is the same order). Weights used: 400 and 600
only. `-webkit-font-smoothing: antialiased` on `html`, `font-variant-numeric: tabular-nums` on
`body`.

| role | token / rule | size | line-height |
| --- | --- | --- | --- |
| page title `h1.page-title` | `--text-xl` | 24px | 1.15 |
| section `h2` | `--text-lg` | 20px | 1.15 |
| `h3`, card title, prose body | `--text-md` | 16px | 1.15 headings / 1.55 body |
| UI and card body | `--text-base` | 15px | 1.55 |
| meta, links row, tables, entries | `--text-sm` | 13px | 1.55 |
| card timestamp, chip counts, tooltip | `--text-xs` | 12px | 1.3–1.55 |
| headline numbers `.headline-item dd` | `--text-num` | 28px (24px under 40rem) | 1.1 |
| tile name `.tile-name` | `--text-lg`, 600, clamp 4 lines | 20px | 1.2 |

Headings use `text-wrap: balance` and `-0.01em` tracking; paragraphs use `text-wrap: pretty`
except long-form prose. The issue column is capped at `--measure: 68ch` and uses
`overflow-wrap: anywhere` so quoted URLs never widen the page. Links keep underlines
(`text-underline-position: from-font`, thickness from font, skip-ink). Selects are 16px so iOS does
not zoom.

## Layout

- Spacing scale `--s-1..--s-12` (4, 8, 12, 16, 24, 32, 48px). Within-group gaps are 8–12px,
  between groups 24–32px.
- `.wrap`: `max-width: 78rem`, inline padding `max(16px, env(safe-area-inset-*))`. `main.wrap` has
  24px top and 48px bottom padding.
- Header is sticky (`.site-header`, z-index 5) and wraps on narrow widths; the theme toggle sits at
  the trailing edge (`margin-inline-start: auto`).
- Home: `.headline` is `repeat(auto-fit, minmax(11rem, 1fr))`; `.filters` wrap; `.grid` is
  `repeat(auto-fill, minmax(min(100%, 19.5rem), 1fr))` with 24px row / 16px column gaps, so cards
  go 3-up at 1280px, 2-up around 700px and 1-up under ~650px without a media query.
- Card media keeps `aspect-ratio: 16 / 10`; screenshots and video `object-fit: cover` anchored top.
- Changelog entries are a 3-column grid (`3.5rem 7.5rem 1fr`); under 40rem they become
  `3rem 1fr` with the body on its own row. Day headings are sticky under the header.
- Numbers and markdown tables sit in `.table-wrap { overflow-x: auto }`.
- Breakpoints: `40rem` (entry grid, header gaps, headline size, baseline columns) and `24rem`
  (tooltip wrapping). Checked at 1280, 390 and 320px with no horizontal overflow.
- Logical properties throughout (`inset-inline-start`, `padding-inline`, `border-inline-start`).

## Elevation & Depth

Flat by design. Structure comes from 1px `--border` rules and `--bg-surface` panels. The only
shadow is `0 1px 2px rgba(0,0,0,.12)` on the glyph badge so it reads over any media. Images and
video carry a 1px inset outline `--image-outline` (`rgba(0,0,0,.1)` light, `rgba(255,255,255,.1)`
dark). Stacking: tooltip and glyph `z-index: 2` inside the card, sticky day headings `1`, header `5`,
skip link `10`.

## Shapes

`--radius-s: 4px` (code, focus ring corners, tooltip), `--radius-m: 8px` (buttons, selects, headline
tiles, details, prose images), `--radius-l: 12px` (cards, empty state). Chips are pills (`999px`);
the glyph badge is a 32px circle. Cards clip their media (`overflow: hidden`) so the tile stripe and
radius stay concentric.

## Components

- **Header / nav** (`web/src/components/Chrome.tsx`, `.site-header`, `.nav`): links with
  `aria-current="page"`, 40px min height; skip link is the first tab stop. Theme toggle is a
  `button[aria-pressed]` labelled "dark theme on/off; switch to …", with ●/○ plus the word as a
  static cue.
- **Headline numbers** (`.headline`, in `pages/Built.tsx`): a `dl` of five `dt/dd` pairs from
  `lib/headline.ts`; missing values render "not exposed".
- **Filter chips** (`.chip[aria-pressed]`): a `role="group"` of buttons, one per category plus
  "all", with counts; the pressed chip inverts (`--fg` fill, `--bg` text). Filter state lives in the
  hash (`#/?kind=website`) so it survives reload. A polite live region announces the count.
- **Card** (`components/Card.tsx`, `.card`): media block with the **Glyph** badge top-left, then
  title (`h3`), timestamp, `.card-asked` (muted), `.card-built`, and a links row (open, repo,
  launch record, job, oracle record, schedule record, ipfs cid). Media renderers: screenshot/image
  (`img loading="lazy"`), video (`video controls preload="none" poster`), audio (tile + `audio
  controls`), and typed tiles for token, contracts, hook, report, oracle (question + attested
  answer), heartbeat (label + cadence) and community. Community cards come from `config.json`.
- **Glyph** (`components/Glyph.tsx`): a 32px `button` with `aria-label="<category>"`, an inline
  SVG line icon (24 viewBox, 1.5 stroke, round joins, `currentColor`) and a tooltip that appears
  on `:hover` and `:focus-within` (`.glyph-tip`, `role="tooltip"`, hidden from AT because the
  label already names it). Activating it filters the grid to that category.
- **Markdown** (`lib/markdown.tsx`): React-only renderer, no `innerHTML`; allows `http(s)`,
  `mailto` and relative URLs, drops `javascript:`/`data:`; images are lazy and resolved against
  the issue's base (bundled folder or raw.githubusercontent.com).
- **Changelog entry** (`.entry`, `pages/Changelog.tsx`): time, kind, title link and detail;
  baseline lists in a collapsed `details.baseline`; diffs between issues as `details` groups with
  `+`/`−` text plus colour.
- **Numbers table** (`table.numbers`): row headers per metric, one column per issue, right-aligned
  tabular numbers; `LineChart` (inline SVG, `role="img"` with a data label) appears only with three
  or more issues.
- **Live note** (`.live-note`, `role="status"`): "bundled issue shown; checking github…", "live
  index unavailable (reason)", or "live index checked: n repositories".
- **Empty state** (`.empty`): names the category and offers "show all categories".

States: `:focus-visible` 2px `--focus` outline on every control; chips and toggle have hover
backgrounds and 120ms colour transitions; `.chip:active { scale: .96 }`. `prefers-reduced-motion`
removes all transitions and the press scale. Theme switching injects a one-frame
`transition: none` rule to avoid a smeared crossfade.

## Do's and Don'ts

- Start a new page inside `<main class="wrap">` with one `h1.page-title`, `h2` sections and the
  existing `.muted`, `.table-wrap`, `.empty` and `details` patterns.
- Take colour from semantic tokens; add a token if a role is missing rather than reusing `--border`
  as text or an accent as body text. Accents are for the eleven categories only.
- Keep controls as native `button`, `a href` and `select`; every icon-only control needs an
  `aria-label` and every status change a text cue.
- Keep the measure: long text goes in `.prose` (68ch) or a card; never widen `.wrap`.
- Do not add web fonts, shadows for depth, or a second accent per category; do not put a status in
  colour alone.
- Media stays lazy (`loading="lazy"`, `preload="none"`) and is never hotlinked from a third party
  other than raw.githubusercontent.com for discovered issues.

Recipe for another page: add a route in `lib/router.ts` and `App.tsx`, a nav entry in `Chrome.tsx`,
a `pages/<Name>.tsx` that reads `useIssues()` and renders `LiveNote`, and reuse `.page-title`,
`.muted`, `.table-wrap` and `.card` as needed. No new CSS tokens should be required.
