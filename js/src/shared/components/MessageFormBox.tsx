import React from "react";
import "../styles/FormBox.css";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faCheckCircle, faExclamationCircle, faInfoCircle} from "@fortawesome/free-solid-svg-icons";

interface FormBoxProps {
    type: "error" | "success" | "info";
    message: string;
    className?: string;
}

const iconTypes = {
    error: faExclamationCircle,
    success: faCheckCircle,
    info: faInfoCircle,
};

const FormBox: React.FC<FormBoxProps> = ({type, message, className = ""}) => {
    return (
        <div className={`form-box form-box-${type} ${className}`}>
            <FontAwesomeIcon icon={iconTypes[type]} className={`form-box-icon form-box-icon-${type}`}/>
            <p className="text-sm">{message}</p>
        </div>
    );
};

export default FormBox;


interface StatusBoxProps {
    type: "error" | "success";
    message: string;
}


export const StatusBox: React.FC<StatusBoxProps> = ({type, message}) => {
    return <FormBox type={type} message={message} className="form-box-toast"/>;
};

interface InfoBoxProps {
    message: string;
}


export const InfoBox: React.FC<InfoBoxProps> = ({message}) => {
    return <FormBox type="info" message={message}/>;
};