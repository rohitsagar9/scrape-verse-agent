/**
 * lib/sse.js
 * ----------
 * React hook for consuming the SSE event stream from the heal agent.
 *
 * Usage:
 *   const { events, connected } = useSSE('http://localhost:8000/events');
 *
 * Falls back to polling /api/run-history every 5s if SSE is not available.
 */

import { useEffect, useRef, useState } from 'react';

const SSE_URL = process.env.NEXT_PUBLIC_SSE_URL || 'http://localhost:8000/events';
const POLL_INTERVAL_MS = 5000;

export function useSSE(url = SSE_URL) {
  const [events, setEvents] = useState([]);
  const [connected, setConnected] = useState(false);
  const esRef = useRef(null);

  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') return;

    let retryTimeout;

    function connect() {
      try {
        const es = new EventSource(url);
        esRef.current = es;

        es.onopen = () => {
          setConnected(true);
        };

        es.onmessage = (ev) => {
          if (!ev.data || ev.data.startsWith(':')) return; // skip heartbeats
          try {
            const parsed = JSON.parse(ev.data);
            setEvents(prev => [...prev.slice(-199), parsed]); // keep last 200
          } catch {
            // ignore malformed
          }
        };

        es.onerror = () => {
          setConnected(false);
          es.close();
          // Retry after 10s
          retryTimeout = setTimeout(connect, 10000);
        };
      } catch {
        setConnected(false);
      }
    }

    connect();

    return () => {
      clearTimeout(retryTimeout);
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
    };
  }, [url]);

  return { events, connected };
}

/**
 * Simple polling hook for when SSE is not available (static dashboard).
 * Polls a JSON endpoint every POLL_INTERVAL_MS.
 */
export function usePolling(fetchFn, intervalMs = POLL_INTERVAL_MS) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let timer;

    async function poll() {
      try {
        const result = await fetchFn();
        if (mounted) setData(result);
      } catch {
        // silent
      } finally {
        if (mounted) setLoading(false);
        timer = setTimeout(poll, intervalMs);
      }
    }

    poll();
    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, []);

  return { data, loading };
}
