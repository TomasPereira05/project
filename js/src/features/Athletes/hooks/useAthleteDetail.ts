import { useEffect, useState } from "react";
import type { TFunction } from "i18next";
import {
  approveAthlete,
  deactivateAthlete,
  getAdminDetail,
  getAthleteDetail,
  reactivateAthlete,
  rejectAthlete,
} from "../api";
import type { AthleteAdmin, AthleteDetail } from "../types";
import { todayISO } from "../../../shared/utils/dateInputs";

export function useAthleteDetail(
  athleteId: string | undefined,
  adminView: boolean,
  t: TFunction<"translation", undefined>,
) {
  const [publicDto, setPublicDto] = useState<AthleteDetail | null>(null);
  const [adminDto, setAdminDto] = useState<AthleteAdmin | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    let ignore = false;

    async function load() {
      if (!athleteId) return;
      setIsLoading(true);
      setErrorMessage("");
      setFeedback("");

      try {
        if (adminView) {
          const response = await getAdminDetail(Number(athleteId));
          if (!ignore) setAdminDto(response);
        } else {
          const response = await getAthleteDetail(Number(athleteId));
          if (!ignore) setPublicDto(response);
        }
      } catch {
        if (!ignore) setErrorMessage(t("athletes.detail.errors.load"));
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    load();
    return () => {
      ignore = true;
    };
  }, [athleteId, adminView, t]);

  async function handleToggleActive() {
    if (!adminDto) return;
    try {
      const updated = adminDto.active
        ? await deactivateAthlete(adminDto.athleteId)
        : await reactivateAthlete(adminDto.athleteId);
      setAdminDto(updated);
      setFeedback(updated.active ? t("athletes.detail.feedback.reactivated") : t("athletes.detail.feedback.deactivated"));
      setErrorMessage("");
    } catch {
      setErrorMessage(t("athletes.detail.errors.toggle"));
    }
  }

  async function handleApprove() {
    if (!adminDto) return;
    try {
      const today = todayISO();
      const updated = await approveAthlete(adminDto.athleteId, today);
      setAdminDto(updated);
      setFeedback(t("athletes.detail.feedback.approved"));
      setErrorMessage("");
    } catch {
      setErrorMessage(t("athletes.detail.errors.approve"));
    }
  }

  async function handleReject() {
    if (!adminDto) return;
    try {
      const updated = await rejectAthlete(adminDto.athleteId);
      setAdminDto(updated);
      setFeedback(t("athletes.detail.feedback.rejected"));
      setErrorMessage("");
    } catch {
      setErrorMessage(t("athletes.detail.errors.reject"));
    }
  }

  return {
    adminDto,
    errorMessage,
    feedback,
    handleApprove,
    handleReject,
    handleToggleActive,
    isLoading,
    publicDto,
  };
}
