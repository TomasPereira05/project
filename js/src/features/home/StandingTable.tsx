import { Trophy } from "lucide-react";
import { standings } from "./standingplaceholders";
import "./styles/StandingTable.css";

export function StandingsTable() {
  return (
    <section data-testid="standings-table" className="standings-section">
      <div className="st-container">
        
        <div className="standings-header-top">
          <div>
            <span className="standings-label">Campeonato Distrital</span>
            <h2 className="standings-title">
              <Trophy className="w-8 h-8" style={{ color: '#FACC15' }} />
              Classificação
            </h2>
          </div>
          <span className="standings-subtitle">Época 2025/2026</span>
        </div>

        <div className="standings-table-card">
          <div className="standings-table-wrap">
            <table className="s-table">
              <thead>
                <tr>
                  <th>Pos</th>
                  <th className="left-align">Equipa</th>
                  <th>J</th>
                  <th className="hide-sm">V</th>
                  <th className="hide-sm">E</th>
                  <th className="hide-sm">D</th>
                  <th className="hide-md">GM</th>
                  <th className="hide-md">GS</th>
                  <th>Pts</th>
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
            <span><strong>J</strong> - Jogos</span>
            <span className="hide-sm"><strong>V</strong> - Vitórias</span>
            <span className="hide-sm"><strong>E</strong> - Empates</span>
            <span className="hide-sm"><strong>D</strong> - Derrotas</span>
            <span className="hide-md"><strong>GM</strong> - Golos Marcados</span>
            <span className="hide-md"><strong>GS</strong> - Golos Sofridos</span>
            <span><strong>Pts</strong> - Pontos</span>
          </div>
          <p className="standings-footer-note">* Dados placeholder - Classificação real em breve</p>
        </div>

      </div>
    </section>
  );
}