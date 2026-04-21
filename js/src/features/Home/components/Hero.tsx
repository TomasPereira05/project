import { ChevronDown } from "lucide-react";
import {HERO_IMG_SRC} from "../../../shared/config/config";

export default function Hero() {
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
            <span className="location-text">Ericeira, Portugal</span>
          </div>
          
          <h1 className="hero-title" data-testid="hero-slogan">Ericeirense</h1>
          <p className="hero-subtitle">Grupo Desportivo União Ericeirense</p>
          
          <div className="hero-tagline-container">
            <div className="hero-line"></div>
            <p className="hero-tagline">A força do mar, a alma da terra</p>
          </div>
          
          <p className="hero-desc">
            Onde o mar é mais azul. Um clube com história, paixão e uma comunidade que vive o futebol com orgulho.
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
