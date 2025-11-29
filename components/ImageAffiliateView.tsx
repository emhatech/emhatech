
import React, { useState, useEffect } from 'react';
import { CharacterImageData, GeneratedImage, LanguageOption, ProductCategory } from '../types';
import { PRODUCT_CATEGORIES } from '../constants';
import { SparklesIcon, DownloadIcon, RefreshIcon, MusicNoteIcon, XIcon, VideoCameraIcon } from './Icons';
import { Spinner } from './common/Spinner';
import { ImageLoadingSkeleton } from './common/ImageLoadingSkeleton';
import { ImageUploader } from './common/ImageUploader';
import { TextDisplay } from './common/TextDisplay';

interface ImageAffiliateViewProps {
    baseImages: (CharacterImageData | null)[];
    onBaseImageChange: (image: CharacterImageData | null, index: number) => void;
    isGenerating: boolean;
    onGenerate: (useCharacter: boolean, useProduct: boolean, productCategory: ProductCategory) => void;
    generatedImages: (GeneratedImage | null)[];
    videoJsons: string[];
    onDownloadAll: () => void;
    scenario: string;
    onScenarioChange: (scenario: string) => void;
    languages: LanguageOption[];
    selectedLanguage: string;
    onLanguageChange: (language: string) => void;
    onRegenerate: (index: number, useCharacter: boolean, useProduct: boolean, productCategory: ProductCategory) => void;
    characterDesc: string;
    onCharacterDescChange: (text: string) => void;
    productDesc: string;
    onProductDescChange: (text: string) => void;
    shotType: string;
    onShotTypeChange: (type: string) => void;
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
    languages,
    selectedLanguage,
    onLanguageChange,
    onRegenerate,
    characterDesc,
    onCharacterDescChange,
    productDesc,
    onProductDescChange,
    shotType,
    onShotTypeChange
}) => {
    const [useCharacter, setUseCharacter] = useState(true);
    const [useProduct, setUseProduct] = useState(true);
    const [productCategory, setProductCategory] = useState<ProductCategory>('general');

    // Automatically unlock if image is removed, automatically lock if image is added
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

    const isReadyToGenerate = (hasCharacter && useCharacter) || (hasProduct && useProduct);
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
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Input Column (Slimmer) */}
                <div className="lg:col-span-4 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg flex flex-col gap-6 h-fit">
                    <div>
                         <h2 className="text-xl font-semibold text-cyan-700 dark:text-cyan-400 mb-4">Langkah 1: Konfigurasi Cerdas</h2>
                         <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Unggah Karakter & Produk untuk hasil gabungan yang pintar.</p>
                        
                        <div className="flex flex-col gap-6">
                            {/* Character Section */}
                            <div className="bg-slate-50 dark:bg-slate-700/30 p-3 rounded-xl border border-slate-100 dark:border-slate-600">
                                <LockToggle 
                                    label="Karakter" 
                                    isLocked={useCharacter} 
                                    hasImage={hasCharacter}
                                    onToggle={() => hasCharacter && setUseCharacter(!useCharacter)} 
                                />
                                <ImageUploader
                                    image={baseImages[0]}
                                    onImageChange={(newImage) => onBaseImageChange(newImage, 0)}
                                    label=""
                                    heightClass="h-40"
                                />
                                <div className="mt-3">
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                                        Deskripsi Visual Karakter (Opsional)
                                    </label>
                                    <textarea
                                        value={characterDesc}
                                        onChange={(e) => onCharacterDescChange(e.target.value)}
                                        className="w-full bg-white dark:bg-slate-700 text-xs text-slate-700 dark:text-slate-200 p-2 rounded-lg border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none h-20"
                                        placeholder="Contoh: Rambut merah panjang, jaket kulit hitam, wajah asia..."
                                    />
                                </div>
                            </div>
                            
                            {/* Product Section */}
                            <div className="bg-slate-50 dark:bg-slate-700/30 p-3 rounded-xl border border-slate-100 dark:border-slate-600">
                                <LockToggle 
                                    label="Produk" 
                                    isLocked={useProduct} 
                                    hasImage={hasProduct}
                                    onToggle={() => hasProduct && setUseProduct(!useProduct)} 
                                />
                                <ImageUploader
                                    image={baseImages[1]}
                                    onImageChange={(newImage) => onBaseImageChange(newImage, 1)}
                                    label=""
                                    heightClass="h-40"
                                />
                                
                                <div className="mt-3">
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                                        Deskripsi Detail Produk (Opsional)
                                    </label>
                                    <textarea
                                        value={productDesc}
                                        onChange={(e) => onProductDescChange(e.target.value)}
                                        className="w-full bg-white dark:bg-slate-700 text-xs text-slate-700 dark:text-slate-200 p-2 rounded-lg border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none h-20 mb-3"
                                        placeholder="Contoh: Botol serum hijau, tulisan 'GLOW', tekstur cair..."
                                    />
                                </div>

                                {hasProduct && useProduct && (
                                    <div className="animate-fade-in">
                                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase">
                                            Kategori Produk (Agar AI Paham)
                                        </label>
                                        <div className="relative">
                                            <select
                                                value={productCategory}
                                                onChange={(e) => setProductCategory(e.target.value as ProductCategory)}
                                                className="w-full bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs py-2 px-3 pr-8 rounded-lg border border-slate-300 dark:border-slate-600 appearance-none focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer"
                                            >
                                                {PRODUCT_CATEGORIES.map(cat => (
                                                    <option key={cat.value} value={cat.value}>
                                                        {cat.label}
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                                                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-cyan-600 dark:text-cyan-400 mt-1 italic">
                                            *AI akan otomatis mengatur pose: {PRODUCT_CATEGORIES.find(c => c.value === productCategory)?.actionVerb}
                                        </p>
                                    </div>
                                )}
                            </div>
                            
                            {/* Camera Shot & Language */}
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Gaya Kamera / Shot Type</p>
                                    <div className="relative">
                                        <select
                                            value={shotType}
                                            onChange={(e) => onShotTypeChange(e.target.value)}
                                            className="w-full bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold py-3 px-4 pr-10 rounded-lg border border-slate-300 dark:border-slate-600 appearance-none focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all cursor-pointer"
                                        >
                                            <option value="default">Default (Cinematic Mix)</option>
                                            <option value="hand_focus">Hand Focus (Tangan & Produk)</option>
                                            <option value="closeup">Close Up (Detail Wajah/Produk)</option>
                                            <option value="medium">Medium Shot (Setengah Badan)</option>
                                            <option value="fullbody">Full Body (Seluruh Badan/OOTD)</option>
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-700 dark:text-slate-300">
                                            <VideoCameraIcon className="h-4 w-4"/>
                                        </div>
                                    </div>
                                </div>
                                
                                <div>
                                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Bahasa Konten</p>
                                    <div className="relative">
                                        <select
                                            value={selectedLanguage}
                                            onChange={(e) => onLanguageChange(e.target.value)}
                                            className="w-full bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold py-3 px-4 pr-10 rounded-lg border border-slate-300 dark:border-slate-600 appearance-none focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all cursor-pointer"
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
                    </div>
                    
                    <div className="mt-4">
                         <h2 className="text-xl font-semibold text-cyan-700 dark:text-cyan-400 mb-4">Langkah 2: Buat Konten</h2>
                         <button
                            onClick={() => onGenerate(useCharacter, useProduct, productCategory)}
                            disabled={!isReadyToGenerate || isGenerating}
                            className="w-full bg-cyan-600 text-white font-bold py-4 px-4 rounded-lg flex items-center justify-center transition-all duration-200 hover:bg-cyan-700 disabled:bg-slate-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed disabled:text-slate-500 dark:disabled:text-slate-400 shadow-lg"
                        >
                            {isGenerating ? (
                                <>
                                    <Spinner className="h-5 w-5 mr-3"/>
                                    Memproses Cerdas...
                                </>
                            ) : (
                                <>
                                    <SparklesIcon className="h-5 w-5 mr-3"/>
                                    Generate Smart UGC
                                </>
                            )}
                        </button>
                    </div>
                </div>

                 {/* Output Column (Wider) */}
                <div className="lg:col-span-8 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-6">
                    <div className="flex justify-between items-center">
                         <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300">Hasil Smart UGC & Prompt Data</h2>
                         <button
                            onClick={onDownloadAll}
                            disabled={!hasImages}
                            className="bg-cyan-600 text-white font-bold py-2 px-3 rounded-lg flex items-center justify-center transition-all duration-200 hover:bg-cyan-700 disabled:bg-slate-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed text-sm"
                        >
                            <DownloadIcon className="h-4 w-4 mr-2"/>
                            Unduh Semua
                        </button>
                    </div>

                    {/* List View - Image Side-by-Side with JSON/Prompt */}
                     <div className="flex flex-col gap-6 overflow-y-auto max-h-[80vh] pr-2">
                        {generatedImages.map((img, index) => {
                            const jsonStr = videoJsons[index];
                            let jsonObj = null;
                            try {
                                jsonObj = jsonStr ? JSON.parse(jsonStr) : null;
                            } catch (e) {}
                            
                            // State Logic:
                            // 1. Loading: img exists and isLoading is true
                            // 2. Error: img exists, isLoading is false, src is null
                            // 3. Success: img exists, src has content
                            // 4. Waiting: img is null (skeleton placeholder)
                            
                            const isLoading = img?.isLoading;
                            const isError = img && !img.isLoading && !img.src;
                            const isSuccess = img && img.src;
                            const isWaiting = !img;

                            return (
                                <div key={img?.id || index} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row gap-4">
                                    {/* Left Side: Image */}
                                    <div className="w-full md:w-1/3 flex-shrink-0">
                                        <div className="aspect-[9/16] relative group rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                                            {isWaiting || isLoading ? (
                                                <ImageLoadingSkeleton aspectRatio="portrait" />
                                            ) : isError ? (
                                                 <div className="w-full h-full flex flex-col items-center justify-center text-center p-4">
                                                    <XIcon className="h-10 w-10 text-red-400 mb-2"/>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Gagal memuat gambar</p>
                                                    <button 
                                                        onClick={() => onRegenerate(index, useCharacter, useProduct, productCategory)}
                                                        className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-lg text-xs font-semibold transition-colors"
                                                    >
                                                        Coba Lagi
                                                    </button>
                                                </div>
                                            ) : (
                                                <>
                                                    <img src={img!.src!} alt={`Generated scene ${index + 1}`} className="object-cover w-full h-full"/>
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() => onRegenerate(index, useCharacter, useProduct, productCategory)}
                                                            className="p-2 bg-white/20 rounded-full text-white hover:bg-white/40 backdrop-blur-sm"
                                                            title="Regenerate Image"
                                                        >
                                                            <RefreshIcon className="h-6 w-6"/>
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                        <p className="text-center text-xs font-bold text-slate-500 dark:text-slate-400 mt-2">Scene {index + 1}</p>
                                    </div>

                                    {/* Right Side: Prompt & JSON Data */}
                                    <div className="w-full md:w-2/3 flex flex-col gap-3">
                                        {jsonObj ? (
                                            <>
                                                <div className="bg-slate-100 dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                                                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Visual Prompt (AI)</p>
                                                    <p className="text-sm text-slate-700 dark:text-slate-300 italic leading-relaxed">
                                                        "{jsonObj.visual_prompt}"
                                                    </p>
                                                </div>
                                                
                                                {jsonObj.spoken_script && (
                                                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800">
                                                        <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase mb-1">
                                                            Voice Over Script (Indo, ~8 Detik)
                                                        </p>
                                                        <p className="text-sm text-slate-700 dark:text-slate-300">
                                                            {jsonObj.spoken_script}
                                                        </p>
                                                    </div>
                                                )}

                                                <div className="flex-grow relative">
                                                     <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Raw JSON Data</p>
                                                    <div className="bg-slate-900 text-green-400 p-3 rounded-lg text-[10px] font-mono overflow-auto max-h-32 border border-slate-700">
                                                        <pre>{JSON.stringify(jsonObj, null, 2)}</pre>
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="flex items-center justify-center h-full text-slate-400 text-sm italic">
                                                {isGenerating ? "Menunggu data prompt..." : "Data prompt tidak tersedia"}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        
                        {isGenerating && generatedImages.every(img => !img) && (
                            <>
                               {Array.from({ length: 3 }).map((_, index) => (
                                   <div key={`skel-${index}`} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex gap-4">
                                        <div className="w-1/3 aspect-[9/16] bg-slate-200 dark:bg-slate-700 animate-pulse rounded-lg"></div>
                                        <div className="w-2/3 flex flex-col gap-3">
                                            <div className="h-16 bg-slate-200 dark:bg-slate-700 animate-pulse rounded-lg"></div>
                                            <div className="h-16 bg-slate-200 dark:bg-slate-700 animate-pulse rounded-lg"></div>
                                            <div className="flex-grow bg-slate-200 dark:bg-slate-700 animate-pulse rounded-lg"></div>
                                        </div>
                                   </div>
                               ))}
                            </>
                        )}
                     </div>

                     {!isGenerating && generatedImages.every(img => !img) && (
                        <div className="flex flex-col items-center justify-center text-center text-slate-500 dark:text-slate-400 h-full py-10">
                            <SparklesIcon className="h-12 w-12 text-slate-400 dark:text-slate-500 mb-4" />
                            <h3 className="font-semibold text-lg text-slate-600 dark:text-slate-300">Siap untuk Berkreasi Cerdas</h3>
                            <p>Unggah Karakter & Produk, isi deskripsi, lalu klik 'Generate Smart UGC'.</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};
