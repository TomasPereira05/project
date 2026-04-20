import { Waves } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFacebook, faInstagram } from "@fortawesome/free-brands-svg-icons";
import "../styles/Footer.css";
import {LOGO_SRC} from "../../../shared/config/config";

export function Footer() {
  return (
    <footer className="footer-section">
      <div className="footer-container">
        
        <div className="footer-grid">
          <div>
            <div className="footer-logo-row">
              <div className="footer-logo-box">
                <img src={LOGO_SRC} alt="Logo" className="footer-logo-icon" />
              </div>
              <div>
                <span className="footer-logo-title">ERICEIRENSE</span>
                <p className="footer-logo-subtitle">Futebol Clube</p>
              </div>
            </div>
            <p className="footer-tagline">
              <Waves className="w-4 h-4" style={{ color: '#00A3E0' }} />
              A força do mar, a alma da terra
            </p>
          </div>

          <div>
            <h4 className="footer-heading">Contacto</h4>
            <div className="footer-contact-list">
              <p>Ericeira, Portugal</p>
              <p>geral@ericeirense.pt</p>
            </div>
          </div>

          <div>
            <h4 className="footer-heading">Redes Sociais</h4>
            <div className="footer-socials">
              <a href="#" className="footer-social-link" aria-label="Facebook">
                <FontAwesomeIcon icon={faFacebook} style={{ width: 18, height: 18 }} />
              </a>
              <a href="#" className="footer-social-link" aria-label="Instagram">
                <FontAwesomeIcon icon={faInstagram} style={{ width: 18, height: 18 }} />
              </a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© 2026 Ericeirense Futebol Clube. Todos os direitos reservados.</p>
        </div>

      </div>
    </footer>
  );
}
