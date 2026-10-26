import React, { useState, useEffect, useLayoutEffect, useCallback, useMemo } from "react";
import { ThemeContext, themes } from "contexts/ThemeContext";
import { THEME_STORAGE_KEY, MOTION_STORAGE_KEY, LIGHT_QUERY, MOTION_QUERY,
  readPreference, writePreference, validTheme, systemMatches, watchMedia } from "services/themePreferences";

export default function ThemeContextWrapper(props) {
  const [themePreference, setThemePreference] = useState(() => {
    const value = readPreference(THEME_STORAGE_KEY);
    return validTheme(value) ? value : themes.dark;
  });
  const [systemLight, setSystemLight] = useState(() => systemMatches(LIGHT_QUERY));
  const [systemReducedMotion, setSystemReducedMotion] = useState(() => systemMatches(MOTION_QUERY));
  const [manualReduceMotion, setManualReduceMotion] = useState(() => {
    const saved = readPreference(MOTION_STORAGE_KEY);
    return saved === "true" ? true : saved === "false" ? false : null;
  });
  const theme = themePreference || (systemLight ? themes.light : themes.dark);
  const reduceMotion = manualReduceMotion ?? systemReducedMotion;
  const changeTheme = useCallback(value => {
    if (!validTheme(value)) return;
    writePreference(THEME_STORAGE_KEY, value);
    setThemePreference(value);
  }, []);
  const followSystemTheme = useCallback(() => {
    writePreference(THEME_STORAGE_KEY, null);
    setThemePreference(null);
  }, []);
  const changeReduceMotion = useCallback(value => {
    writePreference(MOTION_STORAGE_KEY, String(Boolean(value)));
    setManualReduceMotion(Boolean(value));
  }, []);

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.motion = reduceMotion ? "reduced" : "full";
    document.body.classList.remove("white-content");
  }, [theme, reduceMotion]);

  useEffect(() => {
    document.documentElement.dataset.themeReady = "true";
    const stopTheme = watchMedia(LIGHT_QUERY, setSystemLight);
    const stopMotion = watchMedia(MOTION_QUERY, setSystemReducedMotion);
    return () => { stopTheme(); stopMotion(); };
  }, []);

  const value = useMemo(() => ({ theme, changeTheme, themePreference, followSystemTheme,
    reduceMotion, manualReduceMotion, systemReducedMotion, changeReduceMotion }),
  [theme, changeTheme, themePreference, followSystemTheme, reduceMotion, manualReduceMotion, systemReducedMotion, changeReduceMotion]);

  useEffect(() => {
    const hostname = window.location.hostname;
    const isLocalhost =
      hostname === "localhost" ||
      hostname.endsWith(".localhost") ||
      hostname === "127.0.0.1" ||
      hostname === "[::1]" ||
      hostname === "::1";

    if (isLocalhost) return;

    const disableRightClick = e => {
      e.preventDefault();
    };

    const disableKeys = e => {
      const key = e.key.toLowerCase();
      const inspectionKey = ["i", "j", "c"].includes(key);

      if (
        key === "f12" ||
        (e.ctrlKey && e.shiftKey && inspectionKey) ||
        (e.metaKey && e.altKey && inspectionKey) ||
        (e.ctrlKey && key === "u") ||
        (e.metaKey && e.altKey && key === "u")
      ) {
        e.preventDefault();
      }
    };

    document.addEventListener("contextmenu", disableRightClick, true);
    document.addEventListener("keydown", disableKeys, true);

    return () => {
      document.removeEventListener("contextmenu", disableRightClick, true);
      document.removeEventListener("keydown", disableKeys, true);
    };
  }, []);

  return (
    <ThemeContext.Provider value={value}>
      {props.children}
    </ThemeContext.Provider>
  );
}
