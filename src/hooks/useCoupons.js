import { useCallback, useEffect, useRef, useState } from "react";
import { COUPON_PAGE_LIMIT, couponError, getCouponAttempt, listCouponRedemptions, listPendingCouponRewards, redeemCoupon } from "../services/couponsApi";

const loaders = { pending: listPendingCouponRewards, history: listCouponRedemptions };
export function useCouponList(kind, active) {
  const [query, setQuery] = useState({ offset: 0, revision: 0 });
  const [state, setState] = useState(null);
  const key = `${query.offset}:${query.revision}`;
  useEffect(() => {
    if (!active) return;
    const controller = new AbortController();
    setState({ key, loading: true, items: [], error: null, hasMore: false, total: null });
    loaders[kind](query.offset, controller.signal).then(result => {
      if (!controller.signal.aborted) setState({ ...result, key, loading: false, error: null });
    }).catch(error => {
      if (!controller.signal.aborted) setState({ key, loading: false, items: [], error: couponError(error), hasMore: false, total: null });
    });
    return () => controller.abort();
  }, [kind, active, query.offset, key]);
  const reload = useCallback(() => setQuery(previous => ({ offset: 0, revision: previous.revision + 1 })), []);
  const retry = useCallback(() => setQuery(previous => ({ ...previous, revision: previous.revision + 1 })), []);
  const page = useCallback(offset => setQuery(previous => ({ ...previous, offset: Math.max(0, offset) })), []);
  return { items: [], hasMore: false, total: null, error: null, ...state,
    loading: active && (!state || state.key !== key || state.loading), offset: query.offset, limit: COUPON_PAGE_LIMIT, reload, retry, page };
}

export function useCouponRedemption(onSuccess) {
  const [state, setState] = useState({ loading: false, error: null, result: null });
  const busy = useRef(false);
  const request = useRef(null);
  const mounted = useRef(false);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; request.current?.abort(); }; }, []);
  const resetFeedback = useCallback(() => { if (!busy.current) setState({ loading: false, error: null, result: null }); }, []);
  const submit = useCallback(async code => {
    if (busy.current) return;
    busy.current = true;
    const controller = new AbortController();
    request.current = controller;
    const session = localStorage.getItem("access_token");
    setState({ loading: true, error: null, result: null });
    try {
      const attempt = getCouponAttempt(code);
      const result = await redeemCoupon(attempt, controller.signal);
      if (!mounted.current || controller.signal.aborted || session !== localStorage.getItem("access_token")) return;
      setState({ loading: false, error: null, result });
      onSuccess();
      window.dispatchEvent(new Event("wallet-balance-updated"));
    } catch (failure) {
      const error = couponError(failure);
      if (mounted.current && !controller.signal.aborted && (session === localStorage.getItem("access_token") || error.authRequired)) setState({ loading: false, error, result: null });
    } finally {
      busy.current = false;
      if (request.current === controller) request.current = null;
    }
  }, [onSuccess]);
  return { ...state, submit, resetFeedback };
}
