import { useCallback, useEffect, useState } from "react";

export type UseApiResult<T> = {
  data: T | null;
  error: string | null;
  isLoading: boolean;
  status: number | null;
  retry: () => void;
};

export function useApi<T>(url: string | null): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(url));
  const [status, setStatus] = useState<number | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const retry = useCallback(() => setRetryKey((key) => key + 1), []);

  useEffect(() => {
    if (!url) {
      setData(null);
      setError(null);
      setIsLoading(false);
      setStatus(null);
      return;
    }

    let cancelled = false;

    const run = async () => {
      setIsLoading(true);
      setError(null);
      setStatus(null);

      try {
        const response = await fetch(url);
        if (cancelled) {
          return;
        }
        setStatus(response.status);

        if (!response.ok) {
          let message = `Request failed (${response.status})`;
          try {
            const body = (await response.json()) as { message?: string };
            if (body.message) {
              message = body.message;
            }
          } catch {
            // ignore JSON parse errors for non-JSON error bodies
          }
          setData(null);
          setError(message);
          return;
        }

        const json = (await response.json()) as T;
        if (!cancelled) {
          setData(json);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setData(null);
          setStatus(null);
          setError(
            err instanceof Error ? err.message : "Network request failed",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [url, retryKey]);

  return { data, error, isLoading, status, retry };
}
