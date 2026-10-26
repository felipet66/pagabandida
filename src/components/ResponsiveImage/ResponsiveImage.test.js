import React from "react";
import { render, screen } from "@testing-library/react";
import ResponsiveImage from "./ResponsiveImage";
import { welcomeBanner, canalBanner, rankingBanner, couponBanner, historyArt, analysisArt } from "assets/responsiveImages";

const image = {
  src: "banner-768.webp", srcSet: "banner-480.webp 480w, banner-768.webp 768w", width: 1672, height: 941,
  sources: [
    { type: "image/avif", media: "(max-width: 600px)", srcSet: "banner-480.avif 480w" },
    { type: "image/avif", srcSet: "banner-768.avif 768w" },
    { type: "image/webp", media: "(max-width: 600px)", srcSet: "banner-480.webp 480w" },
  ],
};

test("picture prioriza AVIF, preserva alternativa WebP, dimensões, classes e prioridade", () => {
  const { container } = render(<ResponsiveImage image={image} alt="Banner de teste" sizes="100vw" className="banner" loading="eager" fetchPriority="high" />);
  const sources = [...container.querySelectorAll("source")];
  expect(sources.map(source => source.type)).toEqual(["image/avif", "image/avif", "image/webp"]);
  expect(sources[0].media).toBe("(max-width: 600px)");
  expect(sources.every(source => source.sizes === "100vw")).toBe(true);
  expect(sources.every(source => source.style.display === "none")).toBe(true);
  const fallback = screen.getByRole("img", { name: "Banner de teste" });
  expect(fallback.getAttribute("src")).toBe("banner-768.webp");
  expect(fallback.getAttribute("width")).toBe("1672");
  expect(fallback.className).toBe("banner");
  expect(fallback.getAttribute("fetchpriority")).toBe("high");
  expect(fallback.hasAttribute("sources")).toBe(false);
  expect(container.querySelector("picture").style.display).toBe("contents");
});

test("URL simples continua sendo uma imagem comum sem picture ou srcset", () => {
  const { container } = render(<ResponsiveImage image="custom-banner.png" alt="Banner customizado" sizes="100vw" />);
  const banner = screen.getByRole("img", { name: "Banner customizado" });
  expect(container.querySelector("picture")).toBeNull();
  expect(banner.getAttribute("src")).toBe("custom-banner.png");
  expect(banner.hasAttribute("sizes")).toBe(false);
});

test("artes geradas limitam resolução móvel e mantêm versões maiores para desktop", () => {
  for (const asset of [welcomeBanner, canalBanner, rankingBanner, couponBanner, historyArt, analysisArt]) {
    const widths = srcSet => srcSet.split(", ").map(entry => Number(entry.match(/ (\d+)w$/)[1]));
    const limit = asset.width === asset.height ? 640 : 960;
    expect(Math.max(...widths(asset.sources[0].srcSet))).toBe(limit);
    expect(Math.max(...widths(asset.sources[2].srcSet))).toBe(limit);
    expect(Math.max(...widths(asset.sources[1].srcSet))).toBeGreaterThan(limit);
  }
});
