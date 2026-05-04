export type AuthContextType = {
    id?: number;
    username?: string;
    role?: string;
    activeMemberId?: number;
    setAuth: (auth: { id?: number; username?: string; role?: string; activeMemberId?: number }) => void;
    clearAuth: () => void;
};