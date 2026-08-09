import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useSessions } from '@/features/settings/hooks/useSessions';
import { createWrapper } from '../../../helpers/createWrapper';

vi.mock('@/lib/api', () => ({
  apiClient: { get: vi.fn() },
}));

import { apiClient } from '@/lib/api';
const mockGet = vi.mocked(apiClient.get);

const stubSessions = [
  {
    id: 'session-1',
    device: 'Chrome · Windows',
    createdAt: '2026-01-02T00:00:00.000Z',
    current: true,
  },
  {
    id: 'session-2',
    device: 'Safari · Mac',
    createdAt: '2026-01-01T00:00:00.000Z',
    current: false,
  },
];

describe('useSessions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches /api/sessions', async () => {
    mockGet.mockResolvedValue({ success: true, data: stubSessions });

    const { result } = renderHook(() => useSessions(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.data).toEqual(stubSessions));
    expect(mockGet).toHaveBeenCalledWith('/api/sessions');
  });
});
