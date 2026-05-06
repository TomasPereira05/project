export type AuthContextType = {
    id?: number;
    username?: string;
    role?: string;
    activeMemberId?: number | null;
    setAuth: (auth: { id?: number; username?: string; role?: string; activeMemberId?: number | null }) => void;
    clearAuth: () => void;
};
