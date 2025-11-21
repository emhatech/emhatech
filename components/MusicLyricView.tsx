
import React, { useState, useEffect } from 'react';
import { LanguageOption, LyricLine } from '../types';
import { Spinner } from './common/Spinner';
import { TextDisplay } from './common/TextDisplay';
import { MusicNoteIcon, TranslateIcon } from './Icons';

interface MusicLyricViewProps {
  youtubeUrl: string;
  onYoutubeUrlChange: (url: string) => void;
  onGetLyrics: () => void;
  isFetchingLyrics: boolean;
  originalLyrics: string;
  onOriginalLyricsChange: (text: string) => void;
  lyricSources?: { title: string; uri: string }[];
  onTranslateLyrics: () => void;
  isTranslatingLyrics: boolean;
  translatedLyrics: LyricLine[] | null;
  languages: LanguageOption[];
  selectedLanguage: string;
  onLanguageChange: (lang: string) => void;
}

const FUNNY_LOADING_MESSAGES = [
  "Emha Tech sedang keliling dunia mencari lirik... 🌍",
  "Mengecek database Genius, Musixmatch, dan KapanLagi... 🔍",
  "Mendengarkan lagu dengan seksama... 🎧",
  "Mencari chord di warung kopi terdekat... ☕",
  "Menghubungi penyanyi aslinya via DM... 📱",
  "Menerjemahkan sinyal audio menjadi teks... 🤖",
  "Memastikan bahasa lirik sesuai aslinya... 🗣️",
  "Menyusun format Suno AI biar keren... 🎵",
  "Jangan lupa koreksi hasilnya nanti ya... ✅",
  "Hampir selesai, sabar ya... 🚀"
];

export const MusicLyricView: React.FC<MusicLyricViewProps> = ({
  youtubeUrl,
  onYoutubeUrlChange,
  onGetLyrics,
  isFetchingLyrics,
  originalLyrics,
  onOriginalLyricsChange,
  lyricSources = [],
  onTranslateLyrics,
  isTranslatingLyrics,
  translatedLyrics,
  languages,
  selectedLanguage,
  onLanguageChange,
}) => {
  const hasErrorInLyrics = originalLyrics.toLowerCase().includes("gagal") || originalLyrics.toLowerCase().includes("maaf");
  const [copySuccess, setCopySuccess] = useState(false);
  const [currentLoadingMsg, setCurrentLoadingMsg] = useState(FUNNY_LOADING_MESSAGES[0]);

  // Effect to cycle through funny messages
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isFetchingLyrics) {
        // Set initial random message
        setCurrentLoadingMsg(FUNNY_LOADING_MESSAGES[Math.floor(Math.random() * FUNNY_LOADING_MESSAGES.length)]);
        
        interval = setInterval(() => {
            const randomIndex = Math.floor(Math.random() * FUNNY_LOADING_MESSAGES.length);
            setCurrentLoadingMsg(FUNNY_LOADING_MESSAGES[randomIndex]);
        }, 2500); // Change message every 2.5 seconds
    }
    return () => {
        if (interval) clearInterval(interval);
    };
  }, [isFetchingLyrics]);

  const handleCopyTranslation = () => {
    if (!translatedLyrics) return;
    
    // Reconstruct plain text translation
    const plainText = translatedLyrics.map(line => line.translated).join('\n');
    navigator.clipboard.writeText(plainText).then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
    });
  };
  
  const handleCopyOriginal = () => {
      navigator.clipboard.writeText(originalLyrics).then(() => {
          setCopySuccess(true);
          setTimeout(() => setCopySuccess(false), 2000);
      });
  }
  
  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg animate-fade-in transition-colors duration-300 relative">
      <h2 className="text-2xl font-bold text-cyan-700 dark:text-cyan-400 mb-4">Analisis & Ekstraktor Lirik (Suno AI Ready)</h2>
      
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <input
          type="text"
          value={youtubeUrl}
          onChange={(e) => onYoutubeUrlChange(e.target.value)}
          placeholder="Tempelkan tautan YouTube di sini..."
          className="w-full bg-slate-50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-lg p-3 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 placeholder-slate-400 dark:placeholder-slate-500 transition-colors duration-300"
        />
        <button
          onClick={onGetLyrics}
          disabled={!youtubeUrl.trim() || isFetchingLyrics}
          className="w-full sm:w-auto bg-cyan-600 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center transition-all duration-200 hover:bg-cyan-700 disabled:bg-slate-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed"
        >
          {isFetchingLyrics ? (
            <>
              <Spinner className="h-5 w-5 mr-3"/>
              Menganalisis...
            </>
          ) : (
            <>
              <MusicNoteIcon className="h-5 w-5 mr-2"/>
              Cari Lirik Asli
            </>
          )}
        </button>
      </div>

      {/* Funny Loading Popup Overlay */}
      {isFetchingLyrics && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 max-w-md w-full text-center border border-cyan-500/30 transform scale-100 transition-transform">
            <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center justify-center animate-ping opacity-20">
                    <div className="h-16 w-16 bg-cyan-500 rounded-full"></div>
                </div>
                <Spinner className="h-16 w-16 text-cyan-600 dark:text-cyan-400 mx-auto relative z-10" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2 animate-pulse">
                Sedang Bekerja...
            </h3>
            <p className="text-lg text-cyan-700 dark:text-cyan-400 font-medium min-h-[3.5rem] flex items-center justify-center">
                "{currentLoadingMsg}"
            </p>
          </div>
        </div>
      )}

      {originalLyrics && !isFetchingLyrics && (
        <div className="mt-6 border-t border-slate-200 dark:border-slate-700 pt-6">
             {/* Controls for Translation */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6 bg-slate-50 dark:bg-slate-700/30 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <span className="text-sm font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">Terjemahkan ke:</span>
                    <div className="relative w-full sm:w-48">
                         <select
                            value={selectedLanguage}
                            onChange={(e) => onLanguageChange(e.target.value)}
                            disabled={hasErrorInLyrics}
                            className="w-full bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold py-2 px-4 pr-8 rounded-lg border border-slate-300 dark:border-slate-600 appearance-none focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all cursor-pointer disabled:opacity-50 text-sm"
                        >
                            {languages.map(lang => (
                                <option key={lang.value} value={lang.value}>{lang.name}</option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-700 dark:text-slate-300">
                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                        </div>
                    </div>
                </div>
                
                <div className="flex gap-2 w-full sm:w-auto">
                     {translatedLyrics && (
                        <button
                            onClick={handleCopyTranslation}
                            className="px-4 py-2 text-sm font-semibold bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 transition-colors w-full sm:w-auto"
                        >
                             {copySuccess ? 'Tersalin!' : 'Salin Terjemahan'}
                        </button>
                    )}
                    <button
                        onClick={onTranslateLyrics}
                        disabled={isTranslatingLyrics || hasErrorInLyrics}
                        className="px-6 py-2 bg-amber-500 text-white font-bold rounded-lg flex items-center justify-center transition-all duration-200 hover:bg-amber-600 disabled:bg-slate-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed w-full sm:w-auto text-sm"
                    >
                        {isTranslatingLyrics ? (
                            <>
                            <Spinner className="h-4 w-4 mr-2" />
                            Menerjemahkan...
                            </>
                        ) : (
                            <>
                            <TranslateIcon className="h-4 w-4 mr-2" />
                            {translatedLyrics ? 'Terjemahkan Ulang' : 'Terjemahkan Lirik'}
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Lyric Display Area */}
            {isTranslatingLyrics ? (
                 <div className="w-full h-64 bg-slate-100 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 animate-pulse">
                    <TranslateIcon className="h-12 w-12 mb-4 opacity-50"/>
                    <p>AI sedang menyinkronkan lirik dan menerjemahkan...</p>
                </div>
            ) : translatedLyrics ? (
                <div className="bg-slate-50 dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                    <div className="grid grid-cols-1 md:grid-cols-2 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-300 sticky top-0 z-10">
                        <div className="p-4">Lirik & Struktur (Suno AI Ready)</div>
                        <div className="p-4 border-l border-slate-200 dark:border-slate-700">Terjemahan ({languages.find(l => l.value === selectedLanguage)?.name})</div>
                    </div>
                    <div className="divide-y divide-slate-200 dark:divide-slate-700/50">
                        {translatedLyrics.map((line, index) => (
                            <div key={index} className="grid grid-cols-1 md:grid-cols-2 hover:bg-white dark:hover:bg-slate-800/50 transition-colors group">
                                <div className="p-3 md:p-4 text-slate-600 dark:text-slate-400 text-sm md:text-base leading-relaxed whitespace-pre-wrap font-mono">
                                    {line.original || <span className="italic opacity-30">...</span>}
                                </div>
                                <div className="p-3 md:p-4 text-cyan-800 dark:text-cyan-300 md:border-l border-slate-200 dark:border-slate-700 text-sm md:text-base font-medium leading-relaxed whitespace-pre-wrap font-mono">
                                    {line.translated}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                // Fallback: Show original lyrics only if no translation yet
                 <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                            <MusicNoteIcon className="h-5 w-5 text-cyan-600" />
                            Lirik Asli & Struktur
                        </h3>
                        <button 
                            onClick={handleCopyOriginal}
                            className="px-3 py-1 text-xs font-semibold rounded-md bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 transition-colors"
                        >
                            {copySuccess ? 'Disalin!' : 'Salin'}
                        </button>
                    </div>
                    
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                        Silakan periksa hasilnya. AI telah mencari lirik terbaik dari sumber-sumber berikut:
                    </p>

                     {/* Source Links Display */}
                     {lyricSources && lyricSources.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                            {lyricSources.slice(0, 3).map((source, idx) => (
                                <a 
                                    key={idx} 
                                    href={source.uri} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-xs bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 px-2 py-1 rounded-md text-cyan-700 dark:text-cyan-400 truncate max-w-[200px]"
                                >
                                    {source.title || source.uri}
                                </a>
                            ))}
                        </div>
                    )}

                    <p className="text-xs text-amber-600 dark:text-amber-400 mb-3 bg-amber-50 dark:bg-amber-900/30 p-2 rounded border border-amber-200 dark:border-amber-800">
                        ⚠️ <strong>Mode Edit Manual:</strong> Jika ada lirik yang kurang pas atau salah ketik, Anda bisa mengedit teks di bawah ini sebelum menerjemahkan.
                    </p>

                    <textarea
                        value={originalLyrics}
                        onChange={(e) => onOriginalLyricsChange(e.target.value)}
                        rows={20}
                        className="w-full bg-white dark:bg-slate-800 text-sm font-mono text-slate-700 dark:text-slate-300 p-4 rounded-lg border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors resize-y shadow-inner"
                        spellCheck={false}
                    />
                 </div>
            )}
        </div>
      )}
    </div>
  );
};
