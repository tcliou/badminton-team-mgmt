import { create } from 'zustand';

export type Locale = 'zh-TW' | 'en';
export type Theme = 'light' | 'dark';

interface UiState {
  locale: Locale;
  theme: Theme;
  sidebarOpen: boolean;
  setLocale: (locale: Locale) => void;
  setTheme: (theme: Theme) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

const LOCALE_KEY = 'app.locale';
const THEME_KEY = 'app.theme';

const initialLocale: Locale =
  ((typeof window !== 'undefined' && (localStorage.getItem(LOCALE_KEY) as Locale)) || 'zh-TW') ===
  'en'
    ? 'en'
    : 'zh-TW';

const initialTheme: Theme =
  (typeof window !== 'undefined' && (localStorage.getItem(THEME_KEY) as Theme)) === 'dark'
    ? 'dark'
    : 'light';

export const useUiStore = create<UiState>((set) => ({
  locale: initialLocale,
  theme: initialTheme,
  sidebarOpen: false,
  setLocale: (locale) => {
    if (typeof window !== 'undefined') localStorage.setItem(LOCALE_KEY, locale);
    set({ locale });
  },
  setTheme: (theme) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(THEME_KEY, theme);
      document.documentElement.classList.toggle('dark', theme === 'dark');
    }
    set({ theme });
  },
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));
