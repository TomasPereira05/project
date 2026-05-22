import { useTranslation } from "react-i18next";
import { useCreateAthlete } from "../hooks";
import { AthleteForm } from "./AthleteForm";
import { HERO_IMG_SRC } from "../../../shared/config/config";

export default function CreateAthlete() {
  const { t } = useTranslation();
  const {
    alreadyHasMember,
    categories,
    errorMessage,
    handleChange,
    handleSubmit,
    isSubmitting,
    successMessage,
    values,
  } = useCreateAthlete(t);

  return (
    <>
      <main className="member-form-page">
        <div
          className="member-form-bg"
          style={{ backgroundImage: `url(${HERO_IMG_SRC})` }}
        />
        <div className="member-form-overlay" />

        <div className="member-form-container">
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
            successMessage={successMessage}
          />
        </div>
      </main>
    </>
  );
}
