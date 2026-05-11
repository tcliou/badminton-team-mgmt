import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import './index.css';
import './core/i18n/init';
import { AuthProvider } from './core/auth/AuthProvider';
import { useUiStore } from './core/store/uiStore';

// 啟動時把目前主題套到 <html>，避免暗色模式刷新時 FOUC
if (typeof document !== 'undefined') {
  document.documentElement.classList.toggle('dark', useUiStore.getState().theme === 'dark');
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const basename = (import.meta.env.VITE_BASE_PATH || '/').replace(/\/$/, '') || '/';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter basename={basename}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
