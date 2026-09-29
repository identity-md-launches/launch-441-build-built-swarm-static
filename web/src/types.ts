// Types for data/<date>/data.json. Every field is optional at the type level because
// later issues come from other jobs and the site must tolerate missing fields.

export type Kind =
  | 'token' | 'contracts' | 'hook' | 'report' | 'website' | 'image' | 'audio' | 'video'
  | 'oracle' | 'heartbeat' | 'community';

export const KINDS: Kind[] = ['token', 'contracts', 'hook', 'report', 'website', 'image', 'audio', 'video', 'oracle', 'heartbeat', 'community'];

export interface Metric {
  value: number | string | boolean | null;
  source?: string;
  readAt?: string;
  note?: string;
}

export interface Media {
  type?: 'screenshot' | 'image' | 'video' | 'audio' | 'none' | string;
  src?: string | null;
  poster?: string | null;
  note?: string;
}

export interface Links {
  site?: string | null;
  repo?: string | null;
  launch?: string | null;
  job?: string | null;
  cid?: string | null;
  oracle?: string | null;
  schedule?: string | null;
}

export interface GalleryItem {
  id?: string;
  name?: string;
  kind?: Kind | string;
  at?: string;
  asked?: string;
  built?: string;
  media?: Media;
  links?: Links;
  extra?: Record<string, unknown>;
}

export interface DatedEntry {
  date?: string;
  kind?: string;
  title?: string;
  detail?: string;
  url?: string;
}

export interface Changelog {
  baselineAsOf?: string;
  baselineNote?: string;
  docsToc?: string[];
  docsRoutes?: string[];
  paidActions?: string[];
  skills?: { id?: string; version?: number; role?: string }[];
  versionFeatures?: string[];
  versionCommit?: string;
  services?: { kind?: string; version?: string; up?: boolean }[];
  workerRelease?: { tag?: string; name?: string; publishedAt?: string; url?: string; notes?: string[] };
  dated?: DatedEntry[];
}

export interface IssueData {
  issue?: { date?: string; number?: number; title?: string; windowStart?: string; windowEnd?: string; generatedAt?: string };
  network?: {
    connectedDaemons?: Metric; activeEnrollments?: Metric; workingNow?: Metric; acceptedLastDay?: Metric;
    pendingFeedback?: Metric; deployBreaker?: Metric;
    payments?: { quoted?: Metric; paid?: Metric; expired?: Metric; failed?: Metric };
  };
  launches?: { highestNumber?: Metric; byStatus?: Record<string, Metric>; last24h?: unknown[]; parkedReasons?: { reason?: string; count?: number }[] };
  policies?: { version?: number; kind?: string; note?: string; createdAt?: string }[];
  jobs?: { last24hTotal?: Metric; last24hByKind?: Record<string, Metric>; createdBySchedule?: Metric };
  oracle?: { last24hByStatus?: Record<string, Metric>; attestedLast24h?: Metric; galleryRest?: Metric; exampleQuestions?: string[]; models?: string[] };
  schedules?: { active?: Metric; items?: { label?: string | null; action?: string; cadence?: string; runsRemaining?: number; status?: string }[] };
  seats?: { active24h?: Metric; active7d?: Metric; everWorked?: Metric; top5?: { tokenId?: string; accepted?: number }[]; top5Share?: Metric; top20Share?: Metric };
  changelog?: Changelog;
  briefs?: unknown;
  gallery?: GalleryItem[];
  sources?: { url?: string; readAt?: string }[];
}

export interface IssueRecord {
  date: string;
  number: number | null;
  origin: 'bundled' | 'github';
  base: string; // URL prefix where media/ paths resolve
  repo?: string;
  data: IssueData;
  markdown: string | null;
}

export interface CommunityLink { name?: string; url?: string; oneLiner?: string }
export interface SiteConfig { githubOrg: string; repoPrefix: string; communityLinks: CommunityLink[] }

export const metricValue = (m: Metric | undefined | null): number | null => {
  if (!m || m.value === null || m.value === undefined) return null;
  const n = typeof m.value === 'number' ? m.value : Number(m.value);
  return Number.isFinite(n) ? n : null;
};
