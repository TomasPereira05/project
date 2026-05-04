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
import Header from "../../../shared/components/header";
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
      <Header />
      <main className="relative min-h-screen flex flex-col py-10">
        <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0"
            style={{ backgroundImage: `url(${HERO_IMG_SRC})`, position: "fixed" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#001D4A]/90 via-primary/70 to-transparent z-10" style={{ position: "fixed" }} />
        
        <div className="relative z-20 flex-1 flex justify-center items-center w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-white gap-3">
               <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
               <p className="font-medium animate-pulse">A carregar formulário de atualização...</p>
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
