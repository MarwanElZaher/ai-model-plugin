import { ReactSVG } from "react-svg";
import React from "react";
const CustomButton = ({ onClick, label, iconKey, className, isDisabled }) => {
    return (
        <button
            disabled={isDisabled}
            onClick={onClick}
            className={iconKey ? className : `penta-button ${className}`}
            title={label}
        >
            {iconKey && <ReactSVG src={iconKey} />}
            <label>{label}</label>
        </button>
    );
};
export default CustomButton