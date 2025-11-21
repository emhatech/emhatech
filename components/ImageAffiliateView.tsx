
import React, { useState, useEffect } from 'react';
import { CharacterImageData, GeneratedImage, LanguageOption } from '../types';
import { SparklesIcon, DownloadIcon } from './Icons';
import { Spinner } from './common/Spinner';
import { ImageLoadingSkeleton } from './common/ImageLoadingSkeleton';
import { ImageUploader } from './common/ImageUploader';
import { TextDisplay } from './common/TextDisplay';
import { JsonDisplay } from './common/JsonDisplay';

interface ImageAffiliateViewProps {
    baseImages: (CharacterImageData | null)[];
    onBaseImageChange: (image: CharacterImageData | null, index: number) => void;
    isGenerating: boolean;
    onGenerate: (useCharacter: boolean, useProduct: boolean) => void;
    generatedImages: (GeneratedImage | null)[];
    videoJsons: string[];
    onDownloadAll: () => void;
    scenario: string;
    onScenarioChange: (scenario: string) => void;
    languages: LanguageOption[];
    selectedLanguage: string;
    onLanguageChange: (language: string) => void;
}

const LockToggle: React.FC<{ label: string; isLocked: boolean; onToggle: () => void; hasImage: boolean }> = ({ label, isLocked, onToggle, hasImage }) => (
    <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{label}</p>
        <button
            onClick={onToggle}
            disabled={!hasImage}
            className={`flex items-center gap-2 px-2 py-1 rounded-md text-xs font-bold transition-all ${
                !hasImage 
                    ? 'opacity-50 cursor-not-allowed bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-500'
                    : isLocked
                        ? 'bg-green-100 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800'
                        : 'bg-slate-100 text-slate-500 border border-slate-200 dark:bg-slate-700 dark:text-slate-400 dark:border-slate-600'
            }`}
            title={isLocked ? "Gambar ini akan digunakan (Terkunci)" : "Gambar ini akan diabaikan"}
        >
            {isLocked ? (
                <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    Dipakai
                </>
            ) : (
                <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2H7V7a3 3 0 015.905-.75 1 1 0 001.937-.5A5.002 5.002 0 0010 2z" />
                    </svg>
                    Diabaikan
                </>
            )}
        </button>
    </div>
);

export const ImageAffiliateView: React.FC<ImageAffiliateViewProps> = ({
    baseImages,
    onBaseImageChange,
    isGenerating,
    onGenerate,
    generatedImages,
    videoJsons,
    onDownloadAll,
    scenario,
    onScenarioChange,
    languages,
    selectedLanguage,
    onLanguageChange,
}) => {
    // State for "Lock" feature
    const [useCharacter, setUseCharacter] = useState(true);
    const [useProduct, setUseProduct] = useState(true);

    // Automatically unlock if image is removed, automatically lock if image is added (if it was previously empty)
    useEffect(() => {
        if (!baseImages[0]) setUseCharacter(false);
        else if (baseImages[0] && !useCharacter) setUseCharacter(true);
    }, [baseImages[0]]);

    useEffect(() => {
        if (!baseImages[1]) setUseProduct(false);
        else if (baseImages[1] && !useProduct) setUseProduct(true);
    }, [baseImages[1]]);

    const hasCharacter = !!baseImages[0];
    const hasProduct = !!baseImages[1];

    // Valid if at least one active image is present and scenario is filled
    const isReadyToGenerate = ((hasCharacter && useCharacter) || (hasProduct && useProduct)) && scenario.trim() !== '';
    
    const hasImages = generatedImages.some(img => img && img.src && !img.isLoading);
    const [fullNarration, setFullNarration] = useState('');

    useEffect(() => {
        if (videoJsons && videoJsons.length > 0) {
            try {
                const narration = videoJsons
                    .map(jsonStr => {
                        const parsed = JSON.parse(jsonStr);
                        return parsed.spoken_script;
                    })
                    .filter(Boolean)
                    .map((script, index) => `Adegan ${index + 1}:\n${script}`)
                    .join('\n\n');
                setFullNarration(narration);
            } catch (error) {
                console.error("Gagal mem-parsing JSON video untuk narasi:", error);
                setFullNarration('');
            }
        } else {
            setFullNarration('');
        }
    }, [videoJsons]);


    return (
        <div className="animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Input Column */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg flex flex-col gap-6">
                    <div>
                         <h2 className="text-xl font-semibold text-cyan-700 dark:text-cyan-400 mb-4">Langkah 1: Konfigurasi</h2>
                         <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Gunakan fitur Lock (🔒) untuk memilih gambar mana yang akan digunakan dalam generasi.</p>
                        
                        <div className="flex flex-col gap-4">
                            <div>
                                <LockToggle 
                                    label="Gambar Karakter" 
                                    isLocked={useCharacter} 
                                    hasImage={hasCharacter}
                                    onToggle={() => hasCharacter && setUseCharacter(!useCharacter)} 
                                />
                                <ImageUploader
                                    image={baseImages[0]}
                                    onImageChange={(newImage) => onBaseImageChange(newImage, 0)}
                                    label=""
                                />
                            </div>
                            
                            <div>
                                <LockToggle 
                                    label="Gambar Produk" 
                                    isLocked={useProduct} 
                                    hasImage={hasProduct}
                                    onToggle={() => hasProduct && setUseProduct(!useProduct)} 
                                />
                                <ImageUploader
                                    image={baseImages[1]}
                                    onImageChange={(newImage) => onBaseImageChange(newImage, 1)}
                                    label=""
                                />
                            </div>

                            <div>
                                <div className="mb-2">
                                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Tulis Skenario UGC</p>
                                </div>
                                <textarea
                                    value={scenario}
                                    onChange={(e) => onScenarioChange(e.target.value)}
                                    rows={3}
                                    className="w-full bg-slate-50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-lg p-3 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 placeholder-slate-400 dark:placeholder-slate-500 transition-colors"
                                    placeholder="Contoh: Saya menemukan produk luar biasa ini yang mengubah rutinitas pagi saya..."
                                />
                            </div>
                             <div>
                                <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Bahasa Prompt Video</p>
                                <div className="relative">
                                    <select
                                        value={selectedLanguage}
                                        onChange={(e) => onLanguageChange(e.target.value)}
                                        className="w-full bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold py-3 px-4 pr-10 rounded-lg border border-slate-300 dark:border-slate-600 appearance-none focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all cursor-pointer"
                                        aria-label="Pilih bahasa untuk prompt video"
                                    >
                                        {languages.map(lang => (
                                            <option key={lang.value} value={lang.value}>{lang.name}</option>
                                        ))}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-700 dark:text-slate-300">
                                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="mt-auto">
                         <h2 className="text-xl font-semibold text-cyan-700 dark:text-cyan-400 mb-4">Langkah 2: Buat Konten</h2>
                        <p className="text-xs text-center text-slate-500 dark:text-slate-400 mb-2">Mode Potret (9:16) akan digunakan untuk konten UGC.</p>
                         <button
                            onClick={() => onGenerate(useCharacter, useProduct)}
                            disabled={!isReadyToGenerate || isGenerating}
                            className="w-full bg-cyan-600 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center transition-all duration-200 hover:bg-cyan-700 disabled:bg-slate-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed disabled:text-slate-500 dark:disabled:text-slate-400 shadow-lg"
                        >
                            {isGenerating ? (
                                <>
                                    <Spinner className="h-5 w-5 mr-3"/>
                                    Membuat Konten...
                                </>
                            ) : (
                                <>
                                    <SparklesIcon className="h-5 w-5 mr-3"/>
                                    Buat 7 Gambar & Prompt Video
                                </>
                            )}
                        </button>
                    </div>
                </div>
                 {/* Output Column */}
                <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-6">
                    <div className="flex justify-between items-center">
                         <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300">Hasil Konten UGC</h2>
                         <button
                            onClick={onDownloadAll}
                            disabled={!hasImages}
                            className="bg-cyan-600 text-white font-bold py-2 px-3 rounded-lg flex items-center justify-center transition-all duration-200 hover:bg-cyan-700 disabled:bg-slate-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed text-sm"
                        >
                            <DownloadIcon className="h-4 w-4 mr-2"/>
                            Unduh Gambar
                        </button>
                    </div>

                    {fullNarration && (
                        <TextDisplay
                            label="Narasi Teks Lengkap (untuk ElevenLabs)"
                            text={fullNarration}
                            copyButtonText="Salin Narasi"
                        />
                    )}

                     <div className="flex flex-col gap-6 overflow-y-auto max-h-[70vh] pr-2">
                        {generatedImages.map((img, index) => (
                             <div key={img?.id || index}>
                                <h3 className="font-semibold text-slate-600 dark:text-slate-400 mb-2">Adegan UGC {index + 1}</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-stretch">
                                    <div className="aspect-[9/16]">
                                        {!img || img.isLoading || !img.src ? (
                                            <ImageLoadingSkeleton aspectRatio="portrait" />
                                        ) : (
                                            <img src={img.src} alt={`Generated scene ${index + 1}`} className="rounded-lg object-cover w-full h-full border border-slate-200 dark:border-slate-600"/>
                                        )}
                                    </div>
                                    <div className="flex flex-col">
                                         <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Prompt Video (JSON)</p>
                                         {isGenerating && !videoJsons[index] ? (
                                            <div className="bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-sm text-slate-500 dark:text-slate-400 p-4 rounded-lg h-full border border-slate-200 dark:border-slate-700">Menghasilkan...</div>
                                         ) : videoJsons[index] ? (
                                            <JsonDisplay jsonString={videoJsons[index]} />
                                         ) : (
                                             <div className="bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-sm text-slate-500 dark:text-slate-400 p-4 rounded-lg h-full border border-slate-200 dark:border-slate-700 text-center">Prompt video akan muncul di sini.</div>
                                         )}
                                    </div>
                                </div>
                             </div>
                        ))}
                        {isGenerating && generatedImages.every(img => !img) && (
                           <div>
                                <h3 className="font-semibold text-slate-600 dark:text-slate-400 mb-2">Membuat Adegan UGC...</h3>
                               <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                   {Array.from({ length: 7 }).map((_, index) => <ImageLoadingSkeleton key={index} aspectRatio="portrait" />)}
                               </div>
                           </div>
                        )}
                        {!isGenerating && generatedImages.every(img => !img) && (
                            <div className="flex flex-col items-center justify-center text-center text-slate-500 dark:text-slate-400 h-full py-10">
                                <SparklesIcon className="h-12 w-12 text-slate-400 dark:text-slate-500 mb-4" />
                                <h3 className="font-semibold text-lg text-slate-600 dark:text-slate-300">Siap untuk Berkreasi</h3>
                                <p>Pilih (Lock) aset yang ingin digunakan dan klik 'Buat'.</p>
                            </div>
                        )}
                     </div>
                </div>

            </div>
        </div>
    );
};
