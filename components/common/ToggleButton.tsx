import React from 'react';

interface ToggleButtonProps {
    name: string;
    active: boolean;
    onClick: () => void;
    children?: React.ReactNode;
    shape?: 'pill' | 'box';
}

export const ToggleButton: React.FC<ToggleButtonProps> = ({ name, active, onClick, children, shape = 'pill' }) => {
    const shapeClass = shape === 'pill' ? 'rounded-full' : 'rounded-md';

    return (
        <button
            type="button"
            onClick={onClick}
            className={`px-4 py-2 text-sm font-medium ${shapeClass} transition-all duration-200 border flex items-center justify-center gap-2 ${
                active 
                    ? 'bg-cyan-600 text-white border-cyan-600 shadow'
                    : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:border-slate-600 dark:text-slate-300'
            }`}
        >
            {children} {name}
        </button>
    );
};