import { NavLink, Outlet } from "react-router-dom";
import { BadgeEuro, Building2, CalendarClock, ClipboardCheck, LayoutDashboard, Settings, ShieldCheck, Ticket, Trophy, UserCog, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import Header from "../../../shared/components/Header";
import Footer from "../../../shared/components/Footer";

const adminNavGroups = [
  {
    titleKey: "admin.navGroups.general",
    items: [
      { to: "/admin", labelKey: "admin.nav.overview", icon: LayoutDashboard, end: true },
      { to: "/admin/events", labelKey: "admin.nav.events", icon: Ticket },
      { to: "/admin/training-schedules", labelKey: "admin.nav.trainingSchedules", icon: CalendarClock },
    ],
  },
  {
    titleKey: "admin.navGroups.people",
    items: [
      { to: "/admin/members", labelKey: "admin.nav.members", icon: Users },
      { to: "/admin/users", labelKey: "admin.nav.users", icon: UserCog },
      { to: "/admin/athletes", labelKey: "admin.nav.athletes", icon: Trophy },
    ],
  },
  {
    titleKey: "admin.navGroups.sponsorships",
    items: [
      { to: "/admin/sponsors", labelKey: "admin.nav.sponsors", icon: BadgeEuro, end: true },
      { to: "/admin/sponsors/companies", labelKey: "admin.nav.sponsorCompanies", icon: Building2 },
      { to: "/admin/sponsors/approvals", labelKey: "admin.nav.sponsorApprovals", icon: ClipboardCheck },
    ],
  },
  {
    titleKey: "admin.navGroups.settings",
    items: [
      { to: "/admin/team-settings", labelKey: "admin.nav.teams", icon: Settings },
      { to: "/admin/seasons", labelKey: "admin.nav.seasons", icon: CalendarClock },
      { to: "/admin/audit-logs", labelKey: "admin.nav.auditLogs", icon: ShieldCheck },
      { to: "/admin/sponsors/settings", labelKey: "admin.nav.sponsorSettings", icon: Settings },
    ],
  },
];

export default function AdminLayout() {
  const { t } = useTranslation();

  return (
    <div>
      <Header />
      <div className="admin-layout">
        <aside className="admin-sidebar">
          <div className="admin-sidebar-header">
            <p>{t("admin.sidebar.eyebrow")}</p>
            <strong>{t("admin.sidebar.title")}</strong>
          </div>
          <nav className="admin-sidebar-nav" aria-label={t("admin.sidebar.aria")}>
            {adminNavGroups.map((group) => (
              <div className="admin-sidebar-group" key={group.titleKey}>
                <p className="admin-sidebar-group-title">{t(group.titleKey)}</p>
                <div className="admin-sidebar-group-links">
                  {group.items.map((item) => {
                    const Icon = item.icon;

                    return (
                      <NavLink className="admin-sidebar-link" end={item.end} key={item.to} to={item.to}>
                        <Icon size={18} />
                        <span>{t(item.labelKey)}</span>
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        <section className="admin-content">
          <Outlet />
        </section>
      </div>
      <Footer />
    </div>
  );
}
