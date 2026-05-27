import { useTranslation } from "react-i18next";
import { useCreateMember } from "../hooks";
import { MemberForm } from "./MemberForm";
import { HERO_IMG_SRC } from "../../../shared/config/config";
import { useAuth } from "../../../shared/hooks/useAuth";

export default function CreateMembers() {
  const { t } = useTranslation();
  const { id, role } = useAuth();
  const isStaffCreation = role === "ADMIN" || role === "SECRETARIA";
  const { errorMessage, handleChange, handleSubmit, isSubmitting, photoFile, setPhotoFile, successMessage, values } =
    useCreateMember(id, role, t);

  return (
    <>
      <main className="member-form-page">
        <div
            className="member-form-bg"
            style={{ backgroundImage: `url(${HERO_IMG_SRC})` }}
        />
        <div className="member-form-overlay" />
        
        <div className="member-form-container">
          <MemberForm
            title={t("members.create.title")}
            description={t("members.create.description")}
            values={values}
            onChange={handleChange}
            onSubmit={handleSubmit}
            photoFile={photoFile}
            onPhotoChange={setPhotoFile}
            showAccountUsernameField={isStaffCreation}
            submitLabel={t("members.create.submit")}
            isSubmitting={isSubmitting}
            errorMessage={errorMessage}
            successMessage={successMessage}
          />
        </div>
      </main>
    </>
  );
}
