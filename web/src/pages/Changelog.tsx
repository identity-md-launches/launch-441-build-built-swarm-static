import { useMemo } from 'react';
import { LiveNote } from '../components/Chrome';
import type { IssuesState } from '../data/useIssues';
import type { Changelog as ChangelogBlock, DatedEntry, IssueRecord } from '../types';

interface Entry extends DatedEntry { issueDate: string }

const strList = (v: unknown): string[] => (Array.isArray(v) ? v.map((x) => (typeof x === 'string' ? x : x && typeof x === 'object' ? JSON.stringify(x) : String(x))) : []);
const baselineSets = (c: ChangelogBlock | undefined) => ({
  'docs toc': strList(c?.docsToc),
  'docs routes': strList(c?.docsRoutes),
  'paid actions': strList(c?.paidActions),
  skills: (c?.skills ?? []).map((s) => `${s.id ?? '?'}@v${s.version ?? '?'}`),
  'version features': strList(c?.versionFeatures),
  services: (c?.services ?? []).map((s) => `${s.kind ?? '?'} ${s.version ?? ''}${s.up === false ? ' (down)' : ''}`),
});

function diff(older: IssueRecord, newer: IssueRecord) {
  const a = baselineSets(older.data.changelog);
  const b = baselineSets(newer.data.changelog);
  const out: { set: string; added: string[]; removed: string[] }[] = [];
  for (const set of Object.keys(b) as (keyof typeof b)[]) {
    const sa = new Set(a[set]);
    const sb = new Set(b[set]);
    const added = b[set].filter((x) => !sa.has(x));
    const removed = a[set].filter((x) => !sb.has(x));
    if (added.length || removed.length) out.push({ set, added, removed });
  }
  return out;
}

export function Changelog({ state }: { state: IssuesState }) {
  const entries = useMemo<Entry[]>(() => {
    const seen = new Set<string>();
    const all: Entry[] = [];
    for (const r of state.issues) {
      for (const e of r.data.changelog?.dated ?? []) {
        if (!e || !e.date) continue;
        const k = `${e.date}|${e.title ?? ''}`;
        if (seen.has(k)) continue;
        seen.add(k);
        all.push({ ...e, issueDate: r.date });
      }
    }
    return all.sort((x, y) => ((x.date ?? '') < (y.date ?? '') ? 1 : (x.date ?? '') > (y.date ?? '') ? -1 : 0));
  }, [state.issues]);

  const byDay = useMemo(() => {
    const m = new Map<string, Entry[]>();
    for (const e of entries) {
      const day = (e.date ?? '').slice(0, 10);
      if (!m.has(day)) m.set(day, []);
      m.get(day)!.push(e);
    }
    return [...m.entries()];
  }, [entries]);

  const diffs = useMemo(() => {
    const asc = [...state.issues].sort((a, b) => (a.date < b.date ? -1 : 1));
    const out: { from: string; to: string; changes: ReturnType<typeof diff> }[] = [];
    for (let i = 1; i < asc.length; i++) out.push({ from: asc[i - 1]!.date, to: asc[i]!.date, changes: diff(asc[i - 1]!, asc[i]!) });
    return out.reverse();
  }, [state.issues]);

  if (!state.bundledReady) return <p className="live-note" role="status">loading the bundled issue…</p>;
  const oldest = state.issues[state.issues.length - 1] ?? null;
  const baseline = oldest ? baselineSets(oldest.data.changelog) : null;
  const kinds = [...new Set(entries.map((e) => e.kind ?? 'entry'))];

  return (
    <>
      <h1 className="page-title">changelog</h1>
      <p className="muted">dated entries from every issue's changelog block, newest first. {kinds.length ? `kinds: ${kinds.join(', ')}.` : ''}</p>
      <LiveNote live={state.live} detail={state.liveDetail} />

      {diffs.length ? (
        <section aria-labelledby="diffs-title">
          <h2 id="diffs-title">diffs between consecutive issues</h2>
          {diffs.map((d) => (
            <details key={`${d.from}-${d.to}`} open>
              <summary>{d.from} → {d.to}{d.changes.length ? '' : ' · no change in the baseline sets'}</summary>
              {d.changes.map((c) => (
                <div key={c.set} className="diff-set">
                  <h3>{c.set}</h3>
                  <ul>
                    {c.added.map((x) => <li key={`+${x}`} className="diff-add"><span aria-hidden="true">+ </span><span className="visually-hidden">added </span>{x}</li>)}
                    {c.removed.map((x) => <li key={`-${x}`} className="diff-del"><span aria-hidden="true">− </span><span className="visually-hidden">removed </span>{x}</li>)}
                  </ul>
                </div>
              ))}
            </details>
          ))}
        </section>
      ) : (
        <p className="muted">one issue so far; diffs between consecutive issues appear once a second issue exists.</p>
      )}

      <section aria-labelledby="dated-title">
        <h2 id="dated-title">dated entries</h2>
        {byDay.length === 0 ? <p>no dated entries.</p> : null}
        {byDay.map(([day, list]) => (
          <section key={day} className="day" aria-labelledby={`d-${day}`}>
            <h3 id={`d-${day}`}>{day}</h3>
            <ul className="entries">
              {list.map((e, i) => (
                <li key={i} className={`entry entry-${e.kind ?? 'entry'}`}>
                  <span className="entry-time">{(e.date ?? '').slice(11, 16) || '--:--'}</span>
                  <span className="entry-kind">{e.kind ?? 'entry'}</span>
                  <span className="entry-body">
                    {e.url ? <a href={e.url} target="_blank" rel="noopener noreferrer">{e.title ?? e.url}</a> : <strong>{e.title ?? 'untitled'}</strong>}
                    {e.detail ? <span className="entry-detail"> {e.detail}</span> : null}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </section>

      {baseline && oldest ? (
        <section aria-labelledby="baseline-title">
          <h2 id="baseline-title">baseline</h2>
          <details className="baseline">
            <summary>{oldest.data.changelog?.baselineNote ?? `as of ${oldest.date}, diffs start next issue`} · {Object.values(baseline).reduce((n, l) => n + l.length, 0)} entries</summary>
            {Object.entries(baseline).map(([name, list]) => (
              <div key={name} className="baseline-set">
                <h3>{name} <span className="muted">({list.length})</span></h3>
                {list.length ? <ul>{list.map((x) => <li key={x}>{x}</li>)}</ul> : <p className="muted">not exposed</p>}
              </div>
            ))}
            {oldest.data.changelog?.workerRelease ? (
              <div className="baseline-set">
                <h3>worker release at baseline</h3>
                <p>
                  {oldest.data.changelog.workerRelease.url ? <a href={oldest.data.changelog.workerRelease.url} target="_blank" rel="noopener noreferrer">{oldest.data.changelog.workerRelease.name ?? oldest.data.changelog.workerRelease.tag}</a> : oldest.data.changelog.workerRelease.name}
                  {oldest.data.changelog.workerRelease.publishedAt ? ` · published ${oldest.data.changelog.workerRelease.publishedAt}` : ''}
                </p>
              </div>
            ) : null}
          </details>
        </section>
      ) : null}
    </>
  );
}
