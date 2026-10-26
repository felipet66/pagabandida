import React, { useContext } from "react";
import { ThemeContext } from "contexts/ThemeContext";
import Switch from "./Switch";

export default function MotionToggle(props) {
  const { reduceMotion, changeReduceMotion } = useContext(ThemeContext);
  return <Switch {...props} label="Reduzir movimento" checked={reduceMotion} onChange={changeReduceMotion}
    disabled={props.disabled} />;
}
