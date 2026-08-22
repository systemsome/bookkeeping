export type ThemeMode = 'light' | 'dark' | 'system';

const THEME_STORAGE_KEY = 'asset_manager_theme_mode_v1';

export const getStoredThemeMode = (): ThemeMode => {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'light' || saved === 'dark' || saved === 'system') {
      return saved;
    }
  } catch {
    // fallback
  }
  return 'system';
};

export const saveThemeMode = (mode: ThemeMode) => {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch {
    // ignore
  }
};

export const applyThemeToDocument = (mode: ThemeMode) => {
  const root = document.documentElement;
  const isDark =
    mode === 'dark' ||
    (mode === 'system' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);

  if (isDark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
};
