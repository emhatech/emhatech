
import React from 'react';

interface TabButtonProps {
    name: string;
    active: boolean;
    onClick: () => void;
    disabled?: boolean;
    variant?: 'main' | 'sub';
    vertical?: boolean;
}

export const TabButton: React.FC<TabButtonProps> = ({ 
    name, 
    active, 
    onClick, 
    disabled = false, 
    variant = 'main',
    vertical = false 
}) => {
    // Base styles
    const baseStyles = "font-semibold transition-all duration-200 text-left focus:outline-none";
    
    // Disabled state
    const disabledStyles = "opacity-50 cursor-not-allowed";

    let variantStyles = "";

    if (vertical) {
        // Vertical (Sidebar) Style
        const verticalBase = "w-full px-4 py-3 rounded-r-lg border-l-4";
        const verticalActive = "bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-400 border-cyan-600";
        const verticalInactive = "border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200";
        
        variantStyles = `${verticalBase} ${active ? verticalActive : verticalInactive}`;
    } else {
        // Horizontal (Tab) Style
        const horizontalBase = variant === 'main' ? "px-4 py-3 text-sm border-b-2" : "px-4 py-2 text-sm -mb-px border-b-2";
        const horizontalActive = "border-cyan-500 text-cyan-600 dark:text-cyan-400";
        const horizontalInactive = "border-transparent text-slate-500 hover:text-cyan-600 dark:text-slate-400 dark:hover:text-cyan-400";
        
        variantStyles = `${horizontalBase} ${active ? horizontalActive : horizontalInactive}`;
    }
    
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={`${baseStyles} ${variantStyles} ${disabled ? disabledStyles : ''}`}
            aria-current={active ? 'page' : undefined}
        >
            {name}
        </button>
    );
};
