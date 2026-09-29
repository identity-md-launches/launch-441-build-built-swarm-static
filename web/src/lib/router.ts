import { useEffect, useState } from 'react';

export type Route =
  | { page: 'built'; kind: string | null }
  | { page: 'issue'; date: string | null }
  | { page: 'changelog' }
  | { page: 'numbers' };

export function parseHash(hash: string): Route {
  const raw = hash.replace(/^#/, '');
  const [pathPart, query = ''] = raw.split('?');
  const segs = (pathPart ?? '').split('/').filter(Boolean);
  const params = new URLSearchParams(query);
  switch (segs[0]) {
    case 'issue':
      return { page: 'issue', date: segs[1] ?? null };
    case 'changelog':
      return { page: 'changelog' };
    case 'numbers':
      return { page: 'numbers' };
    default:
      return { page: 'built', kind: params.get('kind') };
  }
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));
  useEffect(() => {
    const onChange = () => setRoute(parseHash(window.location.hash));
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}

export const href = {
  built: (kind?: string | null) => (kind ? `#/?kind=${encodeURIComponent(kind)}` : '#/'),
  issue: (date?: string | null) => (date ? `#/issue/${date}` : '#/issue'),
  changelog: '#/changelog',
  numbers: '#/numbers',
};
