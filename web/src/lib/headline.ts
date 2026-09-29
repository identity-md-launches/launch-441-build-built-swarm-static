import type { IssueRecord } from '../types';
import { metricValue } from '../types';

export interface Headline { key: string; label: string; value: number | null; note?: string }

// The five headline numbers, in the issue's order.
export function headlines(r: IssueRecord): Headline[] {
  const d = r.data;
  const launches24 = Array.isArray(d.launches?.last24h) ? d.launches.last24h.length : null;
  return [
    { key: 'seats', label: 'seats online', value: metricValue(d.network?.connectedDaemons) },
    { key: 'worked', label: 'seats that worked in 24h', value: metricValue(d.seats?.active24h), note: d.seats?.active24h?.note },
    { key: 'launches', label: 'launches opened in 24h', value: launches24 },
    { key: 'attested', label: 'oracle requests attested in 24h', value: metricValue(d.oracle?.attestedLast24h) },
    { key: 'schedules', label: 'active schedules', value: metricValue(d.schedules?.active) },
  ];
}

export const fmt = (n: number | null): string => (n === null ? 'not exposed' : n.toLocaleString('en-US'));
