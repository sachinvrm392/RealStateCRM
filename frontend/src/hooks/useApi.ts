import { useState, useCallback } from 'react';
import { useSnackbar } from 'notistack';

export const useApi = <T,>(apiFunc: (...args: any[]) => Promise<any>) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { enqueueSnackbar } = useSnackbar();

  const execute = useCallback(async (...args: any[]) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFunc(...args);
      setData(response.data);
      return response.data;
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || err.message || 'An error occurred';
      setError(errMsg);
      enqueueSnackbar(errMsg, { variant: 'error' });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiFunc, enqueueSnackbar]);

  return { data, loading, error, execute };
};
