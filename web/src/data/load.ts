// Data loading: bundled issues first (./data/index.json), then discovery of more issues
// from GitHub (search API -> raw.githubusercontent.com), merged by date and cached in memory.
import type { IssueData, IssueRecord, SiteConfig } from '../types';

export type LiveStatus = 'idle' | 'loading' | 'ok' | 'unavailable';

const DEFAULT_CONFIG: SiteConfig = { githubOrg: 'identity-md-launches', repoPrefix: 'swarm-daily', communityLinks: [] };

const cache: { config?: SiteConfig; bundled?: IssueRecord[]; live?: { status: LiveStatus; issues: IssueRecord[]; detail: string } } = {};

async function getJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, cache: 'no-store' });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return (await res.json()) as T;
}

async function getText(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { cache: 'no-store' });
    return res.ok ? await res.text() : null;
  } catch {
    return null;
  }
}

export async function loadConfig(): Promise<SiteConfig> {
  if (cache.config) return cache.config;
  try {
    const c = await getJson<Partial<SiteConfig>>('./config.json');
    cache.config = {
      githubOrg: typeof c.githubOrg === 'string' && c.githubOrg ? c.githubOrg : DEFAULT_CONFIG.githubOrg,
      repoPrefix: typeof c.repoPrefix === 'string' && c.repoPrefix ? c.repoPrefix : DEFAULT_CONFIG.repoPrefix,
      communityLinks: Array.isArray(c.communityLinks) ? c.communityLinks : [],
    };
  } catch {
    cache.config = DEFAULT_CONFIG;
  }
  return cache.config;
}

const isDate = (s: unknown): s is string => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);

async function loadIssueAt(base: string, date: string, origin: IssueRecord['origin'], repo?: string): Promise<IssueRecord | null> {
  try {
    const data = await getJson<IssueData>(`${base}data.json`);
    const markdown = await getText(`${base}issue.md`);
    const number = typeof data?.issue?.number === 'number' ? data.issue.number : null;
    return { date, number, origin, base, repo, data: data ?? {}, markdown };
  } catch {
    return null;
  }
}

export async function loadBundled(): Promise<IssueRecord[]> {
  if (cache.bundled) return cache.bundled;
  let dates: string[] = [];
  try {
    const idx = await getJson<{ issues?: { date?: string }[] }>('./data/index.json');
    dates = (idx.issues ?? []).map((i) => i.date).filter(isDate);
  } catch {
    dates = [];
  }
  const records = await Promise.all(dates.map((d) => loadIssueAt(`./data/${d}/`, d, 'bundled')));
  cache.bundled = records.filter((r): r is IssueRecord => r !== null);
  return cache.bundled;
}

export interface LiveResult { status: LiveStatus; issues: IssueRecord[]; detail: string }

export async function discoverGitHub(config: SiteConfig, known: Set<string>): Promise<LiveResult> {
  if (cache.live) return cache.live;
  const q = encodeURIComponent(`${config.repoPrefix} in:name org:${config.githubOrg}`);
  let repos: string[] = [];
  try {
    const res = await fetch(`https://api.github.com/search/repositories?q=${q}&per_page=100&sort=updated`, {
      headers: { Accept: 'application/vnd.github+json' },
      cache: 'no-store',
    });
    if (res.status === 403 || res.status === 429) {
      cache.live = { status: 'unavailable', issues: [], detail: 'github search rate limit reached' };
      return cache.live;
    }
    if (!res.ok) {
      cache.live = { status: 'unavailable', issues: [], detail: `github search returned ${res.status}` };
      return cache.live;
    }
    const body = (await res.json()) as { items?: { name?: string; full_name?: string }[] };
    repos = (body.items ?? [])
      .map((r) => r.full_name ?? '')
      .filter((n) => n.toLowerCase().startsWith(`${config.githubOrg.toLowerCase()}/`) && n.split('/')[1]?.startsWith(config.repoPrefix));
  } catch {
    cache.live = { status: 'unavailable', issues: [], detail: 'network unavailable' };
    return cache.live;
  }

  const found: IssueRecord[] = [];
  await Promise.all(
    repos.map(async (full) => {
      const raw = `https://raw.githubusercontent.com/${full}/HEAD/`;
      try {
        const idx = await getJson<{ issues?: { date?: string }[] }>(`${raw}data/index.json`);
        const dates = (idx.issues ?? []).map((i) => i.date).filter(isDate).filter((d) => !known.has(d));
        const recs = await Promise.all(dates.map((d) => loadIssueAt(`${raw}data/${d}/`, d, 'github', full)));
        for (const r of recs) if (r) found.push(r);
      } catch {
        /* a repository without data/index.json is not an issue repository */
      }
    }),
  );
  cache.live = { status: 'ok', issues: found, detail: `${repos.length} ${repos.length === 1 ? 'repository' : 'repositories'} checked` };
  return cache.live;
}

// Merge by date; bundled records win over remote ones for the same date.
export function mergeIssues(bundled: IssueRecord[], remote: IssueRecord[]): IssueRecord[] {
  const byDate = new Map<string, IssueRecord>();
  for (const r of remote) byDate.set(r.date, r);
  for (const r of bundled) byDate.set(r.date, r);
  return [...byDate.values()].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}
