# data schema

Each issue lives in `data/<YYYY-MM-DD>/` with three things: `data.json`, `issue.md` and `media/`.
`data/index.json` lists the bundled issues: `{"issues":[{"date":"2026-09-29","number":1}]}`.
Daily repositories (names starting `swarm-daily`) carry the same layout; the site discovers them
through the GitHub search API and reads them from raw.githubusercontent.com.

## conventions

- **Metric**: every numeric value is an object `{value, source, readAt}` where `source` is the public
  URL the number was read from and `readAt` is the UTC time of that read. Optional `note` explains
  the derivation. A value the sources do not expose is `null` (rendered as "not exposed").
- Array items that carry numbers (top seats, schedules, launches, parked reasons, dated entries)
  carry their own `source` and `readAt` fields instead of wrapping each number.
- **Window**: `last24h` means `[issue date 00:00:00Z minus 24h, issue date 00:00:00Z)`, stated in
  `issue.windowStart` and `issue.windowEnd`. Seat activity uses a trailing 24h/7d window ending at
  the read time because `/seats/records` exposes `lastWorkedAt` only.
- Times are ISO-8601 UTC strings. Media paths are relative to the issue folder (`media/<slug>.png`).
- Wallet addresses are never placed in `briefs` (replaced by `[address]`).

## top-level keys (exactly these)

| key | shape |
| --- | --- |
| `issue` | `{date, number, title, windowStart, windowEnd, generatedAt, previousIssue, deltas, schema}`; `previousIssue` and `deltas` are `null` for issue 1 |
| `network` | `{connectedDaemons, activeEnrollments, workingNow, acceptedLastDay, pendingFeedback, deployBreaker, payments{quoted, paid, expired, failed}, explorerActivity{working, jobs, oracle, at}}`, all Metrics from `/health` (explorer values from `explorer.imd.fun/api/activity`) |
| `launches` | `{highestNumber, byStatus{<status>: Metric}, last24h[], parkedReasons[]}`; `last24h` items: `{id, number, name, kind, status, policyVersion, repo, pair, chainId, createdAt, parkedReason, artifacts[], source, readAt}`; `parkedReasons` items: `{reason, count, source, readAt}` where `reason` is the text before the first " — " with the count replaced by `N` |
| `policies` | `[{version, kind, note, createdAt, chainId, source, readAt}]`, every policy from `/launch/policies` |
| `jobs` | `{last24hTotal, last24hByKind{<template>: Metric}, createdBySchedule}`; `createdBySchedule` is derived from `/schedules` as `runsBought - runsRemaining` summed |
| `oracle` | `{last24hTotal, last24hByStatus{<status>: Metric}, attestedLast24h, galleryShown, galleryRest, exampleQuestions[3 verbatim], models[], modelsNote, attester}`; `models` is empty because panel members are exposed by wallet and tokenId only |
| `schedules` | `{active, total, items[{id, label, action, cadence, status, statusReason, runsRemaining, runsBought, nextRunAt, lastRunAt, createdAt, question, evidence, source, readAt}]}`; `cadence` is `every <ISO duration>` or `cron <expr> (<tz>)` |
| `seats` | `{active24h, active7d, everWorked, everAccepted, totalAccepted, top5Share, top20Share, top5[{tokenId, accepted, source, readAt}]}` |
| `changelog` | `{baselineAsOf, baselineNote, docsToc[], docsRoutes[], paidActions[], skills[{id, version, role, tier}], versionFeatures[], versionCommit, services[{kind, version, up}], workerRelease{tag, name, publishedAt, url, notes[]}, workerReleasesLast7d, dated[]}`; `dated` items: `{date, kind: policy|worker-release|site|version, title, detail, url, source, readAt}`. The undated lists are the baseline; the site diffs them between consecutive issues |
| `briefs` | `{accepted[{job, objective300, skill, attempt, revisions, minutesToAccept, source, readAt}], parked[{job, launch, launchNumber, objective300, skill, reason, source, readAt}]}`; `minutesToAccept` is the implement node's verdict time minus the job's createdAt |
| `gallery` | `[{id, name, kind, at, asked, built, media{type, src, poster}, links{site, repo, launch, job, cid, oracle?, schedule?}, extra{}, source, readAt}]`, newest first by `at` |
| `sources` | `[{url, readAt, status}]`, one line per HTTP read made for the issue |

## gallery kinds and media

`kind` is one of the hire page's categories: `token`, `contracts`, `hook`, `report`, `website`,
`image`, `audio`, `video`, `oracle`, `heartbeat`, `community` (community cards come from
`config.json`, not from data.json).

`media.type` is `screenshot` (website, 1280x800 png), `image` (the delivered image file), `video`
(the delivered file with a `poster` png), `audio` (the delivered file) or `none`.

`extra` carries kind-specific fields the cards render: `question` and `answer` for oracle,
`label` and `cadence` for heartbeat, `launchNumber` and `status` for launches.

## selection rules for gallery items

Every site named in the window (`/sites`), every launch that went live in the window, every accepted
image, audio, video and report job in the window, the ten most recent attested oracle requests
(the rest are counted in `oracle.galleryRest`), every active schedule, and up to ten other accepted
jobs with a public delivery, most recent first. Nothing is added that is not in the sources.
