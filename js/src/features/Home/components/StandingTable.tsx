import { Trophy } from "lucide-react";
import { standings } from ".."; 
import { useTranslation } from "react-i18next";

export default function StandingsTable() {
  const { t } = useTranslation();

  return (
    <section data-testid="standings-table" className="standings-section">
      <div className="st-container">
        
        <div className="standings-header-top">
          <div>
            <span className="standings-label">{t("standings.championship")}</span>
            <h2 className="standings-title">
              <Trophy className="w-8 h-8" style={{ color: '#FACC15' }} />
              {t("standings.title")}
            </h2>
          </div>
          <span className="standings-subtitle">{t("standings.season")}</span>
        </div>

        <div className="standings-table-card">
          <div className="standings-table-wrap">
            <table className="s-table">
              <thead>
                <tr>
                  <th>Pos</th>
                  <th className="left-align">{t("standings.team")}</th>
                  <th>{t("standings.gamesPlayed")}</th>
                  <th className="hide-sm">{t("standings.wins")}</th>
                  <th className="hide-sm">{t("standings.draws")}</th>
                  <th className="hide-sm">{t("standings.losses")}</th>
                  <th className="hide-md">{t("standings.goalsFor")}</th>
                  <th className="hide-md">{t("standings.goalsAgainst")}</th>
                  <th>{t("standings.points")}</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((team, index) => {
                  const isFirst = index === 0;
                  const isTop3 = index > 0 && index < 3;
                  
                  return (
                    <tr key={index} className={isFirst ? "row-highlight" : ""}>
                      <td>
                        <span className={`
                          ${isFirst ? 'pos-pill-gold' : ''}
                          ${isTop3 ? 'pos-pill-blue' : ''}
                          ${!isFirst && !isTop3 ? 'pos-pill-gray' : ''}
                        `}>
                          {team.pos}
                        </span>
                      </td>
                      <td className="left-align">
                        <div className={isFirst ? "team-name-blue" : "team-name-slate"}>
                          {isFirst && <div className="team-dot" />}
                          {team.name}
                        </div>
                      </td>
                      <td className="stat-val">{team.p}</td>
                      <td className="stat-w hide-sm">{team.w}</td>
                      <td className="stat-d hide-sm">{team.d}</td>
                      <td className="stat-l hide-sm">{team.l}</td>
                      <td className="stat-val hide-md">{team.gf}</td>
                      <td className="stat-val hide-md">{team.ga}</td>
                      <td>
                        <span className={isFirst ? "pts-val-blue" : "pts-val-slate"}>{team.pts}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="standings-legend-container">
          <div className="legend-items">
            <span><strong>{t("standings.gamesPlayed")}</strong> - {t("standings.games")}</span>
            <span className="hide-sm"><strong>{t("standings.wins")}</strong> - {t("standings.winsLabel")}</span>
            <span className="hide-sm"><strong>{t("standings.draws")}</strong> - {t("standings.drawsLabel")}</span>
            <span className="hide-sm"><strong>{t("standings.losses")}</strong> - {t("standings.lossesLabel")}</span>
            <span className="hide-md"><strong>{t("standings.goalsFor")}</strong> - {t("standings.goalsForLabel")}</span>
            <span className="hide-md"><strong>{t("standings.goalsAgainst")}</strong> - {t("standings.goalsAgainstLabel")}</span>
            <span><strong>{t("standings.points")}</strong> - {t("standings.pointsLabel")}</span>
          </div>
          <p className="standings-footer-note">* {t("standings.footer")}</p>
        </div>

      </div>
    </section>
  );
}