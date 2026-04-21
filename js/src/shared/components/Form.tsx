import React, {isValidElement, type ReactElement} from "react";
import {StatusBox} from "./MessageFormBox";

interface FormField {
    id: string;
    label: string;
    type: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    required?: boolean;
    disabled?: boolean;
    autoComplete?: string;
    children?: React.ReactNode;
}

interface FormProps {
    title: string;
    fields: FormField[];
    onSubmit: (event: React.FormEvent) => void;
    logoSrc?: string;
    submitLabel?: string;
    children?: React.ReactNode; 
    disabled: boolean;
}


const Form: React.FC<FormProps> = ({ title, fields, onSubmit, logoSrc, submitLabel = "Submit", children, disabled }) => {
    const [statusBox, otherChildren] = React.Children.toArray(children).reduce<[ReactElement | null, React.ReactNode[]]>(
        (acc, child) => {
            if (isValidElement(child) && child.type === StatusBox) {
                acc[0] = child; 
            } else {
                acc[1].push(child); // Add other children to the second array
            }
            return acc;
        },
        [null, []]
    );

    return (
        <div className="form-page">
            <div className="form-card">
                {/* Logo */}
                {logoSrc && (
                    <div className="flex justify-center mb-6">
                        <a href="/">
                            <img src={logoSrc} alt="Jagoz Logo" className="h-24" width="82" height="82" />
                        </a>
                    </div>
                )}

                {/* Title */}
                <h2 className="form-title">{title}</h2>

                {/* StatusBox (if exists) */}
                {statusBox && <div className="mb-4">{statusBox}</div>}

                {/* Form */}
                <form onSubmit={onSubmit} className="space-y-4">
                    {fields.map((field) => (
                        <div key={field.id} className="relative">
                            <label htmlFor={field.id} className="form-label flex items-center">
                                {field.label}
                                {field.children} {/* Render additional content */}
                            </label>
                            <input
                                id={field.id}
                                type={field.type}
                                value={field.value}
                                onChange={field.onChange}
                                className="form-input"
                                required={field.required}
                                disabled={field.disabled}
                                autoComplete={field.autoComplete}
                            />
                        </div>
                    ))}

                    {/* Submit Button */}
                    <button type="submit" className="form-button" disabled={disabled}>
                        {submitLabel}
                    </button>
                </form>

                {/* Other Children */}
                <div>{otherChildren.map((otherChild, index) => (
                    <div key={index}>
                        {otherChild}
                    </div>
                ))}</div>
            </div>
        </div>
    );
};

export default Form;