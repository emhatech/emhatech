import React, { useState } from 'react';

interface TextDisplayProps {
    text: string;
    label: string;
    rows?: number;
    copyButtonText?: string;
}

export const TextDisplay: React.FC<TextDisplayProps> = ({ text, label, rows = 6, copyButtonText = 'Salin Teks' }) => {
    const [copySuccess, setCopySuccess] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(text).then(() => {
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        });
    };
    
    return (
        <div>
            <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">{label}</label>
                <button 
                    onClick={handleCopy}
                    className="px-3 py-1 text-xs font-semibold rounded-md bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 transition-colors"
                >
                    {copySuccess ? 'Disalin!' : copyButtonText}
                </button>
            </div>
            <textarea
                readOnly
                value={text}
                rows={rows}
                className="w-full bg-slate-100 dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-300 p-4 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors"
            />
        </div>
    );
};
