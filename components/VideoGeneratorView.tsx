
import React, { useState } from 'react';
import { optimizeVideoPrompt } from '../services/geminiService';
import { Spinner } from './common/Spinner';
import { VideoCameraIcon, LinkChainIcon, SparklesIcon } from './Icons';
import { TextDisplay } from './common/TextDisplay';

export const VideoGeneratorView: React.FC = () => {
    const [simpleIdea, setSimpleIdea] = useState('');
    const [optimizedPrompt, setOptimizedPrompt] = useState('');
    const [isOptimizing, setIsOptimizing] = useState(false);

    const handleOptimize = async () => {
        if (!simpleIdea.trim()) return;
        setIsOptimizing(true);
        try {
            const result = await optimizeVideoPrompt(simpleIdea);
            setOptimizedPrompt(result);
        } catch (error) {
            console.error(error);
            alert("Gagal mengoptimalkan prompt.");
        } finally {
            setIsOptimizing(false);
        }
    };

    const openExternalTool = () => {
        window.open('https://grok.com/', '_blank');
    };

    return (
        <div className="animate-fade-in space-y-6 pb-6">
            {/* Prompt Optimizer Section */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-md">
                <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1">
                        <div className="flex items-center mb-4">
                            <div className="bg-cyan-600 text-white p-2 rounded-lg mr-3 shadow-sm">
                                <SparklesIcon className="h-5 w-5" />
                            </div>
                            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                                1. Buat Prompt Grok
                            </h2>
                        </div>
                        
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={simpleIdea}
                                onChange={(e) => setSimpleIdea(e.target.value)}
                                className="flex-grow bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-600 rounded-lg p-3 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                placeholder="Ide visual: Astronot minum kopi di Mars..."
                                onKeyDown={(e) => e.key === 'Enter' && handleOptimize()}
                            />
                            <button
                                onClick={handleOptimize}
                                disabled={isOptimizing || !simpleIdea.trim()}
                                className="bg-slate-800 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center hover:bg-slate-900 transition-all disabled:opacity-50 whitespace-nowrap text-sm"
                            >
                                {isOptimizing ? <Spinner className="h-4 w-4" /> : "Optimalkan"}
                            </button>
                        </div>
                    </div>

                    <div className="flex-1">
                        <div className="flex items-center mb-4 justify-between">
                            <div className="flex items-center">
                                <div className="bg-green-600 text-white p-2 rounded-lg mr-3 shadow-sm">
                                    <VideoCameraIcon className="h-5 w-5" />
                                </div>
                                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                                    2. Salin Hasil
                                </h2>
                            </div>
                            {optimizedPrompt && (
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full dark:bg-green-900 dark:text-green-300">Siap disalin</span>
                            )}
                        </div>
                        
                        <TextDisplay 
                            label="" 
                            text={optimizedPrompt || "Hasil prompt akan muncul di sini..."} 
                            rows={3}
                            copyButtonText="Salin"
                        />
                    </div>
                </div>
            </div>

            {/* Iframe Embed Section */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden flex flex-col h-[800px]">
                <div className="bg-slate-100 dark:bg-slate-900 p-3 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                         <div className="w-3 h-3 rounded-full bg-red-400"></div>
                         <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                         <div className="w-3 h-3 rounded-full bg-green-400"></div>
                         <span className="ml-2 text-xs font-mono text-slate-500 dark:text-slate-400">grok.com</span>
                    </div>
                    <button 
                        onClick={openExternalTool}
                        className="text-xs flex items-center gap-1 text-cyan-600 dark:text-cyan-400 hover:underline font-semibold"
                    >
                        <LinkChainIcon className="h-3 w-3" />
                        Buka di Tab Baru (Lebih Cepat)
                    </button>
                </div>
                
                <div className="flex-grow relative bg-slate-50 dark:bg-black">
                     <iframe 
                        src="https://grok.com/"
                        className="w-full h-full border-0"
                        title="Grok AI Generator"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                     />
                     <div className="absolute top-0 left-0 w-full h-full pointer-events-none flex items-center justify-center bg-white dark:bg-slate-900 -z-10">
                        <div className="flex flex-col items-center">
                            <Spinner className="h-8 w-8 text-slate-400 mb-2" />
                            <p className="text-slate-500">Memuat Website...</p>
                        </div>
                     </div>
                </div>
            </div>
            
            <p className="text-center text-xs text-slate-400 dark:text-slate-500">
                Catatan: Website di dalam kotak ini adalah layanan pihak ketiga (Grok). Kecepatannya bergantung pada server mereka.
                <br/>Jika terasa lambat atau berat, silakan klik tombol <strong>"Buka di Tab Baru"</strong> di pojok kanan atas kotak.
            </p>
        </div>
    );
};
