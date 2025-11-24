import React, { useState } from 'react';
import { generateVeoVideo } from '../services/geminiService';
import { Spinner } from './common/Spinner';
import { ImageUploader } from './common/ImageUploader';
import { CharacterImageData, AspectRatio } from '../types';
import { VideoCameraIcon, DownloadIcon, SparklesIcon, LandscapeIcon, PortraitIcon } from './Icons';

export const VideoGeneratorView: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [inputImage, setInputImage] = useState<CharacterImageData | null>(null);
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
    const [isGenerating, setIsGenerating] = useState(false);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setError("Harap masukkan prompt teks.");
            return;
        }

        setIsGenerating(true);
        setError(null);
        setVideoUrl(null);

        try {
            const url = await generateVeoVideo(prompt, inputImage?.base64 || null, aspectRatio);
            setVideoUrl(url);
        } catch (e: any) {
            console.error(e);
            let msg = e.message || "Terjadi kesalahan saat membuat video.";
            if (msg.includes("API key")) {
                msg = "API Key tidak valid atau kuota habis. Cek pengaturan.";
            } else if (msg.includes("404") || msg.includes("not found")) {
                 msg = "Model Veo belum tersedia untuk API Key ini (Project harus memiliki billing aktif).";
            }
            setError(msg);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="animate-fade-in space-y-8 pb-12">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg">
                <div className="flex items-center mb-6">
                    <div className="bg-purple-600 p-3 rounded-lg mr-4 shadow-md">
                        <VideoCameraIcon className="h-8 w-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                            Veo 3.1 Video Generator
                        </h1>
                        <p className="text-purple-600 dark:text-purple-400 mt-1">
                            Ubah teks & gambar menjadi video sinematik dengan Google Veo terbaru.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Input Section */}
                    <div className="space-y-6">
                        <div className="bg-slate-50 dark:bg-slate-700/30 p-4 rounded-xl border border-slate-100 dark:border-slate-600">
                             <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-3">1. Referensi Gambar (Opsional)</h3>
                             <ImageUploader 
                                image={inputImage} 
                                onImageChange={setInputImage} 
                                label="" 
                                heightClass="h-48"
                             />
                             <p className="text-xs text-slate-500 mt-2 italic">
                                *Jika gambar diunggah, Veo akan menghidupkan gambar tersebut (Image-to-Video).
                             </p>
                        </div>
                        
                        <div>
                            <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-3">2. Format Video</h3>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setAspectRatio('16:9')}
                                    className={`flex-1 py-3 px-4 rounded-lg border text-sm font-semibold transition-all flex flex-col items-center justify-center gap-2 ${
                                        aspectRatio === '16:9'
                                            ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-500 text-purple-700 dark:text-purple-400 ring-1 ring-purple-500'
                                            : 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-600'
                                    }`}
                                >
                                    <LandscapeIcon className="h-6 w-6" />
                                    Landscape (16:9)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setAspectRatio('9:16')}
                                    className={`flex-1 py-3 px-4 rounded-lg border text-sm font-semibold transition-all flex flex-col items-center justify-center gap-2 ${
                                        aspectRatio === '9:16'
                                            ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-500 text-purple-700 dark:text-purple-400 ring-1 ring-purple-500'
                                            : 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-600'
                                    }`}
                                >
                                    <PortraitIcon className="h-6 w-6" />
                                    Portrait (9:16)
                                </button>
                            </div>
                        </div>

                        <div>
                            <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-3">3. Prompt Video</h3>
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-lg p-4 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[120px]"
                                placeholder="Deskripsikan video yang ingin Anda buat... (Contoh: A cyberpunk city with flying cars in heavy rain, cinematic lighting, 4k)"
                            />
                        </div>

                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating || !prompt.trim()}
                            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center transition-all duration-200 hover:from-purple-700 hover:to-indigo-700 shadow-lg disabled:from-slate-400 disabled:to-slate-500 disabled:cursor-not-allowed"
                        >
                            {isGenerating ? (
                                <>
                                    <Spinner className="h-6 w-6 mr-3 text-white"/>
                                    Sedang Merender Video (Veo)...
                                </>
                            ) : (
                                <>
                                    <SparklesIcon className="h-6 w-6 mr-3"/>
                                    GENERATE VIDEO (VEO 3.1)
                                </>
                            )}
                        </button>
                        
                        {error && (
                            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                                <strong>Gagal:</strong> {error}
                            </div>
                        )}
                    </div>

                    {/* Output Section */}
                    <div className={`bg-black/5 dark:bg-black/20 rounded-xl flex items-center justify-center min-h-[400px] border border-slate-200 dark:border-slate-700 overflow-hidden relative ${aspectRatio === '9:16' ? 'aspect-[9/16] max-w-sm mx-auto' : 'aspect-video w-full'}`}>
                        {isGenerating ? (
                            <div className="text-center p-8">
                                <Spinner className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                                <p className="text-slate-600 dark:text-slate-300 font-medium animate-pulse">
                                    Sedang memproses di Google Cloud...
                                </p>
                                <p className="text-xs text-slate-500 mt-2">Ini mungkin memakan waktu 1-2 menit.</p>
                            </div>
                        ) : videoUrl ? (
                            <div className="w-full h-full flex flex-col">
                                <video 
                                    src={videoUrl} 
                                    controls 
                                    autoPlay 
                                    loop 
                                    className="w-full h-full object-contain bg-black"
                                />
                                <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex justify-end absolute bottom-0 w-full opacity-0 hover:opacity-100 transition-opacity">
                                    <a 
                                        href={videoUrl} 
                                        download={`veo-video-${Date.now()}.mp4`}
                                        className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors"
                                    >
                                        <DownloadIcon className="h-4 w-4" />
                                        Unduh MP4
                                    </a>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center text-slate-400 p-8">
                                <VideoCameraIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
                                <p>Video hasil generate akan muncul di sini.</p>
                                <p className="text-xs mt-2 opacity-70">Format: {aspectRatio}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Catatan Penting:</strong> Fitur Veo 3.1 memerlukan API Key dari project Google Cloud yang memiliki <strong>Billing Aktif</strong> (Berbayar). API Key gratisan mungkin tidak berfungsi untuk model ini.
            </div>
        </div>
    );
};