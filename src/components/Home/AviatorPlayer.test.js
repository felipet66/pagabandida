import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import AviatorPlayer from "./AviatorPlayer";
let root, host;
beforeEach(() => { global.IS_REACT_ACT_ENVIRONMENT = true; host = document.createElement("div"); document.body.appendChild(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); delete global.IS_REACT_ACT_ENVIRONMENT; });
test("ampliar no mobile mantém o mesmo iframe e restaura rolagem ao voltar", () => {
  const width = window.innerWidth; window.innerWidth = 390;
  act(() => root.render(<AviatorPlayer title="Aviator" url="about:blank" />));
  const iframe = host.querySelector('iframe'); const previous = document.body.style.overflow;
  act(() => host.querySelector('button').click());
  expect(host.querySelector('.aviator-player-panel--expanded')).not.toBeNull();
  expect(host.querySelector('iframe')).toBe(iframe); expect(document.body.style.overflow).toBe("hidden");
  act(() => host.querySelector('button').click());
  expect(host.querySelector('.aviator-player-panel--expanded')).toBeNull(); expect(document.body.style.overflow).toBe(previous);
  window.innerWidth = width;
});
