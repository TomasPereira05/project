//Ainda a ver se é mesmo necessário este formulário para editar o perfil do atleta
import type { ChangeEvent, FormEvent } from "react";
import { Link } from "react-router-dom";
import { TEAM_CATEGORIES, labelForCategory, type AthleteFormValues } from "..";

type AthleteFormProps = {
  title: string;
  description: string;
  values: AthleteFormValues;
  onChange: (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  submitLabel: string;
  isSubmitting: boolean;
  errorMessage: string;
  successMessage: string;
  showBackendNotice?: boolean;
};

export function AthleteForm({
  title,
  description,
  values,
  onChange,
  onSubmit,
  submitLabel,
  isSubmitting,
  errorMessage,
  successMessage,
  showBackendNotice = false,
}: AthleteFormProps) {
  return (
    <section className="athlete-form-card">
      <div className="athlete-form-row">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>

        <Link className="ghost-button" to="/athletes">
          Voltar aos atletas
        </Link>
      </div>

      {showBackendNotice ? (
        <div className="feedback-message">
          O backend atual permite atualizar a categoria de equipa e os dados de escola.
          Os restantes campos nao aparecem neste formulario para manter o fluxo simples.
        </div>
      ) : null}

      {errorMessage ? (
        <div className="feedback-message is-error">{errorMessage}</div>
      ) : null}

      {successMessage ? (
        <div className="feedback-message is-success">{successMessage}</div>
      ) : null}

      <form onSubmit={onSubmit}>
        <div className="athlete-form-grid">
          <label className="athlete-form-field">
            <span>Categoria</span>
            <select name="teamCategory" value={values.teamCategory} onChange={onChange}>
              {TEAM_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {labelForCategory(category)}
                </option>
              ))}
            </select>
          </label>

          <label className="athlete-form-field">
            <span>Escola</span>
            <input
              name="school"
              value={values.school}
              onChange={onChange}
              placeholder="Escola (opcional)"
            />
          </label>

          <label className="athlete-form-field">
            <span>Ano</span>
            <input
              name="schoolYear"
              value={values.schoolYear}
              onChange={onChange}
              placeholder="Ex: 8º ano"
            />
          </label>

          <label className="athlete-form-field">
            <span>Turma</span>
            <input
              name="schoolClass"
              value={values.schoolClass}
              onChange={onChange}
              placeholder="Ex: B"
            />
          </label>
        </div>

        <div className="athlete-form-actions">
          <button className="primary-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "A guardar..." : submitLabel}
          </button>
        </div>
      </form>
    </section>
  );
}

