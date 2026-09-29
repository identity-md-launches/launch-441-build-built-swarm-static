import { useEffect } from 'react';
import { Footer, Header } from './components/Chrome';
import { useIssues } from './data/useIssues';
import { useRoute } from './lib/router';
import { Built } from './pages/Built';
import { Changelog } from './pages/Changelog';
import { Issue } from './pages/Issue';
import { Numbers } from './pages/Numbers';

export default function App() {
  const route = useRoute();
  const state = useIssues();

  // SPA route change: move focus to the main landmark and title the document.
  useEffect(() => {
    const titles = { built: 'built', issue: 'issue', changelog: 'changelog', numbers: 'numbers' } as const;
    document.title = `${titles[route.page]} · built by the swarm`;
    const main = document.getElementById('main');
    if (main && document.activeElement !== document.body) main.focus({ preventScroll: true });
  }, [route.page]);

  return (
    <>
      <Header route={route} />
      <main id="main" className="wrap" tabIndex={-1}>
        {route.page === 'built' ? <Built state={state} kind={route.kind} /> : null}
        {route.page === 'issue' ? <Issue state={state} date={route.date} /> : null}
        {route.page === 'changelog' ? <Changelog state={state} /> : null}
        {route.page === 'numbers' ? <Numbers state={state} /> : null}
      </main>
      <Footer />
    </>
  );
}
