import { Link } from "react-router-dom";
import { BadgeEuro, Clock3, Settings, Ticket, Trophy, UserCheck, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { useAdminOverviewStats } from "../hooks/useAdminOverviewStats";
import { fetchTrainingSchedules} from "../api";
import type { TrainingSchedule } from "../types";
import { dayKeys, TrainingScheduleBoard } from "./TrainingScheduleBoard";

const adminCards = [
  {
    icon: Ticket,
    titleKey: "admin.cards.events.title",
    descriptionKey: "admin.cards.events.description",
    to: "/admin/events",
  },
  {
    icon: Users,
    titleKey: "admin.cards.members.title",
    descriptionKey: "admin.cards.members.description",
    to: "/admin/members",
  },
  {
    icon: Trophy,
    titleKey: "admin.cards.athletes.title",
    descriptionKey: "admin.cards.athletes.description",
    to: "/admin/athletes",
  },
  {
    icon: BadgeEuro,
    titleKey: "admin.cards.sponsors.title",
    descriptionKey: "admin.cards.sponsors.description",
    to: "/admin/sponsors/approvals",
  },
  {
    icon: Settings,
    titleKey: "admin.cards.settings.title",
    descriptionKey: "admin.cards.settings.description",
    to: "/admin/sponsors/settings",
  },
];

export default function AdminHome() {
  const { t } = useTranslation();
  const { hasError, isLoading, stats } = useAdminOverviewStats();
  const [schedules, setSchedules] = useState<TrainingSchedule[]>([]);
  const [isScheduleLoading, setIsScheduleLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    async function loadSchedules() {
      setIsScheduleLoading(true);
      try {
        const response = await fetchTrainingSchedules({ season: "2025/2026", activeOnly: true });
        if (!ignore) setSchedules(response);
      } catch {
        if (!ignore) setSchedules([]);
      } finally {
        if (!ignore) setIsScheduleLoading(false);
      }
    }

    void loadSchedules();

    return () => {
      ignore = true;
    };
  }, []);

  const statGroups = [
    {
      titleKey: "admin.stats.groups.members",
      cards: [
        { icon: Users, labelKey: "admin.stats.members", value: stats.totalMembers },
        { icon: UserCheck, labelKey: "admin.stats.activeMembers", value: stats.activeMembers },
        { icon: Clock3, labelKey: "admin.stats.pendingMembers", value: stats.pendingMembers },
      ],
    },
    {
      titleKey: "admin.stats.groups.athletes",
      cards: [
        { icon: Trophy, labelKey: "admin.stats.athletes", value: stats.totalAthletes },
        { icon: UserCheck, labelKey: "admin.stats.activeAthletes", value: stats.activeAthletes },
        { icon: Clock3, labelKey: "admin.stats.pendingAthletes", value: stats.pendingAthletes },
      ],
    },
    {
      titleKey: "admin.stats.groups.sponsorships",
      cards: [
        { icon: BadgeEuro, labelKey: "admin.stats.sponsorships", value: stats.totalSponsorships },
        { icon: Clock3, labelKey: "admin.stats.pendingSponsorships", value: stats.pendingSponsorships },
      ],
    },
  ];

  return (
    <main className="admin-home">
      <section className="admin-home-header">
        <p className="admin-eyebrow">{t("admin.home.eyebrow")}</p>
        <h1>{t("admin.home.title")}</h1>
        <p>{t("admin.home.description")}</p>
      </section>

      <section className="admin-stats-section">
        <div className="admin-section-header">
          <div>
            <p className="admin-eyebrow">{t("admin.stats.eyebrow")}</p>
          </div>
          {hasError ? <span className="admin-stats-error">{t("admin.stats.error")}</span> : null}
        </div>
        <div className="admin-stats-group-grid">
          {statGroups.map((group) => (
            <article className="admin-stat-group" key={group.titleKey}>
              <h3>{t(group.titleKey)}</h3>
              <div className="admin-stats-grid">
                {group.cards.map((card) => {
                  const Icon = card.icon;

                  return (
                    <div className="admin-stat-card" key={card.labelKey}>
                      <Icon size={20} />
                      <span>{t(card.labelKey)}</span>
                      <strong>{isLoading ? "-" : card.value.toLocaleString()}</strong>
                    </div>
                  );
                })}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="admin-stats-section">
        <div className="admin-section-header">
          <div>
            <p className="admin-eyebrow">{t("admin.training.overview.eyebrow")}</p>
            <h2>{t("admin.training.overview.title")}</h2>
          </div>
          <Link className="member-link-action" to="/admin/training-schedules">
            {t("admin.training.overview.manage")}
          </Link>
        </div>
        {isScheduleLoading ? (
          <div className="sponsor-empty-card">{t("admin.training.loading")}</div>
        ) : schedules.length === 0 ? (
          <div className="sponsor-empty-card">{t("admin.training.empty")}</div>
        ) : (
          <TrainingScheduleBoard
            compact
            schedules={schedules}
            dayLabel={(weekday) => t(`admin.training.weekdays.${dayKeys[weekday - 1]}`)}
          />
        )}
      </section>

      <section className="admin-card-grid">
        {adminCards.map((card) => {
          const Icon = card.icon;

          return (
            <Link className="admin-card" key={card.to} to={card.to}>
              <Icon size={24} />
              <div>
                <strong>{t(card.titleKey)}</strong>
                <p>{t(card.descriptionKey)}</p>
              </div>
            </Link>
          );
        })}
      </section>
    </main>
  );
}
