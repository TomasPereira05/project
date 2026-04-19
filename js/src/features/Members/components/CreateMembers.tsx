import { useState, type ChangeEvent, type FormEvent } from "react";
import "../styles/Members.css";
import {
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
    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const created = await createMember(values);
      setSuccessMessage(
        `Pedido submetido com sucesso. Foi atribuido o numero #${created.memberNumber}.`,
      );
      setValues(defaultMemberFormValues());
    } catch {
      setErrorMessage("Nao foi possivel submeter o pedido de socio.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="members-page">
      <div className="members-shell">
        <MemberForm
          title="Criar novo socio"
          description="Formulario de candidatura com os dados necessarios para avaliacao por parte do clube."
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
