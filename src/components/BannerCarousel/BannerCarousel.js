import { SUPPORT_URL } from "config/support";
import React, { useContext, useEffect, useRef, useState } from "react";
import Slider from "react-slick";
import { Link } from "react-router-dom";
import { canalBanner, couponBanner, rankingBanner } from "assets/responsiveImages";
import ResponsiveImage from "components/ResponsiveImage/ResponsiveImage";
import "slick-carousel/slick/slick.css";
import "./BannerCarousel.css";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import Icon from "components/DesignSystem/Icon";
import { ThemeContext } from "contexts/ThemeContext";

const DEFAULT_BANNERS = [
  { id: "carteira", href: "/admin/deposit", image: couponBanner, alt: "Paga Bandida — acesse sua carteira na ganhebetBR." },
  { id: "ranking", href: "/ranking", image: rankingBanner, alt: "Paga Bandida — confira o ranking de players. R$10.000,00 em prêmios para os top depositantes do mês." },
  { id: "suporte", href: SUPPORT_URL, image: canalBanner, alt: "Paga Bandida — suporte do Paga Bandida." },
];

const BANNER_SIZES = "(max-width: 600px) calc(100vw - 34px), (max-width: 1119px) calc(100vw - 50px), (max-width: 1199px) 1070px, 644px";

export default function BannerCarousel({ banners = DEFAULT_BANNERS }) {
  const slider = useRef(null);
  const [paused, setPaused] = useState(false);
  const { reduceMotion } = useContext(ThemeContext);
  const motionReduced = reduceMotion;

  useEffect(() => {
    if (paused || motionReduced) slider.current?.slickPause();
    else slider.current?.slickPlay();
  }, [paused, motionReduced]);

  if (!banners.length) return null;
  const multiple = banners.length > 1;
  const settings = {
    dots: multiple,
    arrows: false,
    infinite: multiple,
    slidesToShow: 1,
    slidesToScroll: 1,
    lazyLoad: "ondemand",
    speed: motionReduced ? 0 : 450,
    autoplay: multiple && !paused && !motionReduced,
    autoplaySpeed: 6000,
    pauseOnHover: true,
    pauseOnFocus: true,
    accessibility: true,
    customPaging: index => <button type="button" aria-label={`Exibir banner ${index + 1}`} />,
  };

  return (
    <section className={`banner-carousel${multiple ? " banner-carousel--controls" : ""}`} aria-label="Destaques Paga Bandida" aria-roledescription="carrossel">
      <Slider ref={slider} {...settings}>
        {banners.map((banner, index) => {
          const artwork = <ResponsiveImage image={banner.image} alt={banner.alt} sizes={BANNER_SIZES} loading={index === 0 ? "eager" : "lazy"} fetchPriority={index === 0 ? "high" : "low"} />;
          return <div key={banner.id || banner.image.src || banner.image}>
            <div className="banner-carousel__slide" role="group" aria-roledescription="slide" aria-label={`${index + 1} de ${banners.length}`}>
              {banner.href?.startsWith("/") ? <Link to={banner.href}>{artwork}</Link> : banner.href ? <a href={banner.href} target="_blank" rel="noopener noreferrer">{artwork}</a> : artwork}
            </div>
          </div>;
        })}
      </Slider>
      {multiple && <>
        <button type="button" className="banner-carousel__arrow banner-carousel__arrow--previous" aria-label="Banner anterior" onClick={() => slider.current?.slickPrev()}><Icon as={ChevronLeft} size={20} /></button>
        <button type="button" className="banner-carousel__arrow banner-carousel__arrow--next" aria-label="Próximo banner" onClick={() => slider.current?.slickNext()}><Icon as={ChevronRight} size={20} /></button>
        {!motionReduced && <button type="button" className="banner-carousel__pause" aria-label={paused ? "Retomar rotação dos banners" : "Pausar rotação dos banners"} onClick={() => setPaused(value => !value)}><Icon as={paused ? Play : Pause} size={16} /></button>}
      </>}
    </section>
  );
}
