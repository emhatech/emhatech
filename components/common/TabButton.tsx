import React from 'react';

interface TabButtonProps {
    name: string;
    active: boolean;
    onClick: () => void;
    disabled?: boolean;
    variant?: 'main' | 'sub';
}

export const TabButton: React.FC<TabButtonProps> = ({ name, active, onClick, disabled = false, variant = 'main' }) => {
    const baseStyles = "font-semibold border-b-2 transition-colors";
    const activeStyles = "border-cyan-500 text-cyan-600 dark:text-cyan-400";
    const inactiveStyles = "border-transparent text-slate-500 hover:text-cyan-600 dark:text-slate-400 dark:hover:text-cyan-400";
    const disabledStyles = "disabled:text-slate-400 disabled:cursor-not-allowed disabled:hover:text-slate-400 dark:disabled:text-slate-600 dark:disabled:hover:text-slate-600";

    const mainVariantStyles = "px-4 py-3 text-sm";
    const subVariantStyles = "px-4 py-2 text-sm -mb-px";

    const variantClass = variant === 'main' ? mainVariantStyles : subVariantStyles;
    const activeClass = active ? activeStyles : inactiveStyles;
    
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={`${baseStyles} ${variantClass} ${activeClass} ${disabled ? disabledStyles : ''}`}
            aria-current={active ? 'page' : undefined}
        >
            {name}
        </button>
    );
};