import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useParams } from "react-router-dom";
import "../styles/Members.css";
import {
  defaultMemberFormValues,
  fetchMember,
  updateMember,
  type Member,
  type MemberFormValues,
} from "..";
import { MemberForm } from "./MemberForm";

export default function UpdateMember() {
  const { memberId } = useParams();
  const [member, setMember] = useState<Member | null>(null);
  const [values, setValues] = useState<MemberFormValues>(defaultMemberFormValues());
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

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
          setErrorMessage("Nao foi possivel carregar o socio para atualizacao.");
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    if (memberId) {
      loadMember();
    }

    return () => {
      ignore = true;
    };
  }, [memberId]);

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
      setErrorMessage("Nao foi possivel atualizar esta ficha de socio.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="members-page">
      <div className="members-shell">
        {isLoading ? (
          <div className="page-panel">
            <p>A carregar formulario de atualizacao...</p>
          </div>
        ) : (
          <MemberForm
            title="Atualizar socio"
            description="O mesmo formulario aparece pre-preenchido para o socio rever e corrigir a sua informacao."
            values={values}
            onChange={handleChange}
            onSubmit={handleSubmit}
            submitLabel="Guardar alteracoes"
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
