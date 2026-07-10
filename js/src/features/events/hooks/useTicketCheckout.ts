import { useEffect, useMemo, useState } from "react";
import type { TFunction } from "i18next";
import { useAuth } from "../../../shared/hooks/useAuth";
import { useStatusHandler } from "../../../shared/hooks/useStatusHandler";
import { redirectToPaymentCheckout } from "../../../shared/utils/paymentReturnPath";
import { fetchEvent, startTicketCheckout, validateMemberCredential } from "../api";
import type { EventOutput, TicketLineInput, TicketPriceType } from "../types";

export const MAX_TICKETS = 5;

type WizardTicket = {
  priceType: TicketPriceType;
  sectorId: number | null;
  // sócio autenticado a usar a própria conta (desconto automático, sem credenciais)
  useAccount: boolean;
  memberNumber: string;
  memberBirthDate: string; // yyyy-MM-dd
};

function newTicket(priceType: TicketPriceType, useAccount: boolean): WizardTicket {
  return { priceType, sectorId: null, useAccount, memberNumber: "", memberBirthDate: "" };
}

export function useTicketCheckout(eventId: number, t: TFunction<"translation", undefined>) {
  const { activeMemberId, email } = useAuth();
  const canUseAccount = Boolean(activeMemberId);

  const { message, type, handleError, clearMessage, setError } = useStatusHandler();
  const [event, setEvent] = useState<EventOutput | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0);
  const [tickets, setTickets] = useState<WizardTicket[]>([]);
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState(email ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [validating, setValidating] = useState(false);

  useEffect(() => {
    let ignore = false;
    fetchEvent(eventId)
      .then((loaded) => {
        if (!ignore) setEvent(loaded);
      })
      .catch(handleError)
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [eventId, handleError]);

  useEffect(() => {
    if (email && !buyerEmail) setBuyerEmail(email);
  }, [email, buyerEmail]);

  const normalCount = tickets.filter((tk) => tk.priceType === "NORMAL").length;
  const memberCount = tickets.filter((tk) => tk.priceType === "MEMBER").length;
  const accountUsed = tickets.some((tk) => tk.priceType === "MEMBER" && tk.useAccount);

  const priceOf = (tk: WizardTicket) => (tk.priceType === "MEMBER" ? event?.priceMember ?? 0 : event?.priceNormal ?? 0);
  const total = useMemo(() => tickets.reduce((sum, tk) => sum + priceOf(tk), 0), [tickets, event]);

  const addTicket = (priceType: TicketPriceType) => {
    if (tickets.length >= MAX_TICKETS) return;
    const useAccount = priceType === "MEMBER" && canUseAccount && !accountUsed;
    setTickets((current) => [...current, newTicket(priceType, useAccount)]);
  };

  const removeTicket = (priceType: TicketPriceType) => {
    setTickets((current) => {
      const index = [...current].reverse().findIndex((tk) => tk.priceType === priceType);
      if (index === -1) return current;
      const realIndex = current.length - 1 - index;
      return current.filter((_, i) => i !== realIndex);
    });
  };

  const patchTicket = (index: number, patch: Partial<WizardTicket>) =>
    setTickets((current) => current.map((tk, i) => (i === index ? { ...tk, ...patch } : tk)));

  // alocação por setor (guard simples anti-overselling no cliente; o backend é a autoridade)
  const sectorAllocation = useMemo(() => {
    const map = new Map<number, number>();
    tickets.forEach((tk) => {
      if (tk.sectorId != null) map.set(tk.sectorId, (map.get(tk.sectorId) ?? 0) + 1);
    });
    return map;
  }, [tickets]);

  const sectorsValid =
    event != null &&
    tickets.every((tk) => tk.sectorId != null) &&
    event.sectors.every((sector) => (sectorAllocation.get(sector.sectorId) ?? 0) <= sector.available);

  const ticketsStepValid =
    tickets.length >= 1 &&
    tickets.length <= MAX_TICKETS &&
    tickets.every(
      (tk) => tk.priceType === "NORMAL" || tk.useAccount || (/^\d+$/.test(tk.memberNumber.trim()) && tk.memberBirthDate !== ""),
    );

  const buyerValid = buyerName.trim() !== "" && /\S+@\S+\.\S+/.test(buyerEmail);

  const canAdvance = step === 0 ? ticketsStepValid : step === 1 ? sectorsValid : step === 2 ? buyerValid : true;

  const submit = async () => {
    if (!event) return;
    clearMessage();
    setSubmitting(true);
    try {
      const lines: TicketLineInput[] = tickets.map((tk) => {
        if (tk.priceType === "NORMAL" || tk.useAccount) {
          return { sectorId: tk.sectorId as number, priceType: tk.priceType };
        }
        return {
          sectorId: tk.sectorId as number,
          priceType: "MEMBER",
          memberNumber: Number(tk.memberNumber),
          memberBirthDate: tk.memberBirthDate,
        };
      });
      const session = await startTicketCheckout(eventId, { buyerName: buyerName.trim(), buyerEmail: buyerEmail.trim(), lines });
      redirectToPaymentCheckout(session.checkoutUrl);
    } catch (error) {
      handleError(error);
      setSubmitting(false);
    }
  };

  // Avança de passo; no passo dos bilhetes valida no servidor as credenciais de sócio
  // (nº + data de nascimento) antes de deixar escolher setores.
  const goNext = async () => {
    if (step === 0) {
      const credTickets = tickets.filter((tk) => tk.priceType === "MEMBER" && !tk.useAccount);
      if (credTickets.length > 0) {
        clearMessage();
        setValidating(true);
        try {
          const results = await Promise.all(
            credTickets.map((tk) => validateMemberCredential(Number(tk.memberNumber), tk.memberBirthDate)),
          );
          if (results.some((r) => !r.valid)) {
            setError(t("events.checkout.invalidCredentials"));
            return;
          }
        } catch (error) {
          handleError(error);
          return;
        } finally {
          setValidating(false);
        }
      }
    }
    setStep((s) => s + 1);
  };

  const goBack = () => setStep((s) => s - 1);

  return {
    event,
    loading,
    message,
    type,
    step,
    tickets,
    normalCount,
    memberCount,
    accountUsed,
    canUseAccount,
    buyerName,
    setBuyerName,
    buyerEmail,
    setBuyerEmail,
    submitting,
    validating,
    total,
    priceOf,
    canAdvance,
    addTicket,
    removeTicket,
    patchTicket,
    goNext,
    goBack,
    submit,
  };
}
