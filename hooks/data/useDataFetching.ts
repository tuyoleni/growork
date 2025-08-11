import { useState, useCallback, useRef, useEffect } from 'react';

export interface FetchState<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  refreshing: boolean;
}

export interface FetchOptions {
  pollingInterval?: number;
  autoFetch?: boolean;
  refreshOnMount?: boolean;
}

export function useDataFetching<T>(
  fetchFunction: () => Promise<T[]>,
  options: FetchOptions = {}
) {
  const {
    pollingInterval,
    autoFetch = true,
    refreshOnMount = true
  } = options;

  const [state, setState] = useState<FetchState<T>>({
    data: [],
    loading: false,
    error: null,
    refreshing: false
  });

  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMounted = useRef(true);

  const fetchData = useCallback(async (refresh = false) => {
    if (!isMounted.current) return;

    try {
      if (refresh) {
        setState(prev => ({ ...prev, refreshing: true }));
      } else {
        setState(prev => ({ ...prev, loading: true }));
      }
      setState(prev => ({ ...prev, error: null }));

      const data = await fetchFunction();
      
      if (isMounted.current) {
        setState(prev => ({
          ...prev,
          data,
          loading: false,
          refreshing: false
        }));
      }
    } catch (err: any) {
      if (isMounted.current) {
        setState(prev => ({
          ...prev,
          error: err.message || 'An error occurred',
          loading: false,
          refreshing: false
        }));
      }
    }
  }, [fetchFunction]);

  const refresh = useCallback(() => fetchData(true), [fetchData]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Setup polling if interval is provided
  const setupPolling = useCallback(() => {
    if (!pollingInterval) return;

    // Clean up existing polling
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    // Start new polling
    pollingIntervalRef.current = setInterval(() => {
      fetchData();
    }, pollingInterval);
  }, [pollingInterval, fetchData]);

  // Initial fetch and setup
  useEffect(() => {
    if (autoFetch && refreshOnMount) {
      fetchData();
    }
    
    if (pollingInterval) {
      setupPolling();
    }

    return () => {
      // Cleanup polling on unmount
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [fetchData, setupPolling, autoFetch, refreshOnMount, pollingInterval]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, []);

  return {
    ...state,
    fetchData,
    refresh,
    clearError
  };
}
