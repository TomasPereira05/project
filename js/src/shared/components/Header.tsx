import { useState } from "react";
import {LOGO_SRC} from "../config/config"

export default function Header() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    return (
        <header className="header">
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
                        <a href="#" className="nav-link">Início</a>
                        <span className="nav-disabled">Notícias</span>
                        <span className="nav-disabled">Equipa</span>
                    </nav>
                    <div className="header-actions">
                        <button className="btn btn-outline">Entrar</button>
                        <button className="btn btn-solid">Registar</button>
                    </div>
                    <button className="mobile-menu-btn" aria-label="Menu" onClick={toggleMobileMenu}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M4 12h16"></path>
                            <path d="M4 18h16"></path>
                            <path d="M4 6h16"></path>
                        </svg>
                    </button>
                </div>
            </div>
            
            {/* Mobile Dropdown Menu */}
            {isMobileMenuOpen && (
                <div className="mobile-dropdown">
                    <nav className="mobile-nav">
                        <a href="#" className="mobile-nav-link">Início</a>
                        <span className="mobile-nav-disabled">Notícias</span>
                        <span className="mobile-nav-disabled">Equipa</span>
                    </nav>
                    <div className="mobile-header-actions">
                        <button className="btn btn-outline">Entrar</button>
                        <button className="btn btn-solid">Registar</button>
                    </div>
                </div>
            )}
        </header>
    );
}