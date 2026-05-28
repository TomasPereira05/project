import { NavLink, Outlet } from "react-router-dom";
import { BadgeEuro, LayoutDashboard, Settings, Ticket, Trophy, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import Header from "../../../shared/components/Header";
import Footer from "../../../shared/components/Footer";

const adminNavItems = [
  { to: "/admin", labelKey: "admin.nav.overview", icon: LayoutDashboard, end: true },
  { to: "/admin/events", labelKey: "admin.nav.events", icon: Ticket },
  { to: "/admin/members", labelKey: "admin.nav.members", icon: Users },
  { to: "/admin/athletes", labelKey: "admin.nav.athletes", icon: Trophy },
  { to: "/admin/team-settings", labelKey: "admin.nav.teams", icon: Settings },
  { to: "/admin/sponsors/approvals", labelKey: "admin.nav.sponsorApprovals", icon: BadgeEuro },
  { to: "/admin/sponsors/settings", labelKey: "admin.nav.sponsorSettings", icon: Settings },
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
            {adminNavItems.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink className="admin-sidebar-link" end={item.end} key={item.to} to={item.to}>
                  <Icon size={18} />
                  <span>{t(item.labelKey)}</span>
                </NavLink>
              );
            })}
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
