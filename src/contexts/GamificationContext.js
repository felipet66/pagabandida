import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useMaintenanceNotice } from "./MaintenanceNoticeContext";
import { dailyCheckin, gamificationApi, GAMIFICATION_EVENT, getGamificationSession } from "../services/gamificationApi";
import GamificationFeedback from "../components/Gamification/GamificationFeedback";

const GamificationContext = createContext(null);
export const useGamificationContext = () => useContext(GamificationContext);
const reasons = { lesson_watched: "Aula concluída", bankroll_configured: "Banca configurada", checkin: "Visita diária" };

export function makeCelebrations(profile, result) {
  const entries = [...(profile?.pending || [])];
  if (result?.leveledUp) entries.push({ type: "level_up", level: result.level });
  (result?.unlocked || []).forEach(id => entries.push({ type: "achievement", id }));
  const queue = entries.map(entry => {
    if (entry.type === "level_up") return { key: `level:${entry.level}`, icon: "star", title: `Você chegou ao nível ${entry.level}!`, text: profile?.level === entry.level ? profile.levelName : "Continue aprendendo e construindo bons hábitos." };
    if (entry.type !== "achievement") return null;
    const achievement = profile?.achievements?.find(item => item.id === entry.id);
    return { key: `achievement:${entry.id}`, icon: achievement?.icon, title: achievement?.name || "Conquista desbloqueada!", text: achievement?.description || "Mais um passo no seu aprendizado." };
  }).filter(Boolean);
  if (result && !result.alreadyCheckedIn && [7, 30].includes(result.streak?.current)) queue.push({ key: `streak:${result.streak.current}`, icon: "flame", title: `${result.streak.current} dias seguidos!`, text: "Seu hábito merece esse selo. Volte amanhã para continuar." });
  return queue;
}

export function GamificationProvider({ children }) {
  const location = useLocation();
  const { maintenanceAcknowledged } = useMaintenanceNotice();
  const [session, setSession] = useState(getGamificationSession);
  const [profile, setProfile] = useState(null);
  const [revision, setRevision] = useState(0);
  const [queue, setQueue] = useState([]);
  const [toast, setToast] = useState(null);
  const queued = useRef(new Set());
  const pendingSeen = useRef(false);
  const generation = useRef(0);
  const toastTimer = useRef(null);
  const busy = useRef(false);
  const queueRef = useRef([]);

  const enqueue = useCallback(entries => {
    const next = entries.filter(entry => { if (queued.current.has(entry.key)) return false; queued.current.add(entry.key); return true; });
    queueRef.current = [...queueRef.current, ...next];
    setQueue(queueRef.current);
  }, []);
  const notifyXp = useCallback((result, action) => {
    if (!(result?.xpEarned > 0)) return;
    clearTimeout(toastTimer.current);
    setToast({ xp: result.xpEarned, reason: reasons[action] || "Aprendizado" });
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  }, []);
  const refreshProfile = useCallback(async (result, expectedGeneration = generation.current) => {
    let next = null;
    try { next = await gamificationApi.me(); } catch { /* Only the screen reports loading errors. */ }
    if (generation.current !== expectedGeneration) return;
    if (next) {
      setProfile(next);
      if (next.pending?.length) pendingSeen.current = true;
    }
    const celebrations = makeCelebrations(next, result);
    if (celebrations.length) pendingSeen.current = true;
    enqueue(celebrations);
    setRevision(value => value + 1);
  }, [enqueue]);
  const closeCelebration = useCallback(() => {
    queueRef.current = queueRef.current.slice(1);
    setQueue(queueRef.current);
    if (!queueRef.current.length && pendingSeen.current) {
      pendingSeen.current = false;
      const expectedGeneration = generation.current;
      gamificationApi.seen().then(success => { if (!success && generation.current === expectedGeneration) pendingSeen.current = true; });
    }
  }, []);

  useEffect(() => { setSession(getGamificationSession()); }, [location]);
  useEffect(() => {
    generation.current += 1;
    const expectedGeneration = generation.current;
    setProfile(null); setQueue([]); setToast(null); queueRef.current = []; queued.current.clear(); pendingSeen.current = false; busy.current = false;
    clearTimeout(toastTimer.current);
    const check = async (initial = false) => {
      const currentSession = getGamificationSession();
      if (currentSession !== session) { setSession(currentSession); return; }
      if (!session) { dailyCheckin(null); return; }
      if (busy.current) return;
      busy.current = true;
      const result = await dailyCheckin(session);
      if (generation.current !== expectedGeneration) return;
      if (result) notifyXp(result, "checkin");
      if (initial || result) await refreshProfile(result, expectedGeneration);
      if (generation.current === expectedGeneration) busy.current = false;
    };
    check(true);
    const onVisible = () => { if (document.visibilityState !== "hidden") check(); };
    const timer = setInterval(onVisible, 60000);
    const onEarned = event => {
      if (!session || getGamificationSession() !== session) return;
      notifyXp(event.detail.result, event.detail.action);
      refreshProfile(event.detail.result, expectedGeneration);
    };
    window.addEventListener(GAMIFICATION_EVENT, onEarned);
    window.addEventListener("focus", onVisible);
    window.addEventListener("storage", onVisible);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      generation.current += 1;
      clearInterval(timer); clearTimeout(toastTimer.current);
      window.removeEventListener(GAMIFICATION_EVENT, onEarned);
      window.removeEventListener("focus", onVisible);
      window.removeEventListener("storage", onVisible);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [session, notifyXp, refreshProfile]);

  const acceptProfile = useCallback(next => {
    setProfile(next);
    if (next.pending?.length) pendingSeen.current = true;
    enqueue(makeCelebrations(next));
  }, [enqueue]);
  return <GamificationContext.Provider value={{ profile, revision, acceptProfile, session }}>
    {children}
    <GamificationFeedback toast={toast} celebration={queue[0]} onClose={closeCelebration} enabled={Boolean(session && maintenanceAcknowledged)} />
  </GamificationContext.Provider>;
}
