import * as React from 'react';
import {useEffect, useReducer} from 'react';
import './styles/Form.css';
import {useLocation, useNavigate} from "react-router-dom";
import {useAuth} from "../../shared/hooks/useAuth";
import { api } from '../../shared/api/api';
import {useStatusHandler} from "../../shared/hooks/useStatusHandler";
import {InfoBox, StatusBox} from "../../shared/components/MessageFormBox";
import Form from "../../shared/components/Form";
import {LOGO_SRC} from "../../../shared/config/config";


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
    const location = useLocation();
    const {message: successMsg, username: prefilledUsername} = location.state || {};
    const [state, dispatch] = useReducer(reducer, {
        ...initialState,
        username: prefilledUsername || "",
    });
    const {message, type, setError, setSuccess, clearMessage, handleError} = useStatusHandler();
    const {username, setAuth} = useAuth();

    useRedirectIfAuthenticated(!!username, '/client');
    
    useEffect(() => {
        if (successMsg) {
            setSuccess(successMsg);
        }
    }, [successMsg, setSuccess]);

    const handleLogin = async (event: React.FormEvent) => {
        event.preventDefault();
        clearMessage();
        
        try {
            const data = await api.auth.login(state.username, state.password);

            if (data) {
                setAuth({id: data.id, username: data.username});
            } else {
                setError("Wrong username or password. Please check your credentials and try again.");
            }
        } catch (error) {
            handleError(error);
        }
    };

    const fields = [
        {
            id: "username",
            label: "Username",
            type: "text",
            value: state.username,
            onChange: (e: any) => dispatch({ type: "SET_USERNAME", payload: e.target.value }),
            required: true,
            autoComplete: "username",
        },
        {
            id: "password",
            label: "Password",
            type: "password",
            value: state.password,
            onChange: (e: any) => dispatch({ type: "SET_PASSWORD", payload: e.target.value }),
            required: true,
            autoComplete: "current-password",
        },
    ];

    const infoMessage =
        "You can only register an account after you get invited by someone. Learn more about this here.";

    return (
        <Form
            title="Sign in to Jagoz"
            fields={fields}
            onSubmit={handleLogin}
            logoSrc={LOGO_SRC}
            submitLabel="Sign In"
        >
            {/* Status Box (Error or Success) */}
            {message && (type === "error" || type === "success") && (
                <StatusBox type={type} message={message} />
            )}

            {/* Info Box */}
            <InfoBox message={infoMessage} />
        </Form>
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


