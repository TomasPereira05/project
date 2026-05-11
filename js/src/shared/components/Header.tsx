import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, User } from "lucide-react";
import { useTranslation } from "react-i18next";
import { TEAM_CATEGORIES, labelForCategory } from "../../features/Athletes";
import { LOGO_SRC } from "../config/config";
import { useAuth } from "../hooks/useAuth";

type MenuType = "mobile" | "socios" | "equipas" | "outras-modalidades" | "user" | "patrocinios" | null;

export default function Header() {
    const { i18n, t } = useTranslation();
    const [activeMenu, setActiveMenu] = useState<MenuType>(null);
    const navigate = useNavigate();
    const { role, activeMemberId, username, clearAuth } = useAuth();
    const ref = useRef<HTMLDivElement>(null);
    const isAuthenticated = Boolean(username);

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
    const userIcon = <User size={20} aria-hidden="true" />;
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
                        <button className="nav-link" onClick={() => toggleMenu("socios")}>{t("header.nav.members")}</button>
                        <button className="nav-link" onClick={() => toggleMenu("patrocinios")}>{t("header.nav.sponsors")}</button>
                        <button className="nav-link" onClick={() => toggleMenu("equipas")}>{t("header.nav.teams")}</button>
                        <button className="nav-link" onClick={() => toggleMenu("outras-modalidades")}>{t("header.nav.otherSports")}</button>
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
                    <button className="dropdown-link" onClick={() => toggleMenu("socios")}>{t("header.nav.members")}</button>
                    <button className="dropdown-link" onClick={() => toggleMenu("patrocinios")}>{t("header.nav.sponsors")}</button>
                    <button className="dropdown-link" onClick={() => toggleMenu("equipas")}>{t("header.nav.teams")}</button>
                    <button className="dropdown-link" onClick={() => toggleMenu("outras-modalidades")}>{t("header.nav.otherSports")}</button>
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
                    {role === "ADMIN" && (
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
                    {role === "ADMIN" && (
                        <Link to="/sponsors/approvals" className="dropdown-link" onClick={closeMenus}>{t("header.sponsors.approvals")}</Link>
                    )}
                    {role === "ADMIN" && (
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
                    {TEAM_CATEGORIES.map((category) => (
                        <Link
                            key={category}
                            to={`/athletes/category/${category}`}
                            className="dropdown-link"
                            onClick={closeMenus}
                        >
                            {labelForCategory(category)}
                        </Link>
                    ))}
                    <Link
                        to="/athletes/register"
                        className="dropdown-link"
                        onClick={closeMenus}
                    >
                        {t("header.teams.becomeAthlete")}
                    </Link>
                    {role === "ADMIN" && (
                        <Link
                            to="/athletes/settings"
                            className="dropdown-link"
                            onClick={closeMenus}
                        >
                            Settings
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
