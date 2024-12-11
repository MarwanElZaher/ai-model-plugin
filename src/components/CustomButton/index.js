import { ReactSVG } from "react-svg";
import React from "react";
const CustomButton = ({ onClick, label, iconKey, className, isDisabled, handleKeyDown }) => {
    return (
        <button
            disabled={isDisabled}
            onClick={onClick}
            onKeyDown={!isDisabled ? handleKeyDown : null}
            className={iconKey ? className : `penta-button ${className}`}
            title={label}
        >
            {iconKey && <ReactSVG src={iconKey} />}
            <label>{label}</label>
        </button>
    );
};

export default CustomButton;
