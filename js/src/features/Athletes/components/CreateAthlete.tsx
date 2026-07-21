import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { useCreateAthlete } from "../hooks";
import { AthleteForm } from "./AthleteForm";
import AthletePageBackground from "./AthletePageBackground";

export default function CreateAthlete() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    alreadyHasMember,
    categories,
    created,
    errorMessage,
    handleChange,
    handleSubmit,
    isSubmitting,
    photoFile,
    registerAnother,
    setPhotoFile,
    values,
  } = useCreateAthlete(t);

  // O formulário é longo e o submit fica no fundo: sem isto, a confirmação renderiza fora do ecrã.
  useEffect(() => {
    if (created) window.scrollTo({ top: 0, behavior: "smooth" });
  }, [created]);

  // A mesma página serve /athletes/register e /admin/athletes/register — a ficha abre no contexto certo.
  const athleteProfilePath = location.pathname.startsWith("/admin")
    ? `/admin/athletes/${created?.athleteId}`
    : `/athletes/${created?.athleteId}`;

  return (
    <>
      <main className="athlete-form-page">
        <AthletePageBackground />

        <div className="athlete-form-container">
          {created ? (
            <div className="athlete-card-padded athlete-confirmation">
              <CheckCircle2 size={56} className="athlete-confirmation-icon" />
              <h2 className="athlete-title">{t("athletes.register.confirmation.title")}</h2>
              <p className="athlete-desc">
                {created.photoFailed
                  ? t("athletes.register.successPhotoFailed")
                  : t("athletes.register.success")}
              </p>
              <div className="athlete-confirmation-actions">
                <button className="athlete-btn-primary" type="button" onClick={() => navigate(athleteProfilePath)}>
                  {t("athletes.register.confirmation.viewProfile")}
                </button>
                <button className="athlete-btn-outline" type="button" onClick={registerAnother}>
                  {t("athletes.register.confirmation.registerAnother")}
                </button>
              </div>
            </div>
          ) : (
            <AthleteForm
              title={t("athletes.register.title")}
              description={t("athletes.register.description")}
              submitLabel={t("athletes.register.submit")}
              values={values}
              categories={categories}
              alreadyHasMember={alreadyHasMember}
              onChange={handleChange}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              errorMessage={errorMessage}
              photoFile={photoFile}
              onPhotoChange={setPhotoFile}
            />
          )}
        </div>
      </main>
    </>
  );
}
