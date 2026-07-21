import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { SearchX } from "lucide-react";
import Header from "./Header";
import Footer from "./Footer";
import { NOT_FOUND_IMG_SRC } from "../config/config";

export default function NotFound() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="notfound-page">
      <Header />
      <main className="notfound-main">
        <div className="notfound-bg" style={{ backgroundImage: `url(${NOT_FOUND_IMG_SRC})` }} />
        <div className="notfound-overlay" />

        <div className="notfound-content">
          <SearchX size={56} className="notfound-icon" aria-hidden="true" />
          <p className="notfound-code">404</p>
          <h1 className="notfound-title">{t("notFound.title")}</h1>
          <p className="notfound-desc">{t("notFound.description")}</p>
          <div className="notfound-actions">
            <Link className="notfound-btn-primary" to="/">
              {t("notFound.backHome")}
            </Link>
            <button className="notfound-btn-outline" type="button" onClick={() => navigate(-1)}>
              {t("notFound.goBack")}
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
