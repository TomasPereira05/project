import { ArrowRight, Calendar } from "lucide-react";
import { news } from "..";
import { useTranslation } from "react-i18next";

export default function NewsGrid() {
  const { t } = useTranslation();
  
  return (
    <section id="news-section" data-testid="news-section" className="news-section">
      <div className="news-container">
        
        {/* Header */}
        <div className="news-header">
          <div>
            <span className="news-label">{t("newsGrid.label")}</span>
            <h2 className="news-title">{t("newsGrid.title")}</h2>
          </div>

          <button className="news-view-all">
            {t("newsGrid.viewAll")}
            <ArrowRight />
          </button>
        </div>

        {/* Grid */}
        <div className="news-grid">
          {news.map((item, index) => (
            <div 
              key={index} 
              className="news-card" 
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="news-card-img-wrap">
                <img
                  src={item.image}
                  alt={item.title}
                  className="news-card-img"
                />
                <div className="news-card-badge">{item.category}</div>
              </div>

              <div className="news-card-header">
                <h3 className="news-card-title">{item.title}</h3>
              </div>

              <div className="news-card-content">
                <p className="news-card-excerpt">{item.excerpt}</p>
                <div className="news-card-date">
                  <Calendar />
                  <span>{item.date}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="news-footer">
          <p className="news-footer-text">
            {t("newsGrid.placeholderText")}
          </p>
        </div>

      </div>
    </section>
  );
}