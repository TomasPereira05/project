import { useState, type ChangeEvent, type FormEvent } from "react";
import {
  centsFromEuroInput,
  createMember,
  defaultMemberFormValues,
  type MemberFormValues,
} from "..";
import { MemberForm } from "./MemberForm";

export default function CreateMembers() {
  const [values, setValues] = useState<MemberFormValues>(defaultMemberFormValues());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

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

    if (!values.privacyAccepted) {
      setErrorMessage("Tem de aceitar o consentimento de privacidade para submeter.");
      return;
    }

    if (values.category !== "ATLETA_SOCIO") {
      const quotaInCents = centsFromEuroInput(values.membershipQuotaEuros);
      if (!Number.isFinite(quotaInCents) || quotaInCents < 150) {
        setErrorMessage("A quota mensal minima e 1,50 EUR.");
        return;
      }
    }

    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const created = await createMember(values);
      setSuccessMessage(
        `Pedido submetido com sucesso. Foi atribuído o número #${created.memberNumber}.`,
      );
      setValues(defaultMemberFormValues());
    } catch {
      setErrorMessage("Não foi possível submeter o pedido de sócio.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-background py-10 flex justify-center items-center">
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <MemberForm
          title="Criar novo sócio"
          description="Formulário de candidatura com os dados necessários para avaliação por parte do clube."
          values={values}
          onChange={handleChange}
          onSubmit={handleSubmit}
          submitLabel="Submeter pedido"
          isSubmitting={isSubmitting}
          errorMessage={errorMessage}
          successMessage={successMessage}
        />
      </div>
    </main>
  );
}
