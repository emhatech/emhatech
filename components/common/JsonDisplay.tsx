import React, { useState } from 'react';

interface JsonDisplayProps {
    jsonString: string;
}

export const JsonDisplay: React.FC<JsonDisplayProps> = ({ jsonString }) => {
    const [copySuccess, setCopySuccess] = useState(false);

    const handleCopyJson = () => {
        navigator.clipboard.writeText(jsonString).then(() => {
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        });
    };
    
    return (
        <div className="relative h-full">
            <pre className="bg-slate-100 dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-300 p-4 rounded-lg overflow-x-auto h-full border border-slate-200 dark:border-slate-700">
                <code>{jsonString}</code>
            </pre>
            <button 
                onClick={handleCopyJson}
                className="absolute top-2 right-2 px-3 py-1 text-xs font-semibold rounded-md bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 transition-colors"
            >
                {copySuccess ? 'Disalin!' : 'Salin'}
            </button>
        </div>
    );
};
