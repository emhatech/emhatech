import React from 'react';
import { DownloadIcon, RefreshIcon } from './Icons';
import { Spinner } from './common/Spinner';
import { GeneratedImage, Voice, VoiceOption } from '../types';
import { ImageLoadingSkeleton } from './common/ImageLoadingSkeleton';
import { TextDisplay } from './common/TextDisplay';

interface StorybookViewProps {
  fullStory: string;
  generatedImages: GeneratedImage[];
  isGeneratingAudio: boolean;
  onDownloadAudio: () => void;
  onDownloadImages: () => void;
  onRegenerateImage: (image: GeneratedImage) => void;
  selectedVoice: Voice;
  onVoiceChange: (voice: Voice) => void;
  voiceOptions: VoiceOption[];
  sceneNarrations: string[];
}

export const StorybookView: React.FC<StorybookViewProps> = ({
  fullStory,
  generatedImages,
  isGeneratingAudio,
  onDownloadAudio,
  onDownloadImages,
  onRegenerateImage,
  selectedVoice,
  onVoiceChange,
  voiceOptions,
  sceneNarrations,
}) => {
  const hasImages = generatedImages.some(img => img.src && !img.isLoading);

  return (
    <div className="mt-8 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg animate-fade-in transition-colors duration-300">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-3">
            <h2 className="text-2xl font-bold text-cyan-700 dark:text-cyan-400 shrink-0">Buku Cerita Anda</h2>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto sm:justify-end flex-wrap">
                <div className="relative w-full sm:w-auto">
                    <select
                      value={selectedVoice}
                      onChange={(e) => onVoiceChange(e.target.value as Voice)}
                      className="w-full sm:w-auto bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold py-2.5 px-4 pr-8 rounded-lg border border-slate-300 dark:border-slate-600 appearance-none focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all cursor-pointer"
                      aria-label="Pilih suara narator"
                    >
                      {voiceOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.name}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-700 dark:text-slate-300">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                    </div>
                </div>

                <button
                    onClick={onDownloadAudio}
                    disabled={isGeneratingAudio}
                    className="w-full sm:w-auto bg-amber-500 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center transition-all duration-200 hover:bg-amber-600 disabled:bg-slate-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed disabled:text-slate-500 dark:disabled:text-slate-400"
                >
                    {isGeneratingAudio ? (
                       <>
                        <Spinner className="h-5 w-5 mr-2"/>
                        Membuat Audio...
                       </>
                    ) : (
                       <>
                        <DownloadIcon className="h-5 w-5 mr-2"/>
                        Unduh Audio
                       </>
                    )}
                </button>
                 <button
                    onClick={onDownloadImages}
                    disabled={!hasImages}
                    className="w-full sm:w-auto bg-cyan-600 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center transition-all duration-200 hover:bg-cyan-700 disabled:bg-slate-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed"
                >
                    <DownloadIcon className="h-5 w-5 mr-2"/>
                    Unduh Ilustrasi
                </button>
            </div>
        </div>
        
        <div className="mt-8 space-y-12">
            {generatedImages.map((img, index) => {
                const narration = sceneNarrations[index];
                if (!narration) return null;

                const isImageLoading = img.isLoading || !img.src;
                
                return (
                    <div key={img.id} className="border-t border-slate-200 dark:border-slate-700 pt-8 first:border-t-0 first:pt-0">
                        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-4">Adegan {index + 1}</h3>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-4">
                            {/* Left side: Image */}
                            <div className="relative group aspect-video">
                                {isImageLoading ? (
                                    <ImageLoadingSkeleton />
                                ) : (
                                    <>
                                        <img src={img.src!} alt={`Generated scene for: ${img.prompt}`} className="rounded-lg object-cover w-full h-full border border-slate-200 dark:border-slate-600"/>
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded-lg">
                                            <button
                                                onClick={() => onRegenerateImage(img)}
                                                className="p-2 bg-white/20 rounded-full text-white hover:bg-white/40 backdrop-blur-sm"
                                                aria-label="Regenerate image"
                                            >
                                                <RefreshIcon className="h-5 w-5"/>
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                            
                            {/* Right side: Narration and Prompt */}
                            <div className="flex flex-col gap-4">
                                <div>
                                    <p className="font-semibold text-slate-600 dark:text-slate-300 mb-1">Narasi</p>
                                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{narration}</p>
                                </div>
                                <TextDisplay
                                    label="Visual Prompt"
                                    text={img.prompt}
                                    rows={4}
                                    copyButtonText="Salin Prompt"
                                />
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    </div>
  );
};
