import { useState, useRef, useEffect } from "react";
import { Menu, User } from "lucide-react";
import {LOGO_SRC} from "../config/config"
import { Link, useNavigate } from "react-router-dom";
import { TEAM_CATEGORIES, labelForCategory } from "../../features/Athletes";
import { useAuth } from "../hooks/useAuth";

export default function Header() {
    const [activeMenu, setActiveMenu] = useState<MenuType>(null);
    const navigate = useNavigate();
    const { role, activeMemberId, username, clearAuth } = useAuth();
    const ref = useRef<HTMLDivElement>(null);
    const isAuthenticated = Boolean(username);

    type MenuType = "mobile" | "socios" | "conta" | "equipas" | "user" | null;

    const toggleMenu = (menu: Exclude<MenuType, null>) => {
        setActiveMenu((prev) => (prev === menu ? null : menu));
    };

    const closeMenus = () => {
        setActiveMenu(null);
    };

    const handleLoginClick = () => {
        navigate('/auth/login')
    };

    const handleRegisterClick = () => {
        navigate('/auth/register')
    };

    const handleLogoutClick = () => {
        if (clearAuth) {
            clearAuth();
        }
        closeMenus();
        navigate('/');
    };

    const otherSports = ["Patinagem", "Voleibol", "Futebol Praia", "Golf"];

    const userIcon = <User size={20} aria-hidden="true" />;

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
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
                            <p className="header-subtitle">Grupo Desportivo União Ericeirense</p>
                        </div>
                    </Link>
                    <nav className="nav">
                        <button className="nav-link" onClick={() => toggleMenu("socios")}>Sócios</button>
                        <button className="nav-link" onClick={() => toggleMenu("conta")}>Conta</button>
                        <span className="nav-disabled">Patrocinios</span>
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
            
            {/* Mobile Dropdown Menu */}
            <div className={`dropdown ${activeMenu === "mobile" ? "dropdown-visible" : "dropdown-hidden"}`}>
                <nav className="dropdown-nav">
                    <button className="dropdown-link" onClick={() => toggleMenu("socios")}>Sócios</button>
                    <button className="dropdown-link" onClick={() => toggleMenu("conta")}>Conta</button>
                    <span className="dropdown-disabled">Patrocinios</span>
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
            

            {/* Sócios Dropdown Menu */}
            <div className={`dropdown ${activeMenu === "socios" ? "dropdown-visible" : "dropdown-hidden"}`}>
                <nav className="dropdown-nav">
                    {activeMemberId ? (
                        <Link to={`/members/${activeMemberId}`} className="dropdown-link" onClick={closeMenus}>Perfil de Sócio</Link>
                    ) : (
                        <span className="dropdown-disabled">Perfil de Sócio</span>
                    )}
                    {(role === "ADMIN" || role === "SECRETARIA") && (
                        <Link to="/members/list" className="dropdown-link" onClick={closeMenus}>Lista de Sócios</Link>
                    )}
                    <span className="dropdown-disabled">Cotas</span>
                    <Link to="/members/create" className="dropdown-link" onClick={closeMenus}>Tornar-se Sócio</Link>
                </nav>
            </div>
    

            {/* Conta Dropdown Menu */}
            <div className={`dropdown ${activeMenu === "conta" ? "dropdown-visible" : "dropdown-hidden"}`}>
                <nav className="dropdown-nav">
                    <a href="#" className="dropdown-link">Perfil</a>
                    <span className="dropdown-disabled">Informações</span>
                    <span className="dropdown-disabled">Pagamentos</span>
                </nav>
            </div>

            {/* User Dropdown Menu (visivel apenas quando autenticado) */}
            <div className={`dropdown ${activeMenu === "user" ? "dropdown-visible" : "dropdown-hidden"}`}>
                <nav className="dropdown-nav">
                    <span className="dropdown-disabled">Olá, {username}</span>
                    <a href="#" className="dropdown-link">Perfil</a>
                    <button className="dropdown-link" onClick={handleLogoutClick}>Sair</button>
                </nav>
            </div>

            {/* Equipas Dropdown Menu */}
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
                        Inscrição de atletas
                    </Link>
                </nav>
            </div>
        </header>
    );
}