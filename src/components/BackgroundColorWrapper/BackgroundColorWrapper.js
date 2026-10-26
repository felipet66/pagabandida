import React, { useState, useContext } from "react";
import { ThemeContext } from "contexts/ThemeContext";
import {
  BackgroundColorContext,
  backgroundColors,
} from "contexts/BackgroundColorContext";

export default function BackgroundColorWrapper(props) {
  const [color, setColor] = useState(backgroundColors.primary);
  const { theme, reduceMotion } = useContext(ThemeContext);

  function changeColor(color) {
    setColor(color);
  }

  return (
    <BackgroundColorContext.Provider
      value={{ color, changeColor, theme, reduceMotion, accent: "var(--primary)" }}
    >
      {props.children}
    </BackgroundColorContext.Provider>
  );
}
