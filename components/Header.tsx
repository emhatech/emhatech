
import React from 'react';
import { FilmIcon, SunIcon, MoonIcon, CogIcon } from './Icons';

interface HeaderProps {
    theme: 'light' | 'dark';
    onThemeToggle: () => void;
    onApiKeySettingsClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ theme, onThemeToggle, onApiKeySettingsClick }) => {
  return (
    <header className="flex items-center justify-between">
        <div className="flex items-center text-center sm:text-left">
            <div className="bg-cyan-600 p-3 rounded-lg mr-4 shadow-md">
                <FilmIcon className="h-8 w-8 text-white"/>
            </div>
            <div>
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight led-text-animation text-cyan-600 dark:text-cyan-400">EMHATECH AI GENERATOR</h1>
                <p className="text-cyan-700 dark:text-cyan-400 mt-1 text-sm sm:text-base">Wujudkan Visi Kreatif Anda dengan Cerita & Visual AI</p>
            </div>
        </div>
        <div className="flex items-center gap-2">
            <button
                onClick={onThemeToggle}
                className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                aria-label="Ganti tema"
            >
                {theme === 'light' ? <MoonIcon className="h-6 w-6" /> : <SunIcon className="h-6 w-6" />}
            </button>
            <button
                onClick={onApiKeySettingsClick}
                className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                aria-label="Pengaturan Kunci API"
            >
                <CogIcon className="h-6 w-6" />
            </button>
        </div>
    </header>
  );
};