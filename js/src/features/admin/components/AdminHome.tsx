import { Link } from "react-router-dom";
import { BadgeEuro, Settings, Trophy, Users } from "lucide-react";
import { useTranslation } from "react-i18next";

const adminCards = [
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

  return (
    <main className="admin-home">
      <section className="admin-home-header">
        <p className="admin-eyebrow">{t("admin.home.eyebrow")}</p>
        <h1>{t("admin.home.title")}</h1>
        <p>{t("admin.home.description")}</p>
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
