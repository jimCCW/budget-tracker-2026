import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useExportActivity } from '@/features/activity/hooks/useExportActivity';
import { createWrapper } from '../../../helpers/createWrapper';
import type { ActivityFilters } from '@/features/activity/types/activity';

vi.mock('@/lib/api', () => ({
  apiClient: { get: vi.fn() },
}));

import { apiClient } from '@/lib/api';
const mockGet = vi.mocked(apiClient.get);

const filters: ActivityFilters = { type: 'ALL' };

describe('useExportActivity', () => {
  let createObjectURL: ReturnType<typeof vi.fn>;
  let revokeObjectURL: ReturnType<typeof vi.fn>;
  let clickSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    createObjectURL = vi.fn(() => 'blob:mock-url');
    revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL,
      revokeObjectURL,
    });
    clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    clickSpy.mockRestore();
  });

  it('requests /api/activity/export as a blob with the given filters', async () => {
    const blob = new Blob(['dummy'], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    mockGet.mockResolvedValue(blob);

    const { result } = renderHook(() => useExportActivity(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({ ...filters, categoryId: 'cat-1' });
    });

    expect(mockGet).toHaveBeenCalledWith('/api/activity/export', {
      params: { type: 'ALL', categoryId: 'cat-1' },
      responseType: 'blob',
    });
  });

  it('triggers a browser download of the returned blob on success', async () => {
    const blob = new Blob(['dummy']);
    mockGet.mockResolvedValue(blob);

    const { result } = renderHook(() => useExportActivity(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync(filters);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(createObjectURL).toHaveBeenCalledWith(blob);
    expect(clickSpy).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });

  it('parses a JSON error message out of a Blob error response', async () => {
    const errorBlob = new Blob(
      [JSON.stringify({ error: { message: 'No matching records' } })],
      { type: 'application/json' }
    );
    mockGet.mockRejectedValue({ response: { data: errorBlob } });

    const { result } = renderHook(() => useExportActivity(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      try {
        await result.current.mutateAsync(filters);
      } catch {
        // expected
      }
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('No matching records');
  });

  it('falls back to a generic message when the error blob is not valid JSON', async () => {
    const errorBlob = new Blob(['not json'], { type: 'text/plain' });
    mockGet.mockRejectedValue({ response: { data: errorBlob } });

    const { result } = renderHook(() => useExportActivity(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      try {
        await result.current.mutateAsync(filters);
      } catch {
        // expected
      }
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Export failed.');
  });

  it('rethrows non-blob errors unchanged', async () => {
    mockGet.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useExportActivity(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      try {
        await result.current.mutateAsync(filters);
      } catch {
        // expected
      }
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Network error');
  });
});
