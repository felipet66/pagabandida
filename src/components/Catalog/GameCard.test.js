import { getGameImage } from "./GameCard";
import gameImages, { gameImageFiles } from "assets/games/images";
import mapping from "assets/games/bff-mapping.json";

test("imageFile do BFF tem prioridade sobre slug e nome", () => {
  expect(getGameImage({ imageFile: "5-lions-megawaystm.png", slug: "unknown", name: "unknown" })).toBe(gameImageFiles["5-lions-megawaystm.png"]);
  expect(getGameImage({ imageFile: "missing.png", slug: "aviator" })).toBeNull();
});

test("as capas locais cobrem os 54 jogos mapeados da ganhebetBR", () => {
  expect(mapping.games).toHaveLength(54);
  expect(mapping.games.filter(game => !gameImageFiles[game.imageFile])).toEqual([]);
});

test("Aviator Premium reutiliza a capa local de Aviator", () => {
  expect(getGameImage({ launchSlug: "spribe/aviator-premium", name: "Aviator Premium" })).toBe(gameImages.aviator);
});
