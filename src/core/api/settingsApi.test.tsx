import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTeamSettings } from './settingsApi';
import { supabase } from '@/core/supabase/client';
import React from 'react';

// Mock supabase client
vi.mock('@/core/supabase/client', () => {
  const selectMock = vi.fn();
  const eqMock = vi.fn();
  const singleMock = vi.fn();
  
  const fromMock = vi.fn().mockReturnValue({
    select: selectMock.mockReturnValue({
      eq: eqMock.mockReturnValue({
        single: singleMock
      })
    })
  });

  return {
    supabase: {
      from: fromMock,
    },
    // Expose mocks to be configured in tests
    __mocks: { selectMock, eqMock, singleMock }
  };
});

// Create a wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('settingsApi hooks', () => {
  let __mocks: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    const clientModule = await import('@/core/supabase/client');
    __mocks = (clientModule as any).__mocks;
  });

  describe('useTeamSettings', () => {
    it('should fetch settings successfully', async () => {
      const mockData = { team_id: '123', nav_order: ['home'], nav_hidden: [] };
      __mocks.singleMock.mockResolvedValueOnce({ data: mockData, error: null });

      const { result } = renderHook(() => useTeamSettings(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      
      expect(result.current.data).toEqual(mockData);
      expect(supabase.from).toHaveBeenCalledWith('team_settings');
    });

    it('should handle PGRST116 (not found) by returning null', async () => {
      __mocks.singleMock.mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } });

      const { result } = renderHook(() => useTeamSettings(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      
      expect(result.current.data).toBeNull();
    });

    it('should throw error for other errors', async () => {
      __mocks.singleMock.mockResolvedValueOnce({ data: null, error: { code: 'UNKNOWN_ERR', message: 'Fail' } });

      const { result } = renderHook(() => useTeamSettings(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));
      
      expect(result.current.error?.message).toBe('Fail');
    });
  });
});
