import { useCallback, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';
const KEY = 'bbts-theme';

const systemTheme = (): Theme => (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

const stored = (): Theme | null => {
  try {
    const t = localStorage.getItem(KEY);
    return t === 'light' || t === 'dark' ? t : null;
  } catch {
    return null;
  }
};

// Theme switch: suppress transitions for the swap, force a reflow, restore next frame.
function applyTheme(t: Theme | null) {
  const style = document.createElement('style');
  style.textContent = '*,*::before,*::after{transition:none !important}';
  document.head.appendChild(style);
  if (t) document.documentElement.dataset.theme = t;
  else delete document.documentElement.dataset.theme;
  void document.documentElement.offsetHeight;
  requestAnimationFrame(() => style.remove());
}

export function useTheme(): { theme: Theme; explicit: boolean; toggle: () => void } {
  const [explicit, setExplicit] = useState<Theme | null>(() => stored());
  const [system, setSystem] = useState<Theme>(() => systemTheme());

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => setSystem(systemTheme());
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const theme = explicit ?? system;

  const toggle = useCallback(() => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* private mode: keep in memory only */
    }
    applyTheme(next);
    setExplicit(next);
  }, [theme]);

  return { theme, explicit: explicit !== null, toggle };
}
