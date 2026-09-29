import { useMemo } from 'react';
import { Card, CommunityCard } from '../components/Card';
import { LiveNote } from '../components/Chrome';
import type { IssuesState } from '../data/useIssues';
import { fmt, headlines } from '../lib/headline';
import { href } from '../lib/router';
import { KINDS, type GalleryItem, type Kind } from '../types';

const isKind = (k: string | null): k is Kind => k !== null && (KINDS as string[]).includes(k);

export function Built({ state, kind }: { state: IssuesState; kind: string | null }) {
  const latest = state.issues[0] ?? null;
  const filter: Kind | null = isKind(kind) ? kind : null;

  const items = useMemo(() => {
    if (!latest) return [] as { item: GalleryItem; base: string }[];
    const list = (latest.data.gallery ?? []).filter((g) => g && typeof g === 'object');
    return list
      .map((item) => ({ item, base: latest.base }))
      .sort((a, b) => (a.item.at ?? '') < (b.item.at ?? '') ? 1 : (a.item.at ?? '') > (b.item.at ?? '') ? -1 : 0);
  }, [latest]);

  const community = state.config?.communityLinks ?? [];
  const setKind = (k: Kind | null) => {
    window.location.hash = href.built(k);
    window.scrollTo({ top: 0 });
  };

  if (!state.bundledReady) return <p className="live-note" role="status">loading the bundled issue…</p>;
  if (!latest) {
    return (
      <section className="empty">
        <h1 className="page-title">built</h1>
        <p>no issue data was found. the export needs <code>data/index.json</code> and one <code>data/&lt;date&gt;/data.json</code>.</p>
      </section>
    );
  }

  const hl = headlines(latest);
  const visible = filter ? items.filter((x) => x.item.kind === filter) : items;
  const showCommunity = !filter || filter === 'community';
  const empty = visible.length === 0 && !(showCommunity && community.length > 0);
  const countFor = (k: Kind) => (k === 'community' ? community.length : items.filter((x) => x.item.kind === k).length);

  return (
    <>
      <section className="date-header">
        <div className="date-line">
          <h1 className="page-title">issue {latest.number ?? '?'} · {latest.date}</h1>
          <a className="issue-link" href={href.issue(latest.date)}>read the issue</a>
        </div>
        <dl className="headline">
          {hl.map((h) => (
            <div key={h.key} className="headline-item">
              <dt>{h.label}</dt>
              <dd>{fmt(h.value)}</dd>
            </div>
          ))}
        </dl>
        <LiveNote live={state.live} detail={state.liveDetail} />
      </section>

      <section aria-labelledby="filters-title">
        <h2 id="filters-title" className="visually-hidden">filter by category</h2>
        <div className="filters" role="group" aria-label="filter by category">
          <button type="button" className="chip" aria-pressed={filter === null} onClick={() => setKind(null)}>all <span className="chip-n">{items.length + community.length}</span></button>
          {KINDS.map((k) => (
            <button key={k} type="button" className={`chip chip-${k}`} aria-pressed={filter === k} onClick={() => setKind(k)}>
              {k} <span className="chip-n">{countFor(k)}</span>
            </button>
          ))}
        </div>
        <p className="visually-hidden" role="status" aria-live="polite">
          {filter ? `${visible.length + (filter === 'community' ? community.length : 0)} ${filter} items` : `${items.length + community.length} items`}
        </p>
      </section>

      <section aria-label="what got built" className="grid-section">
        {empty ? (
          <div className="empty">
            <p className="empty-title">no {filter} items in issue {latest.number ?? ''}</p>
            <p>{filter === 'hook' || filter === 'image' || filter === 'audio' ? `nothing of this kind was published on ${latest.date}; the category stays so daily issues can fill it.` : `nothing of this kind was recorded for ${latest.date}.`}</p>
            <button type="button" className="chip" onClick={() => setKind(null)}>show all categories</button>
          </div>
        ) : (
          <div className="grid">
            {visible.map(({ item, base }) => <Card key={item.id ?? `${item.kind}-${item.name}`} item={item} base={base} onSelectKind={setKind} />)}
            {showCommunity ? community.map((c, i) => <CommunityCard key={c.url ?? i} link={c} onSelectKind={setKind} />) : null}
          </div>
        )}
      </section>
    </>
  );
}
