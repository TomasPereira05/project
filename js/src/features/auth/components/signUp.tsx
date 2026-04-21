import * as React from 'react';
import {useReducer} from 'react';
import { api } from '../api';
import {useNavigate} from "react-router-dom";
import {useStatusHandler} from "../../../shared/hooks/useStatusHandler";
import {StatusBox} from "../../../shared/components/MessageFormBox";
import Form from "../../../shared/components/Form";
import {LOGO_SRC} from "../../../shared/config/config";
import { ArrowLeft } from "lucide-react";

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
            setError("Your repeated password does not match the original password. Please try again.");
            return;
        }
        
        try {
            await api.auth.register(state.username, state.email, state.password);
            clearMessage();
            navigate("/login", {
                state: {
                    username: state.username,
                    message: "Registration successful. You can now log in.",
                },
            });
        } catch (err) {
            await handleError(err);
        }
    };

    const fields = [
        {
            id: "username",
            label: "Username",
            type: "text",
            value: state.username,
            onChange: (e: any) => dispatch({type: "SET_USERNAME", payload: e.target.value}),
            required: true,
            autoComplete: "username",
        },
        {
            id: "email",
            label: "Email",
            type: "email",
            value: state.email,
            onChange: (e: any) => dispatch({type: "SET_EMAIL", payload: e.target.value}),
            required: true,
            autoComplete: "email",
        },
        {
            id: "password",
            label: "Password",
            type: "password",
            value: state.password,
            onChange: (e: any) => dispatch({type: "SET_PASSWORD", payload: e.target.value}),
            required: true,
            autoComplete: "new-password",
        },
        {
            id: "repeatPassword",
            label: "Repeat Password",
            type: "password",
            value: state.repeatPassword,
            onChange: (e: any) => dispatch({type: "SET_REPEAT_PASSWORD", payload: e.target.value}),
            required: true,
            autoComplete: "new-password",
        }
    ];

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

            {/* CENTER CONTENT */}
            <div className="auth-center">

            <div className="auth-card">

                <Form
                    title="Register to Jagoz"
                    fields={fields}
                    onSubmit={handleRegister}
                    logoSrc={LOGO_SRC}
                    submitLabel="Register"
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
