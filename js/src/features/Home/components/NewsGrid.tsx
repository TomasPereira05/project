import { ArrowRight, Calendar } from "lucide-react";
import { news } from "../NewsItemHolders";
import "../styles/NewsGrid.css";

export function NewsGrid() {
  return (
    <section id="news-section" data-testid="news-section" className="news-section">
      <div className="news-container">
        
        {/* Header */}
        <div className="news-header">
          <div>
            <span className="news-label">Últimas Atualizações</span>
            <h2 className="news-title">Notícias do Clube</h2>
          </div>

          <button className="news-view-all">
            Ver Todas
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

        {/* Footer info manually requested in snippet */}
        <div className="news-footer">
          <p className="news-footer-text">
            * Conteúdo placeholder - As notícias reais serão carregadas em breve
          </p>
        </div>

      </div>
    </section>
  );
}