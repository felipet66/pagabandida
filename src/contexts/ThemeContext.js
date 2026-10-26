import { createContext } from "react";

export const themes = {
  dark: "dark",
  light: "light",
};

export const ThemeContext = createContext({
  theme: themes.dark,
  changeTheme: () => {},
  followSystemTheme: () => {},
  themePreference: null,
  reduceMotion: false,
  manualReduceMotion: null,
  systemReducedMotion: false,
  changeReduceMotion: () => {},
});
