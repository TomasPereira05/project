import { useState, useRef, useEffect } from "react";
import {LOGO_SRC} from "../config/config"
import {useNavigate} from "react-router-dom";

export default function Header() {
    const [activeMenu, setActiveMenu] = useState<MenuType>(null);
    const navigate = useNavigate();
    const ref = useRef<HTMLDivElement>(null);

    type MenuType = "mobile" | "socios" | "conta" | null;

    const toggleMenu = (menu: Exclude<MenuType, null>) => {
        setActiveMenu((prev) => (prev === menu ? null : menu));
    };

    const closeMenus = () => {
        setActiveMenu(null);
    };

    const handleLoginClick = () => {
        navigate('/login')
    };

    const handleRegisterClick = () => {
        navigate('/register')
    };

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
                    <div className="logo">
                        <img src={LOGO_SRC} alt="Logo" className="logo-box" />
                        <div>
                            <h1 className="header-title">ERICEIRENSE</h1>
                            <p className="header-subtitle">Grupo Desportivo União Ericeirense</p>
                        </div>
                    </div>
                    <nav className="nav">
                        <a className="nav-link">Início</a>
                        <button className="nav-link" onClick={() => toggleMenu("socios")}>Sócios</button>
                        <button className="nav-link" onClick={() => toggleMenu("conta")}>Conta</button>
                        <span className="nav-disabled">Patrocinios</span>
                        <span className="nav-disabled">Equipas</span>
                    </nav>
                    <div className="header-actions">
                        <button className="btn btn-outline" onClick={handleLoginClick}>Entrar</button>
                        <button className="btn btn-solid" onClick={handleRegisterClick}>Registar</button>
                    </div>
                    <button className="mobile-menu-btn" aria-label="Menu" onClick={() => toggleMenu("mobile")}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M4 12h16"></path>
                            <path d="M4 18h16"></path>
                            <path d="M4 6h16"></path>
                        </svg>
                    </button>
                </div>
            </div>
            
            {/* Mobile Dropdown Menu */}
            <div className={`dropdown ${activeMenu === "mobile" ? "dropdown-visible" : "dropdown-hidden"}`}>
                <nav className="dropdown-nav">
                    <button className="dropdown-link" onClick={() => toggleMenu("socios")}>Sócios</button>
                    <button className="dropdown-link" onClick={() => toggleMenu("conta")}>Conta</button>
                    <span className="dropdown-disabled">Patrocinios</span>
                    <span className="dropdown-disabled">Equipas</span>
                </nav>
                <div className="dropdown-actions">
                    <button className="btn btn-outline" onClick={handleLoginClick}>Entrar</button>
                    <button className="btn btn-solid" onClick={handleRegisterClick}>Registar</button>
                </div>
            </div>
            

            {/* Sócios Dropdown Menu */}
            <div className={`dropdown ${activeMenu === "socios" ? "dropdown-visible" : "dropdown-hidden"}`}>
                <nav className="dropdown-nav">
                    <a href="#" className="dropdown-link">Perfil de Sócio</a>
                    <a href="#" className="dropdown-link">Lista de Sócios</a>
                    <span className="dropdown-disabled">Cotas</span>
                    <span className="dropdown-disabled">Tornar se Sócio</span>
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
        </header>
    );
}