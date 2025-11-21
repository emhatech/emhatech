
import React, { useState, useEffect } from 'react';
import { AspectRatio, CharacterImageData, VeoModel, VideoResolution } from '../types';
import { Spinner } from './common/Spinner';
import { VideoCameraIcon, SparklesIcon, DownloadIcon, ImageIcon } from './Icons';
import { ImageUploader } from './common/ImageUploader';
import { TabButton } from './common/TabButton';

interface VideoGeneratorViewProps {
    isGenerating: boolean;
    onGenerate: (prompt: string, aspectRatio: AspectRatio, model: VeoModel, resolution: VideoResolution, image: CharacterImageData | null) => void;
    videoUrl: string | null;
    onReset?: () => void;
}

const FUNNY_VIDEO_MESSAGES = [
    "Menghubungi sutradara AI di Hollywood... 🎬",
    "Sedang merender piksel demi piksel... 🖥️",
    "Menyusun adegan sinematik (Veo sedang berpikir)... 🧠",
    "Menambahkan efek cahaya dramatis... ✨",
    "Mohon bersabar, seni butuh waktu... ⏳",
    "Hampir selesai, jangan tutup tab ya... 🚫",
    "Memastikan resolusi tajam... 🔍"
];

type GenerationMode = 'text-to-video' | 'image-to-video';

export const VideoGeneratorView: React.FC<VideoGeneratorViewProps> = ({
    isGenerating,
    onGenerate,
    videoUrl,
    onReset
}) => {
    const [mode, setMode] = useState<GenerationMode>('text-to-video');
    const [prompt, setPrompt] = useState('');
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
    const [model, setModel] = useState<VeoModel>('veo-3.1-fast-generate-preview');
    const [resolution, setResolution] = useState<VideoResolution>('720p');
    const [loadingMsg, setLoadingMsg] = useState(FUNNY_VIDEO_MESSAGES[0]);
    const [uploadedImage, setUploadedImage] = useState<CharacterImageData | null>(null);

    // Effect to cycle through funny messages during generation
    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (isGenerating) {
            setLoadingMsg(FUNNY_VIDEO_MESSAGES[0]);
            interval = setInterval(() => {
                const randomIndex = Math.floor(Math.random() * FUNNY_VIDEO_MESSAGES.length);
                setLoadingMsg(FUNNY_VIDEO_MESSAGES[randomIndex]);
            }, 4000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isGenerating]);

    const handleSubmit = () => {
        if (!prompt.trim()) return;
        if (mode === 'image-to-video' && !uploadedImage) return;
        
        onGenerate(prompt, aspectRatio, model, resolution, mode === 'image-to-video' ? uploadedImage : null);
    };

    const handleModeChange = (newMode: GenerationMode) => {
        setMode(newMode);
        if (onReset) onReset();
    }

    // Placeholder text changes based on mode
    const placeholderText = mode === 'text-to-video' 
        ? "Deskripsikan video yang ingin Anda buat (mis: Cyberpunk city at night with neon lights, cinematic drone shot...)"
        : "Deskripsikan bagaimana gambar ini harus bergerak atau berubah (mis: Make the camera pan right, animate the water flowing...)";

    return (
        <div className="animate-fade-in space-y-8">
             {/* Header Section */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg">
                 <div className="flex items-center mb-6">
                    <div className="bg-violet-600 p-3 rounded-lg mr-4 shadow-md">
                        <VideoCameraIcon className="h-8 w-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                            Generator Video Veo
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400 mt-1">
                            Ubah teks atau gambar menjadi video sinematik menggunakan model AI tercanggih Google Veo.
                        </p>
                    </div>
                </div>

                {/* Mode Tabs */}
                <div className="flex border-b border-slate-200 dark:border-slate-700 mb-6">
                    <TabButton 
                        name="Teks ke Video" 
                        active={mode === 'text-to-video'} 
                        onClick={() => handleModeChange('text-to-video')} 
                        variant="sub"
                    />
                    <TabButton 
                        name="Gambar ke Video" 
                        active={mode === 'image-to-video'} 
                        onClick={() => handleModeChange('image-to-video')} 
                        variant="sub"
                    />
                </div>

                 <div className="space-y-6">
                    {/* Image Upload Section (Only for Image-to-Video) */}
                    {mode === 'image-to-video' && (
                        <div className="animate-fade-in">
                             <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Unggah Gambar Awal
                            </label>
                            <ImageUploader 
                                image={uploadedImage}
                                onImageChange={setUploadedImage}
                                label=""
                                heightClass="h-48"
                            />
                             <p className="text-xs text-slate-500 mt-2">
                                Tip: Gunakan gambar berkualitas tinggi untuk hasil video terbaik.
                            </p>
                        </div>
                    )}

                    {/* Prompt Input */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Prompt {mode === 'image-to-video' ? 'Animasi' : 'Video'}
                        </label>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            rows={3}
                            placeholder={placeholderText}
                            className="w-full bg-slate-50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-lg p-3 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder-slate-400 dark:placeholder-slate-500 transition-colors"
                        />
                    </div>

                    {/* Options Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                         <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Model Veo
                            </label>
                            <select
                                value={model}
                                onChange={(e) => setModel(e.target.value as VeoModel)}
                                className="w-full bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold py-2.5 px-4 rounded-lg border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer"
                            >
                                <option value="veo-3.1-fast-generate-preview">Veo 3.1 Fast (Cepat)</option>
                                <option value="veo-3.1-generate-preview">Veo 3.1 HQ (Tinggi)</option>
                                <option value="veo-2.0-generate-preview">Veo 2.0 (Legacy)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Resolusi
                            </label>
                            <select
                                value={resolution}
                                onChange={(e) => setResolution(e.target.value as VideoResolution)}
                                className="w-full bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold py-2.5 px-4 rounded-lg border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer"
                            >
                                <option value="720p">HD (720p)</option>
                                <option value="1080p">FHD (1080p)</option>
                            </select>
                        </div>

                        <div>
                             <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Rasio Aspek
                            </label>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setAspectRatio('16:9')}
                                    className={`flex-1 py-2.5 px-4 rounded-lg border text-sm font-semibold transition-all ${
                                        aspectRatio === '16:9'
                                            ? 'bg-violet-600 text-white border-violet-600 shadow-md'
                                            : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600'
                                    }`}
                                >
                                    16:9
                                </button>
                                <button
                                    onClick={() => setAspectRatio('9:16')}
                                    className={`flex-1 py-2.5 px-4 rounded-lg border text-sm font-semibold transition-all ${
                                        aspectRatio === '9:16'
                                            ? 'bg-violet-600 text-white border-violet-600 shadow-md'
                                            : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600'
                                    }`}
                                >
                                    9:16
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Generate Button */}
                    <button
                        onClick={handleSubmit}
                        disabled={isGenerating || !prompt.trim() || (mode === 'image-to-video' && !uploadedImage)}
                        className="w-full bg-violet-600 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center transition-all duration-200 hover:bg-violet-700 disabled:bg-slate-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed shadow-lg mt-4"
                    >
                        {isGenerating ? (
                            <>
                                <Spinner className="h-5 w-5 mr-3 text-white" />
                                Membuat Video...
                            </>
                        ) : (
                            <>
                                <SparklesIcon className="h-5 w-5 mr-2" />
                                Generate Video
                            </>
                        )}
                    </button>
                 </div>
            </div>

            {/* Output Section */}
             {(videoUrl || isGenerating) && (
                <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-inner">
                     <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-4">Hasil Video</h3>
                     
                     <div className="flex justify-center">
                        {isGenerating ? (
                            <div className={`relative w-full max-w-3xl bg-black rounded-xl flex flex-col items-center justify-center text-center p-8 border border-slate-800 ${aspectRatio === '16:9' ? 'aspect-video' : 'aspect-[9/16] max-w-sm'}`}>
                                <Spinner className="h-16 w-16 text-violet-500 mb-6" />
                                <p className="text-violet-300 font-medium text-lg animate-pulse">{loadingMsg}</p>
                                <p className="text-slate-500 text-sm mt-2">Proses ini bisa memakan waktu 1-2 menit.</p>
                            </div>
                        ) : videoUrl ? (
                            <div className="flex flex-col items-center gap-4 w-full">
                                <video 
                                    controls 
                                    autoPlay 
                                    loop 
                                    src={videoUrl} 
                                    className={`rounded-xl shadow-2xl border border-slate-800 w-full ${aspectRatio === '16:9' ? 'max-w-4xl aspect-video' : 'max-w-sm aspect-[9/16]'}`}
                                >
                                    Browser Anda tidak mendukung tag video.
                                </video>
                                <a 
                                    href={videoUrl} 
                                    download="terimakasih-emhatech-ganteng.mp4"
                                    className="flex items-center gap-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-semibold py-2 px-6 rounded-full transition-colors"
                                >
                                    <DownloadIcon className="h-5 w-5" />
                                    Unduh Video MP4
                                </a>
                            </div>
                        ) : null}
                     </div>
                </div>
             )}
        </div>
    );
};
