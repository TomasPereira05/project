import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ChevronDown, Menu, User } from "lucide-react";
import { useTranslation } from "react-i18next";
import { fetchAllTeamCategories, type TeamCatalogCategory } from "../../features/Athletes";
import { ProfilePhoto } from "../../features/files";
import { LOGO_SRC } from "../config/config";
import { useAuth } from "../hooks/useAuth";
import { getInitials } from "../utils";

type MenuType = "mobile" | "socios" | "equipas" | "outras-modalidades" | "user" | "patrocinios" | null;

export default function Header() {
    const { i18n, t } = useTranslation();
    const [activeMenu, setActiveMenu] = useState<MenuType>(null);
    const [teamCategories, setTeamCategories] = useState<TeamCatalogCategory[]>([]);
    const navigate = useNavigate();
    const location = useLocation();
    const { id, role, activeMemberId, username, clearAuth } = useAuth();
    const ref = useRef<HTMLDivElement>(null);
    const isAuthenticated = Boolean(username);
    const isStaff = role === "ADMIN" || role === "SECRETARIA";

    const sectionActive = {
        socios: location.pathname.startsWith("/members"),
        patrocinios: location.pathname.startsWith("/sponsors"),
        equipas: location.pathname.startsWith("/athletes"),
        outrasModalidades: location.pathname.startsWith("/other-sports"),
        admin: location.pathname.startsWith("/admin"),
    };

    useEffect(() => {
        let ignore = false;
        fetchAllTeamCategories()
            .then((cats) => {
                if (!ignore) setTeamCategories(cats.filter((c) => c.active));
            })
            .catch(() => {});
        return () => {
            ignore = true;
        };
    }, []);

    const toggleMenu = (menu: Exclude<MenuType, null>) => {
        setActiveMenu((prev) => (prev === menu ? null : menu));
    };

    const closeMenus = () => {
        setActiveMenu(null);
    };

    const handleLoginClick = () => {
        navigate("/auth/login");
    };

    const handleRegisterClick = () => {
        navigate("/auth/register");
    };

    const handleLogoutClick = () => {
        if (clearAuth) {
            clearAuth();
        }
        closeMenus();
        navigate("/");
    };

    const otherSports = ["Patinagem", "Voleibol", "Futebol Praia", "Golf"];
    const userIcon = (
        <ProfilePhoto activeMemberId={activeMemberId} alt={username ?? t("header.aria.userAccount")} className="header-user-avatar" userId={id}>
            {username ? getInitials(username) : <User size={18} aria-hidden="true" />}
        </ProfilePhoto>
    );
    const language = i18n.resolvedLanguage?.startsWith("en") ? "en" : "pt";

    const handleLanguageChange = (nextLanguage: "pt" | "en") => {
        void i18n.changeLanguage(nextLanguage);
        closeMenus();
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                closeMenus();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <header className="header" ref={ref}>
            <div className="container-custom">
                <div className="header-inner">
                    <Link to="/" className="logo" onClick={closeMenus}>
                        <img src={LOGO_SRC} alt={t("header.logoAlt")} className="logo-box" />
                        <div>
                            <h1 className="header-title">ERICEIRENSE</h1>
                            <p className="header-subtitle">{t("header.clubSubtitle")}</p>
                        </div>
                    </Link>

                    <nav className="nav">
                        <HeaderDropdownButton active={activeMenu === "socios"} currentSection={sectionActive.socios} label={t("header.nav.members")} onClick={() => toggleMenu("socios")} variant="nav" />
                        <HeaderDropdownButton active={activeMenu === "patrocinios"} currentSection={sectionActive.patrocinios} label={t("header.nav.sponsors")} onClick={() => toggleMenu("patrocinios")} variant="nav" />
                        <HeaderDropdownButton active={activeMenu === "equipas"} currentSection={sectionActive.equipas} label={t("header.nav.teams")} onClick={() => toggleMenu("equipas")} variant="nav" />
                        <HeaderDropdownButton active={activeMenu === "outras-modalidades"} currentSection={sectionActive.outrasModalidades} label={t("header.nav.otherSports")} onClick={() => toggleMenu("outras-modalidades")} variant="nav" />
                        {isStaff && (
                            <Link className={`nav-link ${sectionActive.admin ? "is-active" : ""}`} to="/admin" onClick={closeMenus}>
                                {t("header.nav.admin")}
                            </Link>
                        )}
                    </nav>

                    <div className="header-actions">
                        <LanguageSwitcher language={language} onChange={handleLanguageChange} label={t("header.aria.language")} />
                        {isAuthenticated ? (
                            <button
                                className="header-user-btn"
                                onClick={() => toggleMenu("user")}
                                aria-label={t("header.aria.userAccount")}
                            >
                                {userIcon}
                            </button>
                        ) : (
                            <>
                                <button className="btn btn-outline" onClick={handleLoginClick}>{t("header.auth.login")}</button>
                                <button className="btn btn-solid" onClick={handleRegisterClick}>{t("header.auth.register")}</button>
                            </>
                        )}
                    </div>

                    <button className="mobile-menu-btn" aria-label={t("header.aria.menu")} onClick={() => toggleMenu("mobile")}>
                        <Menu size={24} aria-hidden="true" />
                    </button>
                </div>
            </div>

            <div className={`dropdown ${activeMenu === "mobile" ? "dropdown-visible" : "dropdown-hidden"}`}>
                <nav className="dropdown-nav">
                    <HeaderDropdownButton active={activeMenu === "socios"} currentSection={sectionActive.socios} label={t("header.nav.members")} onClick={() => toggleMenu("socios")} variant="dropdown" />
                    <HeaderDropdownButton active={activeMenu === "patrocinios"} currentSection={sectionActive.patrocinios} label={t("header.nav.sponsors")} onClick={() => toggleMenu("patrocinios")} variant="dropdown" />
                    <HeaderDropdownButton active={activeMenu === "equipas"} currentSection={sectionActive.equipas} label={t("header.nav.teams")} onClick={() => toggleMenu("equipas")} variant="dropdown" />
                    <HeaderDropdownButton active={activeMenu === "outras-modalidades"} currentSection={sectionActive.outrasModalidades} label={t("header.nav.otherSports")} onClick={() => toggleMenu("outras-modalidades")} variant="dropdown" />
                    {isStaff && (
                        <Link className={`dropdown-link ${sectionActive.admin ? "is-active" : ""}`} to="/admin" onClick={closeMenus}>
                            {t("header.nav.admin")}
                        </Link>
                    )}
                </nav>
                <div className="dropdown-actions">
                    <LanguageSwitcher language={language} onChange={handleLanguageChange} label={t("header.aria.language")} />
                    {isAuthenticated ? (
                        <button
                            className="header-user-btn"
                            onClick={() => toggleMenu("user")}
                            aria-label={t("header.aria.userAccount")}
                        >
                            {userIcon}
                        </button>
                    ) : (
                        <>
                            <button className="btn btn-outline" onClick={handleLoginClick}>{t("header.auth.login")}</button>
                            <button className="btn btn-solid" onClick={handleRegisterClick}>{t("header.auth.register")}</button>
                        </>
                    )}
                </div>
            </div>

            <div className={`dropdown ${activeMenu === "socios" ? "dropdown-visible" : "dropdown-hidden"}`}>
                <nav className="dropdown-nav">
                    {activeMemberId ? (
                        <Link to={`/members/${activeMemberId}`} className="dropdown-link" onClick={closeMenus}>{t("header.members.profile")}</Link>
                    ) : (
                        <span className="dropdown-disabled">{t("header.members.profile")}</span>
                    )}
                    {isStaff && (
                        <Link to="/members/list" className="dropdown-link" onClick={closeMenus}>{t("header.members.list")}</Link>
                    )}
                    <Link to="/members/create" className="dropdown-link" onClick={closeMenus}>{t("header.members.become")}</Link>
                </nav>
            </div>

            <div className={`dropdown ${activeMenu === "patrocinios" ? "dropdown-visible" : "dropdown-hidden"}`}>
                <nav className="dropdown-nav">
                    <Link to="/sponsors/info" className="dropdown-link" onClick={closeMenus}>{t("header.sponsors.info")}</Link>
                    {isAuthenticated && (
                        <Link to="/sponsors/my" className="dropdown-link" onClick={closeMenus}>{t("header.sponsors.my")}</Link>
                    )}
                    {isStaff && (
                        <Link to="/admin/sponsors" className="dropdown-link" onClick={closeMenus}>{t("header.sponsors.list")}</Link>
                    )}
                    {isStaff && (
                        <Link to="/sponsors/approvals" className="dropdown-link" onClick={closeMenus}>{t("header.sponsors.approvals")}</Link>
                    )}
                    {isStaff && (
                        <Link to="/sponsors/settings" className="dropdown-link" onClick={closeMenus}>{t("header.sponsors.settings")}</Link>
                    )}
                    <Link to="/sponsors/create" className="dropdown-link" onClick={closeMenus}>{t("header.sponsors.become")}</Link>
                </nav>
            </div>

            <div className={`dropdown ${activeMenu === "user" ? "dropdown-visible" : "dropdown-hidden"}`}>
                <nav className="dropdown-nav">
                    <span className="dropdown-disabled">{t("header.auth.hello", { username })}</span>
                    <Link to="/profile" className="dropdown-link" onClick={closeMenus}>{t("header.user.profile")}</Link>
                    <button className="dropdown-link" onClick={handleLogoutClick}>{t("header.auth.logout")}</button>
                </nav>
            </div>

            <div className={`dropdown ${activeMenu === "equipas" ? "dropdown-visible" : "dropdown-hidden"}`}>
                <nav className="dropdown-nav">
                    {isStaff && (
                        <Link to="/athletes" className="dropdown-link" onClick={closeMenus}>{t("header.teams.manage")}</Link>
                    )}
                    {teamCategories.map((category) => (
                        <Link
                            key={category.teamId}
                            to={`/athletes/category/${category.code}`}
                            className="dropdown-link"
                            onClick={closeMenus}
                        >
                            {category.label}
                        </Link>
                    ))}
                    <Link
                        to="/athletes/register"
                        className="dropdown-link"
                        onClick={closeMenus}
                    >
                        {t("header.teams.becomeAthlete")}
                    </Link>
                    {isStaff && (
                        <Link
                            to="/athletes/settings"
                            className="dropdown-link"
                            onClick={closeMenus}
                        >
                            {t("header.teams.settings")}
                        </Link>
                    )}
                </nav>
            </div>

            <div className={`dropdown ${activeMenu === "outras-modalidades" ? "dropdown-visible" : "dropdown-hidden"}`}>
                <nav className="dropdown-nav">
                    {otherSports.map((sport) => (
                        <span key={sport} className="dropdown-disabled">{sport} ({t("common.soon")})</span>
                    ))}
                </nav>
            </div>
        </header>
    );
}

function HeaderDropdownButton({
    active,
    currentSection,
    label,
    onClick,
    variant,
}: {
    active: boolean;
    currentSection: boolean;
    label: string;
    onClick: () => void;
    variant: "nav" | "dropdown";
}) {
    return (
        <button className={`${variant === "nav" ? "nav-link" : "dropdown-link"} header-dropdown-trigger ${currentSection ? "is-active" : ""}`} onClick={onClick} type="button">
            <span>{label}</span>
            <ChevronDown className={`header-dropdown-chevron ${active ? "is-open" : ""}`} size={15} aria-hidden="true" />
        </button>
    );
}

function LanguageSwitcher({
    language,
    label,
    onChange,
}: {
    language: "pt" | "en";
    label: string;
    onChange: (language: "pt" | "en") => void;
}) {
    return (
        <div className="language-switcher" aria-label={label} role="group">
            <button
                className={`language-switcher-option ${language === "pt" ? "is-active" : ""}`}
                onClick={() => onChange("pt")}
                type="button"
            >
                PT
            </button>
            <button
                className={`language-switcher-option ${language === "en" ? "is-active" : ""}`}
                onClick={() => onChange("en")}
                type="button"
            >
                EN
            </button>
        </div>
    );
}
