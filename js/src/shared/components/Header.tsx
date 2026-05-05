import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, User } from "lucide-react";
import { TEAM_CATEGORIES, labelForCategory } from "../../features/Athletes";
import { LOGO_SRC } from "../config/config";
import { useAuth } from "../hooks/useAuth";

type MenuType = "mobile" | "socios" | "equipas" | "user" | null;

export default function Header() {
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
                        <img src={LOGO_SRC} alt="Logo" className="logo-box" />
                        <div>
                            <h1 className="header-title">ERICEIRENSE</h1>
                            <p className="header-subtitle">Grupo Desportivo Uniao Ericeirense</p>
                        </div>
                    </Link>

                    <nav className="nav">
                        <button className="nav-link" onClick={() => toggleMenu("socios")}>Socios</button>
                        <Link to="/sponsors" className="nav-link" onClick={closeMenus}>Patrocinios</Link>
                        <button className="nav-link" onClick={() => toggleMenu("equipas")}>Equipas</button>
                    </nav>

                    <div className="header-actions">
                        {isAuthenticated ? (
                            <button
                                className="header-user-btn"
                                onClick={() => toggleMenu("user")}
                                aria-label="Conta de utilizador"
                            >
                                {userIcon}
                            </button>
                        ) : (
                            <>
                                <button className="btn btn-outline" onClick={handleLoginClick}>Entrar</button>
                                <button className="btn btn-solid" onClick={handleRegisterClick}>Registar</button>
                            </>
                        )}
                    </div>

                    <button className="mobile-menu-btn" aria-label="Menu" onClick={() => toggleMenu("mobile")}>
                        <Menu size={24} aria-hidden="true" />
                    </button>
                </div>
            </div>

            <div className={`dropdown ${activeMenu === "mobile" ? "dropdown-visible" : "dropdown-hidden"}`}>
                <nav className="dropdown-nav">
                    <button className="dropdown-link" onClick={() => toggleMenu("socios")}>Socios</button>
                    <Link to="/sponsors" className="dropdown-link" onClick={closeMenus}>Patrocinios</Link>
                    <button className="dropdown-link" onClick={() => toggleMenu("equipas")}>Equipas</button>
                </nav>
                <div className="dropdown-actions">
                    {isAuthenticated ? (
                        <button
                            className="header-user-btn"
                            onClick={() => toggleMenu("user")}
                            aria-label="Conta de utilizador"
                        >
                            {userIcon}
                        </button>
                    ) : (
                        <>
                            <button className="btn btn-outline" onClick={handleLoginClick}>Entrar</button>
                            <button className="btn btn-solid" onClick={handleRegisterClick}>Registar</button>
                        </>
                    )}
                </div>
            </div>

            <div className={`dropdown ${activeMenu === "socios" ? "dropdown-visible" : "dropdown-hidden"}`}>
                <nav className="dropdown-nav">
                    {activeMemberId ? (
                        <Link to={`/members/${activeMemberId}`} className="dropdown-link" onClick={closeMenus}>Perfil de Socio</Link>
                    ) : (
                        <span className="dropdown-disabled">Perfil de Socio</span>
                    )}
                    {role === "ADMIN" && (
                        <Link to="/members/list" className="dropdown-link" onClick={closeMenus}>Lista de Socios</Link>
                    )}
                    <Link to="/members/create" className="dropdown-link" onClick={closeMenus}>Tornar-se Socio</Link>
                </nav>
            </div>

            <div className={`dropdown ${activeMenu === "user" ? "dropdown-visible" : "dropdown-hidden"}`}>
                <nav className="dropdown-nav">
                    <span className="dropdown-disabled">Ola, {username}</span>
                    <a href="#" className="dropdown-link">Perfil</a>
                    <button className="dropdown-link" onClick={handleLogoutClick}>Sair</button>
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
                    {otherSports.map((sport) => (
                        <span key={sport} className="dropdown-disabled">{sport} (em breve)</span>
                    ))}
                    <Link
                        to="/athletes/register"
                        className="dropdown-link"
                        onClick={closeMenus}
                    >
                        Inscricao de atletas
                    </Link>
                </nav>
            </div>
        </header>
    );
}
