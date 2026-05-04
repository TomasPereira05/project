import { Outlet } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import {LOGO_SRC,HERO_IMG_SRC} from "../../../shared/config/config";

export default function AuthLayout() {
  return (
    <div className="auth-page">  
                {/* TOPBAR */}
                <div className="auth-topbar">
                <div className="auth-topbar-inner">
    
                    <a href="/" className="auth-logo">
                    <img src={LOGO_SRC} alt="logo" className="h-9 w-auto" />
                    <span className="auth-logo-text">ERICEIRENSE</span>
                    </a>
    
                    <button
                    onClick={() => window.history.back()}
                    className="auth-back-btn"
                    >
                    <ArrowLeft className="h-4 w-4" /> Voltar
                    </button>
    
                </div>
                </div>
                <div
                    className="auth-bg"
                    style={{ backgroundImage: `url(${HERO_IMG_SRC})` }}
                />
                <div className="auth-bg-overlay" />
                <Outlet />
    </div>
  );
}