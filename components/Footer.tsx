
import React from 'react';
import { YouTubeIcon, TikTokIcon, LinkChainIcon } from './Icons';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto py-8 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 transition-colors duration-300 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-6">
        <div className="text-slate-600 dark:text-slate-400 text-sm font-medium order-2 sm:order-1 text-center sm:text-left">
          <p>&copy; {new Date().getFullYear()} By <span className="text-cyan-600 dark:text-cyan-400 font-bold">EmhaTech</span>.</p>
          <p className="text-xs text-slate-400 mt-1">All Rights Reserved. Dilarang keras memodifikasi atau menyalin tanpa izin.</p>
        </div>
        
        <div className="flex items-center gap-6 order-1 sm:order-2">
          <a 
            href="https://www.youtube.com/@EMHATJ" 
            target="_blank" 
            rel="noopener noreferrer"
            className="group flex items-center justify-center p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-300"
            aria-label="YouTube Channel"
            title="YouTube EmhaTech"
          >
            <YouTubeIcon className="h-6 w-6 text-slate-400 group-hover:text-red-600 transition-colors" />
          </a>
          <a 
            href="https://www.tiktok.com/@emhatj" 
            target="_blank" 
            rel="noopener noreferrer"
            className="group flex items-center justify-center p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-300"
            aria-label="TikTok"
            title="TikTok EmhaTech"
          >
            <TikTokIcon className="h-6 w-6 text-slate-400 group-hover:text-black dark:group-hover:text-white transition-colors" />
          </a>
          <a 
            href="https://lynk.id/emhatech" 
            target="_blank" 
            rel="noopener noreferrer"
            className="group flex items-center justify-center p-2 rounded-full hover:bg-cyan-50 dark:hover:bg-cyan-900/20 transition-all duration-300"
            aria-label="Lynk.id"
            title="Lynk.id EmhaTech"
          >
            <LinkChainIcon className="h-6 w-6 text-slate-400 group-hover:text-cyan-600 transition-colors" />
          </a>
        </div>
      </div>
    </footer>
  );
};
