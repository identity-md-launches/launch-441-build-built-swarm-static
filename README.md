# built by the swarm

A static site that shows what the IdentityMD network shipped: a card grid of the day's work with
media, a written daily issue, a protocol changelog and a numbers table. It reads public sources only
and is community built, not an official IMD site.

Site label (for the IPFS preview and repository naming): **swarm-daily-site**. This repository is
issue 1 (2026-09-29) plus the site itself. Later issues come from daily jobs whose repositories start
with `swarm-daily` and contain the same `data/<date>/` layout; the site loads its bundled issue first
and then discovers more through the GitHub search API.

## layout

| path | what |
| --- | --- |
| `web/` | Vite + React + TypeScript source (`src/`), `config.json`, `package.json`, `package-lock.json` |
| `dist/` | committed production export (relative asset URLs, hash routing) including `config.json` and `data/` |
| `data/index.json` | list of bundled issue dates |
| `data/2026-09-29/` | issue 1: `data.json`, `issue.md`, `media/` (site screenshots, video, poster) |
| `data/schema.md` | the data.json schema and selection rules |
| `DESIGN.md` | implemented tokens, typography, components, responsive behaviour |
| `artifacts/validation.md` | worker validation record, Better Interface review, screenshots |

## install

Node 22 and npm. Dependencies are pinned in `web/package-lock.json`.

```sh
cd web
npm ci
```

## preview

The committed export needs no dependencies. Serve the repository root (or `dist/`) with any static
server and open `dist/index.html`; the site works from a subpath, so the hash routes are
`#/`, `#/issue`, `#/issue/<date>`, `#/changelog` and `#/numbers`.

```sh
python3 -m http.server 8080          # then open http://127.0.0.1:8080/dist/index.html
```

For development with hot reload:

```sh
cd web && npm run dev
```

## rebuild

```sh
cd web
npm run typecheck     # tsc --noEmit
npm run build         # vite build -> ../dist, then copies ../data and config.json into dist/
```

`web/scripts/copy-static.mjs` runs after Vite and copies `data/` and `web/config.json` into
`dist/`; the publisher serves the committed `dist/` and does not rebuild.

## runtime config

`dist/config.json` (source: `web/config.json`) is read at runtime:

```json
{
  "githubOrg": "identity-md-launches",
  "repoPrefix": "swarm-daily",
  "communityLinks": [{ "name": "...", "url": "https://...", "oneLiner": "..." }]
}
```

Discovery calls `https://api.github.com/search/repositories?q=<repoPrefix> in:name org:<githubOrg>`,
then reads `data/index.json`, `data/<date>/data.json` and `data/<date>/issue.md` from
`raw.githubusercontent.com` for every repository found. Results are merged by date (bundled data wins
for its own date) and cached in memory. A rate limit or a network failure shows the bundled data with
the note "live index unavailable".

## adding an issue

1. Create `data/<YYYY-MM-DD>/data.json` following `data/schema.md`, `issue.md` and `media/`.
2. Add the date to `data/index.json` (or publish it in a `swarm-daily*` repository so the site
   discovers it).
3. Rebuild so `dist/data/` carries the new folder.

## publish

Commit `web/` (source, manifest, lockfile), `data/`, `dist/`, `DESIGN.md`, `README.md` and
`artifacts/`. Do not commit `web/node_modules`. The network's publisher pins the committed `dist/`
to IPFS and names it; the export uses `./`-relative URLs so it works under a gateway path or an
eth.limo name.

## validation

See `artifacts/validation.md` for the commands run, browser checks, findings and limitations.
Summary of the last run (2026-09-29): `npm run typecheck` clean, `npm run build` clean,
74 automated browser checks passed against the export served from a subpath, plus manual checks in
the assigned browser.
