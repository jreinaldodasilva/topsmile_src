import { renderHook, act } from '@testing-library/react';
import { useApiState } from '../../hooks/useApiState';

describe('useApiState', () => {
  it('initializes with default state', () => {
    const { result } = renderHook(() => useApiState());

    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('initializes with provided initial data', () => {
    const initialData = { test: 'data' };
    const { result } = renderHook(() => useApiState(initialData));

    expect(result.current.data).toEqual(initialData);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('handles successful API call', async () => {
    const mockApiCall = jest.fn().mockResolvedValue({ success: true });
    const { result } = renderHook(() => useApiState());

    await act(async () => {
      const response = await result.current.execute(mockApiCall);
      expect(response).toEqual({ success: true });
    });

    expect(result.current.data).toEqual({ success: true });
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('handles API call error', async () => {
    const mockApiCall = jest.fn().mockRejectedValue(new Error('API Error'));
    const { result } = renderHook(() => useApiState());

    await act(async () => {
      const response = await result.current.execute(mockApiCall);
      expect(response).toBeNull();
    });

    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('API Error');
  });

  it('resets state', () => {
    const { result } = renderHook(() => useApiState<any>({ initial: 'data' }));

    act(() => {
      result.current.setData({ new: 'data' });
      result.current.setError('Test error');
    });

    expect(result.current.data).toEqual({ new: 'data' });
    expect(result.current.error).toBe('Test error');

    act(() => {
      result.current.reset();
    });

    expect(result.current.data).toEqual({ initial: 'data' });
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('sets data manually', () => {
    const { result } = renderHook(() => useApiState());

    act(() => {
      result.current.setData({ manual: 'data' });
    });

    expect(result.current.data).toEqual({ manual: 'data' });
  });

  it('sets error manually', () => {
    const { result } = renderHook(() => useApiState());

    act(() => {
      result.current.setError('Manual error');
    });

    expect(result.current.error).toBe('Manual error');
  });
});
