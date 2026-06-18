import { useTranslation } from "react-i18next";
import { useCreateAthlete } from "../hooks";
import { AthleteForm } from "./AthleteForm";
import AthletePageBackground from "./AthletePageBackground";

export default function CreateAthlete() {
  const { t } = useTranslation();
  const {
    alreadyHasMember,
    categories,
    errorMessage,
    handleChange,
    handleSubmit,
    isSubmitting,
    photoFile,
    setPhotoFile,
    successMessage,
    values,
  } = useCreateAthlete(t);

  return (
    <>
      <main className="athlete-form-page">
        <AthletePageBackground />

        <div className="athlete-form-container">
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
            photoFile={photoFile}
            onPhotoChange={setPhotoFile}
          />
        </div>
      </main>
    </>
  );
}
