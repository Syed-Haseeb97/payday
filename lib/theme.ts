export type Theme = 'dark' | 'light';
const KEY = 'payday-theme';

/** Theme preference is the only thing Payday stores in localStorage. */
export function readTheme(): Theme {
  try {
    if (typeof window === 'undefined') return 'light';
    const v = window.localStorage.getItem(KEY);
    return v === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export function writeTheme(theme: Theme): void {
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(KEY, theme);
    }
  } catch {
    /* storage unavailable: preference lasts for this session only */
  }
}

export function applyTheme(theme: Theme): void {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.theme = theme;
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}
