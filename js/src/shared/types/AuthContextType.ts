export type AuthState = {
    id?: number;
    email?: string;
    username?: string;
    role?: string;
    activeMemberId?: number | null;
};

export type AuthContextType = AuthState & {
    setAuth: (auth: AuthState) => void;
    clearAuth: () => void;
};
