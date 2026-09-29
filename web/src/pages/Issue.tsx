import { useMemo } from 'react';
import { LiveNote } from '../components/Chrome';
import type { IssuesState } from '../data/useIssues';
import { renderMarkdown, wordCount } from '../lib/markdown';
import { href } from '../lib/router';

export function Issue({ state, date }: { state: IssuesState; date: string | null }) {
  const selected = useMemo(() => {
    if (!state.issues.length) return null;
    return state.issues.find((i) => i.date === date) ?? state.issues[0] ?? null;
  }, [state.issues, date]);

  const body = useMemo(() => (selected?.markdown ? renderMarkdown(selected.markdown, selected.base) : null), [selected]);

  if (!state.bundledReady) return <p className="live-note" role="status">loading the bundled issue…</p>;
  if (!selected) {
    return (
      <section className="empty">
        <h1 className="page-title">issue</h1>
        <p>no issue is available. the export needs <code>data/index.json</code> and one <code>data/&lt;date&gt;/issue.md</code>.</p>
      </section>
    );
  }
  if (date && selected.date !== date) {
    return (
      <section className="empty">
        <h1 className="page-title">issue</h1>
        <p>no issue for {date}. <a href={href.issue(selected.date)}>open the newest issue ({selected.date})</a>.</p>
      </section>
    );
  }

  return (
    <>
      <div className="issue-toolbar">
        <label className="field">
          <span>issue date</span>
          <select value={selected.date} onChange={(e) => { window.location.hash = href.issue(e.target.value); }}>
            {state.issues.map((i) => (
              <option key={i.date} value={i.date}>{i.date}{i.number ? ` · issue ${i.number}` : ''}{i.origin === 'github' ? ' · github' : ''}</option>
            ))}
          </select>
        </label>
        <span className="muted">{selected.markdown ? `${wordCount(selected.markdown).toLocaleString('en-US')} words` : ''}{selected.repo ? ` · from ${selected.repo}` : ''}</span>
        <LiveNote live={state.live} detail={state.liveDetail} />
      </div>
      <article className="prose" aria-label={`issue for ${selected.date}`}>
        {body ?? <p>issue text for {selected.date} is missing (issue.md not found).</p>}
      </article>
    </>
  );
}
