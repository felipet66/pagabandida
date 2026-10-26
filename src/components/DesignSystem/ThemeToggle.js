import React, { useContext } from "react";
import { ThemeContext } from "contexts/ThemeContext";
import Switch from "./Switch";

export default function ThemeToggle(props) {
  const { theme, changeTheme } = useContext(ThemeContext);
  return <Switch {...props} label="Modo claro" checked={theme === "light"} onChange={checked => changeTheme(checked ? "light" : "dark")} />;
}
