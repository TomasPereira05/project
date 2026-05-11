import { Waves } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFacebook, faInstagram } from "@fortawesome/free-brands-svg-icons";
import {LOGO_SRC} from "../config/config";
import { useTranslation } from "react-i18next";

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="footer">
      <div className="footer-container">
        
        <div className="footer-grid">
          <div>
            <div className="footer-logo-row">
              <div className="footer-logo-box">
                <img src={LOGO_SRC} alt="Logo" className="footer-logo-icon" />
              </div>
              <div>
                <span className="footer-logo-title">{t("footer.title")}</span>
                <p className="footer-logo-subtitle">{t("footer.subtitle")}</p>
              </div>
            </div>
            <p className="footer-tagline">
              <Waves className="w-4 h-4" style={{ color: '#00A3E0' }} />
              {t("footer.tagline")}
            </p>
          </div>

          <div>
            <h4 className="footer-heading">{t("footer.contact")}</h4>
            <div className="footer-contact-list">
              <p>Ericeira, Portugal</p>
              <p>geral@gdue.pt</p>
              <p>261 022 808/93 069 1921</p>
            </div>
          </div>

          <div>
            <h4 className="footer-heading">{t("footer.socials")}</h4>
            <div className="footer-socials">
              <a href="https://www.facebook.com/gdueoficial" target="_blank" rel="noopener noreferrer" className="footer-social-link" aria-label="Facebook">
                <FontAwesomeIcon icon={faFacebook} style={{ width: 18, height: 18 }} />
              </a>
              <a href="https://www.instagram.com/academia.gduericeirense/" target="_blank" rel="noopener noreferrer" className="footer-social-link" aria-label="Instagram">
                <FontAwesomeIcon icon={faInstagram} style={{ width: 18, height: 18 }} />
              </a>
            </div>
          </div>

          <div>
            <h4 className="footer-heading">{t("footer.location")}</h4>
            <div className="footer-contact-list">
              <p>Campo Henrique Tomás Frade</p>
              <p>Urbanização da Camacha</p>
              <p>2655-302 Ericeira</p>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>{t("footer.copyright")}</p>
        </div>

      </div>
    </footer>
  );
}
