import type { RequireProps } from "../types/RequireProps";
import { useAuth } from "../hooks/useAuth";
import { Navigate, useLocation } from "react-router-dom";

export function Require({ children, allowAdmin, allowSecretaria, allowMember }: RequireProps) {
  const { role, activeMemberId } = useAuth();

  const hasAdmin = role === "ADMIN";
  const hasSecretaria = role === "SECRETARIA";
  const hasMember = activeMemberId != null;

  if (
    (allowAdmin && hasAdmin) ||
    (allowSecretaria && hasSecretaria) ||
    (allowMember && hasMember)
  ) {
    return <>{children}</>;
  }

  return <Navigate to="/members/create" replace />;
}

/* redireciona os utilizadores para Login caso de não autenticado*/ 
export function AuthRequire({children}: { children: React.ReactNode }) {
    const {username} = useAuth()
    const location = useLocation()
    if (username) {
        return <>{children}</>
    } else {
        return <Navigate to={"/auth/login"} state={{source: location.pathname}}></Navigate>
    }
}