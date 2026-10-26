import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ThemeContext } from "contexts/ThemeContext";
import BannerCarousel from "./BannerCarousel";
import ThemeContextWrapper from "../ThemeWrapper/ThemeWrapper";
import { MOTION_STORAGE_KEY } from "services/themePreferences";

let mockSettings;
const mockPause = jest.fn(), mockPlay = jest.fn();
jest.mock("react-slick", () => {
  const React = require("react");
  return React.forwardRef((props, ref) => {
    mockSettings = props;
    React.useImperativeHandle(ref, () => ({ slickPause: mockPause, slickPlay: mockPlay }));
    return <div>{props.children}</div>;
  });
});
const banners = [{ id: "a", image: "a.png", alt: "Destaque A" }, { id: "b", image: "b.png", alt: "Destaque B" }];
let osReduced;
beforeEach(() => {
  jest.clearAllMocks(); osReduced = false;
  localStorage.clear();
  window.matchMedia = jest.fn(() => ({ matches: osReduced, addEventListener: jest.fn(), removeEventListener: jest.fn() }));
});
const scene = reduced => <MemoryRouter><ThemeContext.Provider value={{ reduceMotion: reduced }}><BannerCarousel banners={banners} /></ThemeContext.Provider></MemoryRouter>;
test("reduzir movimento do app interrompe rotação e remove transição do carrossel", () => {
  const view = render(scene(false));
  expect(mockSettings.autoplay).toBe(true);
  expect(mockSettings.lazyLoad).toBe("ondemand");
  view.rerender(scene(true));
  expect(mockSettings.autoplay).toBe(false);
  expect(mockSettings.speed).toBe(0);
  expect(mockPause).toHaveBeenCalled();
  expect(screen.queryByRole("button", { name: "Pausar rotação dos banners" })).toBeNull();
});
test("a preferência do sistema também impede rotação automática", () => {
  osReduced = true;
  render(<MemoryRouter><ThemeContextWrapper><BannerCarousel banners={banners} /></ThemeContextWrapper></MemoryRouter>);
  expect(mockSettings.autoplay).toBe(false);
  expect(mockSettings.speed).toBe(0);
});
test("escolha explícita permite animações mesmo quando o sistema prefere redução", () => {
  osReduced = true;
  localStorage.setItem(MOTION_STORAGE_KEY, "false");
  render(<MemoryRouter><ThemeContextWrapper><BannerCarousel banners={banners} /></ThemeContextWrapper></MemoryRouter>);
  expect(mockSettings.autoplay).toBe(true);
  expect(mockSettings.speed).toBe(450);
});
test("pausa manual continua após ligar e desligar movimento reduzido", () => {
  const view = render(scene(false));
  fireEvent.click(screen.getByRole("button", { name: "Pausar rotação dos banners" }));
  expect(mockSettings.autoplay).toBe(false);
  view.rerender(scene(true)); view.rerender(scene(false));
  expect(mockSettings.autoplay).toBe(false);
  fireEvent.click(screen.getByRole("button", { name: "Retomar rotação dos banners" }));
  expect(mockSettings.autoplay).toBe(true);
});

test("destaques mantêm depósito e direcionam o novo banner aos torneios", () => {
  render(<MemoryRouter><BannerCarousel /></MemoryRouter>);
  const banner = screen.getByRole("img", { name: /acesse sua carteira/ });
  expect(banner.closest("a").getAttribute("href")).toBe("/admin/deposit");
  expect(banner.getAttribute("loading")).toBe("eager");
  expect(banner.getAttribute("fetchpriority")).toBe("high");
  expect(screen.getByRole("img", { name: /conheça os torneios/ }).closest("a").getAttribute("href")).toBe("/admin/torneios");
  expect(screen.queryByRole("img", { name: /ranking|R\$10.000|R\$3.000|DJ4APRI/ })).toBeNull();
});
