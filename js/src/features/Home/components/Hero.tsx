import { ChevronDown } from "lucide-react";
import {HERO_IMG_SRC} from "../../../shared/config/config";
import { useTranslation } from "react-i18next";

export default function Hero() {
  const { t } = useTranslation();

  return (
    <section className="hero-section">
      <div 
        className="hero-bg" 
        style={{ backgroundImage: `url(${HERO_IMG_SRC})` }}
      ></div>
      <div className="hero-overlay"></div>
      
      <div className="hero-content">
        <div className="hero-text-container">
          
          <div className="location-badge">
            <div className="location-dot"></div>
            <span className="location-text">{t("hero.location")}</span>
          </div>
          
          <h1 className="hero-title" data-testid="hero-slogan">{t("hero.clubName")}</h1>
          <p className="hero-subtitle">{t("hero.clubSubtitle")}</p>
          
          <div className="hero-tagline-container">
            <div className="hero-line"></div>
            <p className="hero-tagline">{t("hero.tagline")}</p>
          </div>
          
          <p className="hero-desc">
            {t("hero.description")}
          </p>
        </div>
      </div>

      <button className="hero-scroll-btn">
        <ChevronDown />
      </button>

      <div className="hero-gradient-bottom"></div>
    </section>
  );
}
