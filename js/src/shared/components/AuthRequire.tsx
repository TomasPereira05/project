import * as React from "react"
import {Navigate, useLocation} from "react-router-dom"
import {useAuth} from "../hooks/useAuth";
import {createContext, type ReactNode, useEffect, useState} from "react";
import { api } from "../../features/auth";

type AuthContextType = {
    id?: number;
    username?: string;
    setAuth: (auth: { id?: number; username?: string }) => void;
    clearAuth: () => void;
};


export const AuthContext = createContext<AuthContextType | undefined>(undefined);


export const AuthProvider: React.FC<{ children: ReactNode }> = ({children}) => {
    const [auth, setAuthState] = useState<{ id?: number; username?: string }>({});

    useEffect(() => {
        api.auth.getMe().then(data => {
            if (data) {
                setAuthState({id: data.id, username: data.username});
            } else {
                setAuthState({});
            }
        });
    }, []);

    const setAuth = (authData: { id?: number; username?: string }) => {
        setAuthState(authData);
    };

    const clearAuth = () => {
        if (auth.id) {
            api.auth.logout(auth.id).catch(e => console.error("Logout failed", e));
        }
        setAuthState({});
    }

    return (
        <AuthContext.Provider
            value={{
                id: auth.id,
                username: auth.username,
                setAuth,
                clearAuth,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};



/* redireciona os utilizadores para Login caso de não autenticado*/ 
export function AuthRequire({children}: { children: React.ReactNode }) {
    const {username} = useAuth()
    const location = useLocation()
    if (username) {
        return <>{children}</>
    } else {
        return <Navigate to={"/login"} state={{source: location.pathname}}></Navigate>
    }
}