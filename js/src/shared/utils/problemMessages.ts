import i18n from "../i18n";
import type { HttpError } from "../types/HttpError";

/**
 * Tradução das respostas Problem Details do backend para PT/EN.
 *
 * O backend devolve um "type" estável (ex.: /problems/member-not-found) e, nos
 * erros de operação, uma "reason" específica em inglês. Aqui traduz-se primeiro
 * pela reason (quando é um caso conhecido, com parâmetros extraídos por regex)
 * e depois pelo type; sem correspondência, mostra-se a mensagem original do
 * backend, que continua a ser mais específica do que o title genérico.
 */

type ReasonPattern = {
  pattern: RegExp;
  key: string;
  params?: string[];
};

// Reasons conhecidas de Problem.InvalidOperation (fluxo de compra de bilhetes).
const REASON_PATTERNS: ReasonPattern[] = [
  { pattern: /^event is not open for ticket sales$/, key: "eventNotOpenForSales" },
  { pattern: /^event has already started$/, key: "eventAlreadyStarted" },
  { pattern: /^invalid or inactive member credentials$/, key: "invalidMemberCredentials" },
  { pattern: /^a member can buy at most one member ticket per event$/, key: "oneMemberTicketPerEvent" },
  { pattern: /^member #(\d+) already has a ticket for this event$/, key: "memberAlreadyHasTicket", params: ["number"] },
  { pattern: /^sector '(.+)' is sold out$/, key: "sectorSoldOut", params: ["name"] },
];

// Tipos de Problem com descrição estática, traduzidos pelo type. Ficam de fora
// o invalid-operation (a reason específica é preferível à descrição genérica) e
// o validation-error (a mensagem indica o campo em causa).
const TRANSLATED_TYPES = new Set([
  "unknown-error",
  "member-not-found",
  "member-already-exists",
  "user-not-found",
  "user-already-exists",
  "athlete-not-found",
  "athlete-already-registered",
  "team-category-not-found",
  "guardian-member-not-found",
  "athlete-invalid-state-transition",
  "invalid-athlete-date-field",
  "user-related-resource-not-found",
  "sponsor-not-found",
  "sponsorship-not-found",
  "unauthorized",
  "invalid-transition",
]);

export function translateHttpError(error: HttpError): string | null {
  const message = error.message;

  if (message) {
    for (const { pattern, key, params } of REASON_PATTERNS) {
      const match = message.match(pattern);
      if (match) {
        const values: Record<string, string> = {};
        params?.forEach((name, index) => {
          values[name] = match[index + 1];
        });
        return i18n.t(`problems.reasons.${key}`, values);
      }
    }
  }

  const typeSlug = error.type?.split("/").pop();
  if (typeSlug && TRANSLATED_TYPES.has(typeSlug)) {
    return i18n.t(`problems.types.${typeSlug}`);
  }

  return message || null;
}
