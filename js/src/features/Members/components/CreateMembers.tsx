import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { useCreateMember } from "../hooks";
import { MemberForm } from "./MemberForm";
import { HERO_IMG_SRC } from "../../../shared/config/config";
import { useAuth } from "../../../shared/hooks/useAuth";

export default function CreateMembers() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { id, role } = useAuth();
  const isStaffCreation = role === "ADMIN" || role === "SECRETARIA";
  const {
    createdMemberId,
    errorMessage,
    handleChange,
    handleSubmit,
    isSubmitting,
    photoFile,
    registerAnother,
    setPhotoFile,
    values,
  } = useCreateMember(id, role, t);

  // O formulário é longo e o submit fica no fundo: sem isto, a confirmação renderiza fora do ecrã.
  useEffect(() => {
    if (createdMemberId !== null) window.scrollTo({ top: 0, behavior: "smooth" });
  }, [createdMemberId]);

  // A mesma página serve /members/create e /admin/members/create — a ficha abre no contexto certo.
  const memberProfilePath = location.pathname.startsWith("/admin")
    ? `/admin/members/${createdMemberId}`
    : `/members/${createdMemberId}`;

  return (
    <>
      <main className="member-form-page">
        <div
            className="member-form-bg"
            style={{ backgroundImage: `url(${HERO_IMG_SRC})` }}
        />
        <div className="member-form-overlay" />

        <div className="member-form-container">
          {createdMemberId !== null ? (
            <div className="member-card-padded member-confirmation">
              <CheckCircle2 size={56} className="member-confirmation-icon" />
              <h2 className="member-title">{t("members.create.confirmation.title")}</h2>
              <p className="member-desc">{t("members.create.success")}</p>
              <div className="member-confirmation-actions">
                <button className="member-btn-primary" type="button" onClick={() => navigate(memberProfilePath)}>
                  {t("members.create.confirmation.viewProfile")}
                </button>
                <button className="member-btn-outline" type="button" onClick={registerAnother}>
                  {t("members.create.confirmation.registerAnother")}
                </button>
              </div>
            </div>
          ) : (
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
            />
          )}
        </div>
      </main>
    </>
  );
}
