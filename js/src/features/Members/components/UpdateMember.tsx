import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { useUpdateMember } from "../hooks";
import { MemberForm } from "./MemberForm";
import { useAuth } from "../../../shared/hooks/useAuth";
import { HERO_IMG_SRC } from "../../../shared/config/config";

export default function UpdateMember() {
  const { t } = useTranslation();
  const { memberId } = useParams();
  const { role, activeMemberId } = useAuth();

  const isAdmin = role === "ADMIN" || role === "SECRETARIA";
  const isSelf = activeMemberId === Number(memberId);
  const { errorMessage, handleChange, handleSubmit, isLoading, isSubmitting, successMessage, values } =
    useUpdateMember(memberId, isAdmin || isSelf, t);

  return (
    <main className="member-form-page">
      <div className="member-form-bg" style={{ backgroundImage: `url(${HERO_IMG_SRC})`, position: "fixed" }} />
      <div className="member-form-overlay" style={{ position: "fixed" }} />

      <div className="member-form-container">
        {isLoading ? (
          <div className="member-form-loading-container">
            <div className="member-form-loading-spinner"></div>
            <p className="member-loading-text">{t("members.update.loading")}</p>
          </div>
        ) : (
          <MemberForm
            title={t("members.update.title")}
            description={t("members.update.description")}
            values={values}
            onChange={handleChange}
            onSubmit={handleSubmit}
            submitLabel={t("members.update.submit")}
            isSubmitting={isSubmitting}
            errorMessage={errorMessage}
            successMessage={successMessage}
            showBackendNotice
          />
        )}
      </div>
    </main>
  );
}
