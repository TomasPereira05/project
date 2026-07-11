import { useReducer, useCallback, useRef, useEffect } from 'react';
import i18n from "../i18n";
import { HttpError } from "../types/HttpError";
import { translateHttpError } from "../utils/problemMessages";

export type MessageType = "error" | "success" | null;

export interface MessageState {
    type: MessageType;
    message: string | null;
}

const initialMessageState: MessageState = {
    type: null,
    message: null,
};

type Action =
    | { type: "SET_ERROR"; payload: string }
    | { type: "SET_SUCCESS"; payload: string }
    | { type: "CLEAR_MESSAGE" };

const messageReducer = (state: MessageState, action: Action): MessageState => {
    switch (action.type) {
        case "SET_ERROR":
            return { type: "error", message: action.payload };
        case "SET_SUCCESS":
            return { type: "success", message: action.payload };
        case "CLEAR_MESSAGE":
            return { type: null, message: null };
        default:
            return state;
    }
};

export function useStatusHandler() {
    const [state, dispatch] = useReducer(messageReducer, initialMessageState);
    
    
    const timeoutRef = useRef<number | null>(null);

    
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    
    const clearMessage = useCallback(() => {
        // Se houver um timer ativo pendente, cancela-o para limpar a memória e o estado
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        dispatch({ type: "CLEAR_MESSAGE" });
    }, []);

    
    const showMessage = useCallback((type: "SET_ERROR" | "SET_SUCCESS", message: string) => {
        // Antes de mostrar uma nova mensagem, limpa o timer da anterior para evitar que ela desapareça cedo demais
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        dispatch({ type, payload: message });
        
        // Define um novo timer para limpar a mensagem automaticamente após 20 segundos
        timeoutRef.current = window.setTimeout(() => {
            clearMessage();
        }, 20000);
    }, [clearMessage]);

    
    // useCallback garante que 'setError' é estável e não muda a cada render, prevenindo loops em useEffects dependentes.
    const setError = useCallback((message: string) => {
        showMessage("SET_ERROR", message);
    }, [showMessage]);

    const setSuccess = useCallback((message: string) => {
        showMessage("SET_SUCCESS", message);
    }, [showMessage]);

    
    // Centraliza a lógica de tratamento de erros: decide qual mensagem mostrar baseada no tipo de erro recebido.
    const handleError = useCallback((error: any) => {
        console.error("Error caught in useStatusHandler:", error);

        if (error instanceof HttpError) {
            // Traduz o Problem (reason conhecida ou type) para PT/EN; sem tradução,
            // mostra a mensagem do backend, mais específica do que o title genérico.
            const translated = translateHttpError(error);
            if (translated) {
                setError(translated);
            } else if (error.title) {
                setError(error.title);
            } else {
                setError(i18n.t("problems.types.unknown-error"));
            }
        } else if (error instanceof Error) {

            setError(error.message || i18n.t("problems.types.unknown-error"));
        } else {
             setError(i18n.t("problems.types.unknown-error"));
        }
    }, [setError]);

    return {
        message: state.message,
        type: state.type,
        setError,
        setSuccess,
        clearMessage,
        handleError,
    };
}