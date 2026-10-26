import { useCallback, useEffect, useRef, useState } from "react";
import { abortError, getTurnstileToken } from "../services/turnstile";

export default function useTurnstile() {
  const containerRef = useRef(null);
  const operations = useRef(new Set());
  const mounted = useRef(true);
  const [checking, setChecking] = useState(false);
  useEffect(() => {
    mounted.current = true;
    const active = operations.current;
    return () => { mounted.current = false; active.forEach(controller => controller.abort()); active.clear(); };
  }, []);
  const getToken = useCallback(async ({ action, signal }) => {
    if (!mounted.current || signal?.aborted) throw abortError();
    const controller = new AbortController();
    const cancel = () => controller.abort();
    signal?.addEventListener("abort", cancel, { once: true });
    operations.current.add(controller);
    setChecking(true);
    try {
      return await getTurnstileToken({ container: containerRef.current, action, signal: controller.signal });
    } finally {
      signal?.removeEventListener("abort", cancel);
      operations.current.delete(controller);
      if (mounted.current) setChecking(operations.current.size > 0);
    }
  }, []);
  return { containerRef, getToken, checking };
}
