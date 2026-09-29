import type { LiveStatus } from '../data/load';
import { href, type Route } from '../lib/router';
import { useTheme } from '../lib/theme';

export function Header({ route }: { route: Route }) {
  const { theme, toggle } = useTheme();
  const nav: { key: Route['page']; label: string; to: string }[] = [
    { key: 'built', label: 'built', to: href.built() },
    { key: 'issue', label: 'issue', to: href.issue() },
    { key: 'changelog', label: 'changelog', to: href.changelog },
    { key: 'numbers', label: 'numbers', to: href.numbers },
  ];
  return (
    <header className="site-header">
      <a className="skip-link" href="#main">skip to content</a>
      <div className="wrap header-row">
        <a className="brand" href="#/">built by the swarm</a>
        <nav aria-label="pages">
          <ul className="nav">
            {nav.map((n) => (
              <li key={n.key}>
                <a href={n.to} aria-current={route.page === n.key ? 'page' : undefined}>{n.label}</a>
              </li>
            ))}
          </ul>
        </nav>
        <button type="button" className="theme-toggle" onClick={toggle} aria-pressed={theme === 'dark'} aria-label={theme === 'dark' ? 'dark theme on; switch to light' : 'dark theme off; switch to dark'}>
          <span aria-hidden="true">{theme === 'dark' ? 'dark' : 'light'}</span>
        </button>
      </div>
    </header>
  );
}

export function LiveNote({ live, detail }: { live: LiveStatus; detail: string }) {
  if (live === 'idle' || live === 'loading') return <p className="live-note" role="status">bundled issue shown; checking github for more issues…</p>;
  if (live === 'unavailable') return <p className="live-note" role="status">live index unavailable ({detail}); showing bundled data.</p>;
  return <p className="live-note" role="status">live index checked: {detail}.</p>;
}

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="wrap">
        <p>this site only reads public data. community built, not an official imd site.</p>
      </div>
    </footer>
  );
}
