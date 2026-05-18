import * as React from 'react';
import {useReducer} from 'react';
import { api } from '../api';
import {useNavigate} from "react-router-dom";
import {useStatusHandler} from "../../../shared/hooks/useStatusHandler";
import {StatusBox} from "../../../shared/components/MessageFormBox";
import Form from "../../../shared/components/Form";
import {LOGO_SRC} from "../../../shared/config/config";
import { useTranslation } from "react-i18next";

type State = {
    username: string;
    email: string;
    password: string;
    repeatPassword: string;
};

type Action =
    | { type: "SET_USERNAME"; payload: string }
    | { type: "SET_EMAIL"; payload: string }
    | { type: "SET_PASSWORD"; payload: string }
    | { type: "SET_REPEAT_PASSWORD"; payload: string };

const initialState: State = {
    username: "",
    email: "",
    password: "",
    repeatPassword: "",
};

function reducer(state: State, action: Action): State {
    switch (action.type) {
        case "SET_USERNAME":
            return {...state, username: action.payload};
        case "SET_EMAIL":
            return {...state, email: action.payload};
        case "SET_PASSWORD":
            return {...state, password: action.payload};
        case "SET_REPEAT_PASSWORD":
            return {...state, repeatPassword: action.payload};
        default:
            return state;
    }
}

const SignUp: React.FC = () => {
    const { t } = useTranslation();
    const {message, type, setError, clearMessage, handleError} = useStatusHandler();
    const navigate = useNavigate();
    const [state, dispatch] = useReducer(reducer, initialState);
    const [isFormButtonDisabled, setIsFormButtonDisabled] = React.useState(true);

    React.useEffect(() => {
          if (state.username && state.email && state.password && state.repeatPassword){
                if (state.password === state.repeatPassword) {
                    setIsFormButtonDisabled(false);
                }    
            }
            else{
                setIsFormButtonDisabled(true);
            }
        },[state.email, state.username, state.password, state.repeatPassword]);

    const handleRegister = async (event: React.FormEvent) => {
        event.preventDefault();

        if (state.password !== state.repeatPassword) {
            setError(t("auth.signUp.errors.passwordMismatch"));
            return;
        }
        
        try {
            await api.auth.register(state.username, state.email, state.password);
            clearMessage();
            navigate("/auth/login", {
                state: {
                    username: state.username,
                    message: t("auth.signUp.success"),
                },
            });
        } catch (err) {
            await handleError(err);
        }
    };

    const fields = [
        {
            id: "username",
            label: t("auth.fields.username"),
            type: "text",
            value: state.username,
            onChange: (e: any) => dispatch({type: "SET_USERNAME", payload: e.target.value}),
            required: true,
            autoComplete: "username",
        },
        {
            id: "email",
            label: t("auth.fields.email"),
            type: "email",
            value: state.email,
            onChange: (e: any) => dispatch({type: "SET_EMAIL", payload: e.target.value}),
            required: true,
            autoComplete: "email",
        },
        {
            id: "password",
            label: t("auth.fields.password"),
            type: "password",
            value: state.password,
            onChange: (e: any) => dispatch({type: "SET_PASSWORD", payload: e.target.value}),
            required: true,
            autoComplete: "new-password",
        },
        {
            id: "repeatPassword",
            label: t("auth.fields.repeatPassword"),
            type: "password",
            value: state.repeatPassword,
            onChange: (e: any) => dispatch({type: "SET_REPEAT_PASSWORD", payload: e.target.value}),
            required: true,
            autoComplete: "new-password",
        }
    ];

    return (
        <div className="auth-center">
            <div className="auth-card">
                <div className="auth-card-inner">
                <Form
                    title={t("auth.signUp.title")}
                    fields={fields}
                    onSubmit={handleRegister}
                    logoSrc={LOGO_SRC}
                    submitLabel={t("auth.signUp.submit")}
                    disabled = {isFormButtonDisabled}
                >
                    {/* Status Box */}
                    {message && type === "error" && <StatusBox type="error" message={message} />}
                </Form>
                </div>
            </div>
        </div>
    );
};

export default SignUp;
