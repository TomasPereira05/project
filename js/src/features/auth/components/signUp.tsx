import * as React from 'react';
import {useReducer} from 'react';
import './styles/Form.css';
import { api } from '../../shared/api/api';
import {useNavigate} from "react-router-dom";
import {useStatusHandler} from "../../shared/hooks/useStatusHandler";
import {StatusBox} from "../../shared/components/MessageFormBox";
import Form from "../../shared/components/Form";
import {LOGO_SRC} from "../../../shared/config/config";

type State = {
    username: string;
    email: string;
    password: string;
    repeatPassword: string;
    invitationCode: string;
};

type Action =
    | { type: "SET_USERNAME"; payload: string }
    | { type: "SET_EMAIL"; payload: string }
    | { type: "SET_PASSWORD"; payload: string }
    | { type: "SET_REPEAT_PASSWORD"; payload: string }
    | { type: "SET_CODE"; payload: string };

const initialState: State = {
    username: "",
    email: "",
    password: "",
    repeatPassword: "",
    invitationCode: "",
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
        case "SET_CODE":
            return {...state, invitationCode: action.payload};
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
          if (state.username && state.email && state.password && state.repeatPassword && state.invitationCode){
                if (state.password === state.repeatPassword) {
                    setIsFormButtonDisabled(false);
                }    
            }
            else{
                setIsFormButtonDisabled(true);
            }
        },[state.email, state.username, state.password, state.repeatPassword, state.invitationCode]);

    const handleRegister = async (event: React.FormEvent) => {
        event.preventDefault();

        if (state.password !== state.repeatPassword) {
            setError("Your repeated password does not match the original password. Please try again.");
            return;
        }

        if (!state.invitationCode.trim()) {
            setError("Invitation Code is required");
            return;
        }
        
        try {
            await api.auth.register(state.username, state.email, state.password, state.invitationCode);
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
        },
        {
            id: "invitationCode",
            label: "Invitation Code",
            type: "text",
            value: state.invitationCode,
            onChange: (e: any) => dispatch({type: "SET_CODE", payload: e.target.value}),
            required: true,
            autoComplete: "off",
        },
    ];

    return (
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

    );
};

export default SignUp;
