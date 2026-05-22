import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  fetchAllTeamCategories,
  listByCategory,
  type Athlete,
  type TeamCatalogCategory,
} from "..";
import { HERO_IMG_SRC } from "../../../shared/config/config";
import { getInitials } from "../../../shared/utils";

export default function AthleteByTeamCategory() {
  const { t } = useTranslation();
  const { teamCategory } = useParams();
  const navigate = useNavigate();
  const [category, setCategory] = useState<TeamCatalogCategory | null>(null);
  const [categoryUnknown, setCategoryUnknown] = useState(false);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let ignore = false;

    async function load() {
      setIsLoading(true);
      setErrorMessage("");
      setCategoryUnknown(false);

      if (!teamCategory) {
        if (!ignore) {
          setCategoryUnknown(true);
          setIsLoading(false);
        }
        return;
      }

      try {
        const allCategories = await fetchAllTeamCategories();
        const matched = allCategories.find((c) => c.code === teamCategory);
        if (!matched) {
          if (!ignore) {
            setCategoryUnknown(true);
            setIsLoading(false);
          }
          return;
        }

        const response = await listByCategory(matched.teamId);
        if (!ignore) {
          setCategory(matched);
          setAthletes(response);
        }
      } catch {
        if (!ignore) {
          setErrorMessage(t("athletes.list.errors.load"));
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    load();

    return () => {
      ignore = true;
    };
  }, [teamCategory, t]);

  const heading = useMemo(() => {
    if (category) return t("athletes.category.heading", { category: category.label });
    return t("athletes.category.unknown");
  }, [category, t]);

  return (
    <>
      <main className="member-form-page">
        <div
          className="member-form-bg"
          style={{ backgroundImage: `url(${HERO_IMG_SRC})` }}
        />
        <div className="member-form-overlay" />

        <div className="relative z-20 flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="member-card-padded">
            <div className="member-card-header">
              <div>
                <h2 className="member-title">{heading}</h2>
                <p className="member-desc">{t("athletes.category.description")}</p>
              </div>

              <button onClick={() => navigate(-1)} className="member-btn-back">
                <ArrowLeft size={18} />
                {t("athletes.common.back")}
              </button>
            </div>

            {categoryUnknown && (
              <div className="member-alert-error">
                <ShieldAlert size={20} className="text-red-500" />
                <p className="text-sm font-medium">{t("athletes.category.notFound")}</p>
              </div>
            )}

            {errorMessage && (
              <div className="member-alert-error">
                <ShieldAlert size={20} className="text-red-500" />
                <p className="text-sm font-medium">{errorMessage}</p>
              </div>
            )}

            {isLoading && (
              <div className="member-loading-container py-8">
                <div className="member-loading-spinner" />
                <p className="member-loading-text">{t("athletes.common.loadingAthletes")}</p>
              </div>
            )}

            {!isLoading && !errorMessage && category && (
              <>
                {athletes.length === 0 ? (
                  <div className="border border-dashed border-border rounded-lg p-8 text-center text-text-secondary">
                    {t("athletes.category.empty")}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {athletes.map((athlete) => (
                      <article
                        key={athlete.id}
                        className="bg-white border border-border rounded-xl overflow-hidden flex hover:shadow-md transition-shadow"
                      >
                        <Link
                          to={`/athletes/${athlete.id}`}
                          aria-label={t("athletes.category.viewAria", { name: athlete.nome })}
                          className="w-1/3 aspect-square bg-gray-100 flex items-center justify-center text-2xl font-heading font-bold text-text-secondary hover:bg-gray-200 hover:text-primary transition-colors"
                        >
                          {athlete.fotoUrl ? (
                            <img
                              src={athlete.fotoUrl}
                              alt={athlete.nome}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span>{getInitials(athlete.nome)}</span>
                          )}
                        </Link>
                        <div className="flex-1 p-4 flex flex-col justify-between gap-3 min-w-0">
                          <div className="min-w-0">
                            <strong className="font-heading text-base text-text-primary block truncate">
                              {athlete.nome}
                            </strong>
                            <p className="text-sm text-text-secondary">
                              {t("athletes.fields.numberShort")} {athlete.numero ?? t("athletes.common.empty")}
                            </p>
                          </div>
                          <div className="space-y-0.5 text-sm text-text-secondary">
                            <div>{athlete.posicao ?? t("athletes.common.positionMissing")}</div>
                            <div>
                              {athlete.idade !== null ? t("athletes.detail.ageValue", { count: athlete.idade }) : t("athletes.category.ageMissing")}
                              {" · "}
                              {athlete.nacionalidade}
                            </div>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {!isLoading && !errorMessage && category && (
            <div className="member-card-padded">
              <h3 className="font-heading text-lg text-text-primary uppercase tracking-tight pb-2 border-b border-border mb-4">
                {t("athletes.category.trainingSchedules")}
              </h3>
              <p className="text-text-secondary">{t("athletes.category.noSchedules")}</p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
