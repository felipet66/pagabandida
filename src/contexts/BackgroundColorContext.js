import { createContext } from "react";

export const backgroundColors = {
  primary: "primary",
  blue: "blue",
  green: "green"
};

export const BackgroundColorContext = createContext({
  color: backgroundColors.primary,
  changeColor: color => {},
  theme: "dark",
  reduceMotion: false,
  accent: "var(--primary)",
});
