import { describe, it, expect, beforeEach } from 'vitest';
import { useUiStore } from './uiStore';

describe('uiStore', () => {
  beforeEach(() => {
    // 每次測試前重設狀態
    useUiStore.setState({ locale: 'zh-TW', theme: 'light', sidebarOpen: false });
    localStorage.clear();
  });

  describe('locale', () => {
    it('初始 locale 為 zh-TW', () => {
      expect(useUiStore.getState().locale).toBe('zh-TW');
    });

    it('setLocale 更新 locale 並寫入 localStorage', () => {
      useUiStore.getState().setLocale('en');
      expect(useUiStore.getState().locale).toBe('en');
      expect(localStorage.getItem('app.locale')).toBe('en');
    });

    it('切換回 zh-TW', () => {
      useUiStore.getState().setLocale('en');
      useUiStore.getState().setLocale('zh-TW');
      expect(useUiStore.getState().locale).toBe('zh-TW');
    });
  });

  describe('sidebar', () => {
    it('初始 sidebarOpen 為 false', () => {
      expect(useUiStore.getState().sidebarOpen).toBe(false);
    });

    it('toggleSidebar 切換 open 狀態', () => {
      useUiStore.getState().toggleSidebar();
      expect(useUiStore.getState().sidebarOpen).toBe(true);
      useUiStore.getState().toggleSidebar();
      expect(useUiStore.getState().sidebarOpen).toBe(false);
    });

    it('setSidebarOpen 直接設定值', () => {
      useUiStore.getState().setSidebarOpen(true);
      expect(useUiStore.getState().sidebarOpen).toBe(true);
      useUiStore.getState().setSidebarOpen(false);
      expect(useUiStore.getState().sidebarOpen).toBe(false);
    });
  });

  describe('theme', () => {
    it('初始 theme 為 light', () => {
      expect(useUiStore.getState().theme).toBe('light');
    });

    it('setTheme 更新 theme 並寫入 localStorage', () => {
      useUiStore.getState().setTheme('dark');
      expect(useUiStore.getState().theme).toBe('dark');
      expect(localStorage.getItem('app.theme')).toBe('dark');
    });
  });
});
