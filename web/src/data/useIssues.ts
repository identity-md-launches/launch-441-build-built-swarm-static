import { useEffect, useState } from 'react';
import type { IssueRecord, SiteConfig } from '../types';
import { discoverGitHub, loadBundled, loadConfig, mergeIssues, type LiveStatus } from './load';

export interface IssuesState {
  config: SiteConfig | null;
  issues: IssueRecord[];
  bundledReady: boolean;
  live: LiveStatus;
  liveDetail: string;
}

let shared: IssuesState | null = null;
const listeners = new Set<(s: IssuesState) => void>();
const emit = (s: IssuesState) => {
  shared = s;
  listeners.forEach((l) => l(s));
};

let started = false;
async function start() {
  if (started) return;
  started = true;
  let state: IssuesState = { config: null, issues: [], bundledReady: false, live: 'idle', liveDetail: '' };
  emit(state);
  const [config, bundled] = await Promise.all([loadConfig(), loadBundled()]);
  state = { ...state, config, issues: mergeIssues(bundled, []), bundledReady: true, live: 'loading' };
  emit(state);
  const live = await discoverGitHub(config, new Set(bundled.map((b) => b.date)));
  state = { ...state, issues: mergeIssues(bundled, live.issues), live: live.status, liveDetail: live.detail };
  emit(state);
}

export function useIssues(): IssuesState {
  const [state, setState] = useState<IssuesState>(() => shared ?? { config: null, issues: [], bundledReady: false, live: 'idle', liveDetail: '' });
  useEffect(() => {
    listeners.add(setState);
    if (shared) setState(shared);
    void start();
    return () => {
      listeners.delete(setState);
    };
  }, []);
  return state;
}
