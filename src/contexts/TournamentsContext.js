import React, { createContext, useCallback, useContext, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listTournaments } from "../services/tournamentsApi";

const TournamentsContext = createContext({ unsupported: false });
export const useTournaments = () => useContext(TournamentsContext);

export function TournamentsProvider({ children }) {
  const session = localStorage.getItem("access_token");
  const [unsupportedSession, setUnsupportedSession] = useState(null);
  const markUnsupported = useCallback(() => setUnsupportedSession(session), [session]);
  const list = useQuery({
    queryKey: ["tournaments", session], queryFn: ({ signal }) => listTournaments(signal),
    enabled: Boolean(session), retry: false, staleTime: 60000, cacheTime: 0, refetchOnWindowFocus: false,
  });
  const unsupported = Boolean(session) && (list.error?.status === 501 || unsupportedSession === session);
  return <TournamentsContext.Provider value={{ ...list, session, unsupported, markUnsupported }}>{children}</TournamentsContext.Provider>;
}
