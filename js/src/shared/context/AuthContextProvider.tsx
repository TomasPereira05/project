import {createContext, type ReactNode, useEffect, useState} from "react";
import { api } from "../../features/auth";
import type { AuthContextType } from "../types/AuthContextType";

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({children}) => {
    const [auth, setAuthState] = useState<{ id?: number; username?: string; role?: string; activeMemberId?: number }>({});

    useEffect(() => {
        api.auth.getMe().then(data => {
            if (data) {
                setAuthState({
                    id: data.id, 
                    username: data.username,
                    role: data.role,
                    activeMemberId: data.activeMemberId
                });
            } else {
                setAuthState({});
            }
        });
    }, []);

    const setAuth = (authData: { id?: number; username?: string; role?: string; activeMemberId?: number }) => {
        setAuthState(authData);
    };

    const clearAuth = () => {
        if (auth.id) {
            api.auth.logout().catch(e => console.error("Logout failed", e));
        }
        setAuthState({});
    }

    return (
        <AuthContext.Provider
            value={{
                id: auth.id,
                username: auth.username,
                role: auth.role,
                activeMemberId: auth.activeMemberId,
                setAuth,
                clearAuth,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};