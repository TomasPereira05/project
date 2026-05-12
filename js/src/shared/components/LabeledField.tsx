import type { ReactNode } from "react";

export default function LabeledField({
  children,
  label,
  tooltip,
}: {
  children: ReactNode;
  label: string;
  tooltip?: string;
}) {
  return (
    <label className="labeled-field">
      <span className="labeled-field-label">
        {label}
        {tooltip ? <span className="labeled-field-tooltip">{tooltip}</span> : null}
      </span>
      {children}
    </label>
  );
}
