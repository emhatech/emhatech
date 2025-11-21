import React from 'react';
import { VideoCameraIcon } from './Icons';

export const UnlimitedVeoView: React.FC = () => {
  return (
    <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg animate-fade-in transition-colors duration-300 max-w-4xl mx-auto">
        <div className="flex flex-col items-center text-center">
            <div className="bg-violet-600 p-4 rounded-full mb-4 shadow-md">
                <VideoCameraIcon className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                Fiture Unlimited Veo
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2 max-w-2xl">
                Akses alat generator video Veo eksternal untuk pembuatan video tanpa batas. Klik tombol di bawah ini untuk membuka generator di tab baru dan mulai membuat video Anda.
            </p>
            <a
                href="https://veoaifree.com/veo-video-generator/"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 bg-violet-600 text-white font-bold py-3 px-8 rounded-lg flex items-center justify-center transition-all duration-200 hover:bg-violet-700 shadow-lg text-lg"
            >
                <VideoCameraIcon className="h-6 w-6 mr-3"/>
                Buka Generator Veo
            </a>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-4">
                Anda akan diarahkan ke situs web eksternal.
            </p>
        </div>
    </div>
  );
};
