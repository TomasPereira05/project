import * as React from 'react';
import {useEffect, useReducer} from 'react';
import {useLocation, useNavigate} from "react-router-dom";
import {useAuth} from "../../../shared/hooks/useAuth";
import { api } from '../api';
import {useStatusHandler} from "../../../shared/hooks/useStatusHandler";
import {InfoBox, StatusBox} from "../../../shared/components/MessageFormBox";
import Form from "../../../shared/components/Form";
import {LOGO_SRC} from "../../../shared/config/config";
import { useTranslation } from "react-i18next";

interface State {
    username: string;
    password: string;
}

type Action =
    | { type: 'SET_USERNAME'; payload: string }
    | { type: 'SET_PASSWORD'; payload: string };

const initialState: State = {
    username: '',
    password: '',
};

const reducer = (state: State, action: Action): State => {
    switch (action.type) {
        case 'SET_USERNAME':
            return {...state, username: action.payload};
        case 'SET_PASSWORD':
            return {...state, password: action.payload};
        default:
            return state;
    }
};

const SignIn: React.FC = () => {
    const { t } = useTranslation();
    const location = useLocation();
    const {message: successMsg, username: prefilledUsername} = location.state || {};
    const [state, dispatch] = useReducer(reducer, {
        ...initialState,
        username: prefilledUsername || "",
    });
    const {message, type, setError, setSuccess, clearMessage, handleError} = useStatusHandler();
    const {username, setAuth} = useAuth();
    const [isFormButtonDisabled, setIsFormButtonDisabled] = React.useState(true);
    const navigate = useNavigate();
    
    useRedirectIfAuthenticated(!!username, '/');
    
    useEffect(() => {
        if (successMsg) {
            setSuccess(successMsg);
        }
    }, [successMsg, setSuccess]);

    useEffect(() => {
          if (state.username && state.password){
                setIsFormButtonDisabled(false);   
            }
            else{
                setIsFormButtonDisabled(true);
            }
        },[state.username, state.password]);

    const handleLogin = async (event: React.FormEvent) => {
        event.preventDefault();
        clearMessage();
        
        try {
            const data = await api.auth.login(state.username, state.password);

            if (data) {
                const me = await api.auth.getMe();
                if (me) {
                    setAuth({
                        id: me.id,
                        email: me.email,
                        username: me.username,
                        role: me.role,
                        activeMemberId: me.activeMemberId
                    });
                } else {
                    setAuth({
                        id: data.id,
                        username: data.username,
                        role: data.role,
                        activeMemberId: data.activeMemberId
                    });
                }
            } else {
                setError(t("auth.signIn.errors.invalidCredentials"));
            }
        } catch (error) {
            handleError(error);
        }
    };

    const fields = [
        {
            id: "username",
            label: t("auth.fields.usernameOrEmail"),
            type: "text",
            value: state.username,
            onChange: (e: any) => dispatch({ type: "SET_USERNAME", payload: e.target.value }),
            required: true,
            autoComplete: "username",
        },
        {
            id: "password",
            label: t("auth.fields.password"),
            type: "password",
            value: state.password,
            onChange: (e: any) => dispatch({ type: "SET_PASSWORD", payload: e.target.value }),
            required: true,
            autoComplete: "current-password",
        },
    ];

    return (
        <div className="auth-center">   
            <div className="auth-card">
                <div className="auth-card-inner">
                    <Form
                    title={t("auth.signIn.title")}
                    fields={fields}
                    onSubmit={handleLogin}
                    logoSrc={LOGO_SRC}
                    submitLabel={t("auth.signIn.submit")}
                    disabled={isFormButtonDisabled}
                    >
                    {message && (type === "error" || type === "success") && (
                        <StatusBox type={type} message={message} />
                    )}

                    <InfoBox 
                    message={t("auth.signIn.noAccount")}
                    action={{
                            label: t("auth.signIn.registerHere"),
                            onClick: () => navigate("/auth/register")
                        }}
                    />
                    </Form>
                </div>
            </div>
        </div>
        );
};

export default SignIn;

function useRedirectIfAuthenticated(isAuthenticated: boolean, redirectTo: string) {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (isAuthenticated) {
            navigate(redirectTo, {state: {source: location.pathname}});
        }
    }, [isAuthenticated, navigate, redirectTo, location]);
}


