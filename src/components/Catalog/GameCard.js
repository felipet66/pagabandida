import React, { useState } from "react";
import gameImages, { gameImageFiles } from "assets/games/images";
import { Flame, Gamepad2, Plane, Play } from "lucide-react";
import Icon from "components/DesignSystem/Icon";

const normalizeGameName = value => (value || "")
  .replace(/[™®]/g, "")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "");

// Single integration point for the catalog's locally bundled covers.
export const getGameImage = game => {
  if (game.imageFile) return gameImageFiles[game.imageFile] || null;
  if (["spribe/aviator", "spribe/aviator-vip", "spribe/aviator-premium"].includes(game.launchSlug)) return gameImages.aviator;
  const slug = game.slug || game.launchSlug?.split("/").pop();
  return gameImages[normalizeGameName(slug)] || gameImages[normalizeGameName(game.name)] || null;
};

export default function GameCard({ game, onOpen, featured = false }) {
  const [failedImage, setFailedImage] = useState(null);
  const image = getGameImage(game);
  return (
    <button type="button" className={`catalog-game ${featured ? "catalog-game--featured" : ""}`} onClick={() => onOpen(game)} aria-label={`Jogar ${game.name}`}>
      <span className="catalog-game__art">
        {image && failedImage !== image ? <img src={image} alt="" loading="lazy" onError={() => setFailedImage(image)} /> : <span className="catalog-game__initial" aria-hidden="true">{Array.from(game.name || "J")[0].toUpperCase()}</span>}
        <span className="catalog-game__badges">
          {featured && <span className="catalog-game__featured-badge"><Icon as={Plane} size={16} /> AVIATOR</span>}
          {game.hot && <span className="catalog-game__hot"><Icon as={Flame} size={16} /> EM ALTA</span>}
        </span>
        {game.category && <span className="catalog-game__category">{game.category}</span>}
        <span className="catalog-game__play" aria-hidden="true"><Icon as={Play} size={26} /></span>
      </span>
      <span className="catalog-game__details">
        <span className="catalog-game__name">{game.name}</span>
        <span className="catalog-game__vendor"><Icon as={Gamepad2} size={16} /> {game.vendorName || game.vendorSlug}</span>
      </span>
    </button>
  );
}
