import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useParams, Navigate } from "react-router-dom";
import {
  defaultMemberFormValues,
  fetchMember,
  updateMember,
  type Member,
  type MemberFormValues,
} from "..";
import { MemberForm } from "./MemberForm";
import { useAuth } from "../../../shared/hooks/useAuth";
import Header from "../../../shared/components/Header";
import Footer from "../../../shared/components/Footer";
import { HERO_IMG_SRC } from "../../../shared/config/config";

export default function UpdateMember() {
  const { memberId } = useParams();
  const { role, activeMemberId } = useAuth();
  
  const [member, setMember] = useState<Member | null>(null);
  const [values, setValues] = useState<MemberFormValues>(defaultMemberFormValues());
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const isAdmin = role === "ADMIN" || role === "SECRETARIA";
  const isSelf = activeMemberId === Number(memberId);

  useEffect(() => {
    let ignore = false;

    async function loadMember() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const response = await fetchMember(Number(memberId));
        if (!ignore) {
          setMember(response);
          setValues(defaultMemberFormValues(response));
        }
      } catch {
        if (!ignore) {
          setErrorMessage("Não foi possível carregar o sócio para atualização.");
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    if (memberId && (isAdmin || isSelf)) {
      loadMember();
    }

    return () => {
      ignore = true;
    };
  }, [memberId, isAdmin, isSelf]);

  function handleChange(
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) {
    const target = event.target;
    const nextValue =
      target instanceof HTMLInputElement && target.type === "checkbox"
        ? target.checked
        : target.value;

    setValues((current) => ({
      ...current,
      [target.name]: nextValue,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!member) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const updated = await updateMember(member.memberId, member, values);
      setMember(updated);
      setSuccessMessage("Dados atualizados com sucesso.");
    } catch {
      setErrorMessage("Não foi possível atualizar esta ficha de sócio.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // RBAC logic
  if (!isAdmin && !isSelf) {
    return <Navigate to="/" replace />;
  }

  return (
    <>
      <main className="member-form-page">
        <div
            className="member-form-bg"
            style={{ backgroundImage: `url(${HERO_IMG_SRC})`, position: "fixed" }}
        />
        <div className="member-form-overlay" style={{ position: "fixed" }} />
        
        <div className="member-form-container">
          {isLoading ? (
            <div className="member-form-loading-container">
               <div className="member-form-loading-spinner"></div>
               <p className="member-loading-text">A carregar formulário de atualização...</p>
            </div>
          ) : (
            <MemberForm
              title="Atualizar sócio"
              description="O formulário aparece pré-preenchido para o sócio rever e corrigir a sua informação."
              values={values}
              onChange={handleChange}
              onSubmit={handleSubmit}
              submitLabel="Guardar alterações"
              isSubmitting={isSubmitting}
              errorMessage={errorMessage}
              successMessage={successMessage}
              showBackendNotice
            />
          )}
        </div>
      </main>
    </>
  );
}
