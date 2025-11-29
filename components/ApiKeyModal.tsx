import React, { useState, useEffect } from 'react';
import { XIcon, PlusIcon, TrashIcon } from './Icons';

interface ApiKeyModalProps {
  isOpen: boolean;
  currentApiKeys: string[];
  onClose: () => void;
  onSave: (newKeys: string[]) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, currentApiKeys, onClose, onSave }) => {
  const [apiKeysInput, setApiKeysInput] = useState<string[]>(['']);

  useEffect(() => {
    if (isOpen) {
      setApiKeysInput(currentApiKeys.length > 0 ? currentApiKeys : ['']);
    }
  }, [currentApiKeys, isOpen]);

  const handleSave = () => {
    onSave(apiKeysInput.filter(key => key.trim() !== ''));
  };
  
  const handleKeydown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter') {
      handleSave();
    }
  }

  const handleKeyChange = (indexToChange: number, value: string) => {
    const newKeys = [...apiKeysInput];
    newKeys[indexToChange] = value;
    setApiKeysInput(newKeys);
  }

  const handleAddKey = () => {
    if (apiKeysInput.length < 10) {
      setApiKeysInput([...apiKeysInput, '']);
    }
  }

  const handleRemoveKey = (indexToRemove: number) => {
    if (apiKeysInput.length > 1) {
      setApiKeysInput(apiKeysInput.filter((_, index) => index !== indexToRemove));
    }
  }

  if (!isOpen) return null;

  return (
    <div 
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center animate-fade-in"
        aria-modal="true"
        role="dialog"
        onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 w-full max-w-md m-4 transition-colors duration-300" 
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeydown}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Kelola Kunci API Gemini</h2>
          <button onClick={onClose} className="p-1 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700">
            <XIcon className="h-5 w-5" />
          </button>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
          Masukkan hingga 10 kunci API. Kunci akan dicoba secara berurutan. Kunci Anda disimpan dengan aman di browser Anda.
        </p>
        <div className="mb-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded p-3 text-xs text-amber-800 dark:text-amber-200">
            <strong>⚠️ WAJIB UNTUK VEO (VIDEO):</strong> <br/>
            Untuk menggunakan fitur Video Generator (Veo), API Key Anda HARUS berasal dari <strong>Google Cloud Project</strong> dengan <strong>Billing (Kartu Kredit) Aktif</strong>. 
            <br/><br/>
            Key gratis dari AI Studio (aistudio.google.com) biasanya <strong>tidak support Veo</strong> (Akan error 404).
        </div>
        <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
            {apiKeysInput.map((key, index) => (
                <div key={index} className="flex items-center gap-2">
                    <input
                        type="password"
                        value={key}
                        onChange={(e) => handleKeyChange(index, e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg p-3 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 placeholder-slate-400 dark:placeholder-slate-500 transition-colors duration-300"
                        placeholder={`Kunci API #${index + 1}`}
                    />
                    {apiKeysInput.length > 1 && (
                         <button
                            onClick={() => handleRemoveKey(index)}
                            className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-red-100 dark:hover:bg-red-900/50 hover:text-red-600 dark:hover:text-red-500 transition-colors"
                            aria-label={`Hapus Kunci API #${index + 1}`}
                        >
                            <TrashIcon className="h-5 w-5" />
                        </button>
                    )}
                </div>
            ))}
        </div>
        
        {apiKeysInput.length < 10 && (
             <button
                onClick={handleAddKey}
                className="w-full mt-4 px-4 py-2 text-sm font-semibold border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 rounded-lg hover:border-cyan-500 hover:text-cyan-600 dark:hover:text-cyan-500 transition-colors flex items-center justify-center gap-2"
            >
                <PlusIcon className="h-4 w-4" />
                Tambah Kunci Lain
            </button>
        )}
       
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-semibold bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
          >
            Simpan Kunci
          </button>
        </div>
      </div>
    </div>
  );
};