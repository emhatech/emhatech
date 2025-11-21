
import React, { useState, useEffect } from 'react';
import JSZip from 'jszip';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { StoryWizard } from './components/StoryWizard';
import { StorybookView } from './components/StorybookView';
import { ImageAffiliateView } from './components/ImageAffiliateView';
import { AboutView } from './components/AboutView';
import { ApiKeyModal } from './components/ApiKeyModal';
import { MusicLyricView } from './components/MusicLyricView';
import { VideoGeneratorView } from './components/VideoGeneratorView';
import { TabButton } from './components/common/TabButton';
import { Spinner } from './components/common/Spinner';
import { GENRES, INITIAL_IDEAS_COUNT, VOICE_OPTIONS, UGC_LANGUAGES, LYRIC_LANGUAGES } from './constants';
import { 
    Genre, StoryIdea, GeneratedImage, CharacterImageData, Gender, 
    View, Voice, AspectRatio, LyricLine, VeoModel, VideoResolution 
} from './types';
import { 
    setApiKeys, generateFullStory, generateStoryScenes, 
    generateStoryIdeas, polishStoryText, generateImage, generateSpeech,
    generateLyrics, translateLyrics, generateUGCScripts, generateVeoVideo
} from './services/geminiService';
import { pcmToWavBlob, decodeBase64 } from './utils/audio';

const FUNNY_MESSAGES = [
    "EmhaTech sedang memasak, tunggu dulu ya... 🍳",
    "AI sedang mencari inspirasi di dimensi lain... 🌌",
    "Menghubungi penulis skenario terbaik di galaksi... ✍️",
    "Sedang merangkai kata-kata cinta... eh, cerita... ❤️",
    "Menyeduh kopi digital untuk AI... ☕",
    "EmhaTech bilang: Sabar itu subur... 🌱",
    "Mengumpulkan pixel-pixel ajaib... ✨",
    "Jangan di-close, nanti AI-nya nangis... 😢",
    "Sedang memoles plot twist yang mencengangkan... 😱",
    "Memanggil roh kreativitas... 👻",
    "Mengunduh imajinasi dari awan... ☁️",
    "Sedang mengetik dengan kecepatan cahaya... ⚡",
    "EmhaTech sedang melukis mimpi anda... 🎨",
    "Menyiapkan panggung sandiwara digital... 🎭",
    "Menerjemahkan bahasa alien ke bahasa manusia... 👽"
];

const STORY_LOADING_MESSAGES = [
    "EmhaTech sedang membuat gambar, kamu diam aja bikin kopi... ☕",
    "Sstt... AI lagi fokus, jangan diganggu... 🤫",
    "Sedang memanggil roh pelukis digital... 🎨",
    "Sabar ya, orang sabar disayang AI... ❤️",
    "Lagi meracik bumbu cerita rahasia... 🧂",
    "Tunggu sebentar, AI-nya lagi stretching... 🤸",
    "Memuat imajinasi tingkat dewa... 🤯",
    "Jangan lupa kedip ya... 😉",
    "Sedang mengirim naskah ke Hollywood... 🎬",
    "Kamu diam aja, biar EmhaTech yang kerja... 🤖"
];

export const App: React.FC = () => {
    // UI State
    const [theme, setTheme] = useState<'light' | 'dark'>('light');
    const [view, setView] = useState<View>('wizard');
    const [showApiKeyModal, setShowApiKeyModal] = useState(false);
    const [apiKeys, setApiKeysState] = useState<string[]>([]);

    // Story Wizard State
    const [selectedGenre, setSelectedGenre] = useState<Genre>(GENRES[0]);
    const [storyIdeas, setStoryIdeas] = useState<StoryIdea[]>([]);
    const [isLoadingIdeas, setIsLoadingIdeas] = useState(false);
    const [storyText, setStoryText] = useState('');
    const [isGeneratingStory, setIsGeneratingStory] = useState(false);
    const [isPolishing, setIsPolishing] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState(FUNNY_MESSAGES[0]);
    const [storyLoadingMessage, setStoryLoadingMessage] = useState(STORY_LOADING_MESSAGES[0]);
    
    // Character State
    const [characterImage, setCharacterImage] = useState<CharacterImageData | null>(null);
    const [characterText, setCharacterText] = useState('');
    const [characterGender, setCharacterGender] = useState<Gender>('unspecified');
    const [animalImage, setAnimalImage] = useState<CharacterImageData | null>(null);
    const [imageAspectRatio, setImageAspectRatio] = useState<AspectRatio>('16:9');

    // Storybook State
    const [fullStory, setFullStory] = useState('');
    const [sceneNarrations, setSceneNarrations] = useState<string[]>([]);
    const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
    const [selectedVoice, setSelectedVoice] = useState<Voice>('Kore');
    const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);

    // UGC/Affiliate State
    const [ugcBaseImages, setUgcBaseImages] = useState<(CharacterImageData | null)[]>([null, null]);
    const [ugcScenario, setUgcScenario] = useState('');
    const [ugcGeneratedImages, setUgcGeneratedImages] = useState<(GeneratedImage | null)[]>(Array(7).fill(null));
    const [videoJsons, setVideoJsons] = useState<string[]>([]);
    const [isGeneratingUGC, setIsGeneratingUGC] = useState(false);
    const [ugcLanguage, setUgcLanguage] = useState('Indonesian');

    // Music/Lyrics State
    const [youtubeUrl, setYoutubeUrl] = useState('');
    const [originalLyrics, setOriginalLyrics] = useState('');
    const [translatedLyrics, setTranslatedLyrics] = useState<LyricLine[] | null>(null);
    const [isFetchingLyrics, setIsFetchingLyrics] = useState(false);
    const [isTranslatingLyrics, setIsTranslatingLyrics] = useState(false);
    const [lyricSources, setLyricSources] = useState<{ title: string; uri: string }[]>([]);
    const [selectedLyricLanguage, setSelectedLyricLanguage] = useState('Indonesian');

    // Video Generator State
    const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
    const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);

    // Security: Prevent Right Click and DevTools
    useEffect(() => {
        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault();
            // Optional: alert("Aplikasi ini dilindungi hak cipta EmhaTech.");
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            // Prevent F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
            if (
                e.key === 'F12' ||
                (e.ctrlKey && e.shiftKey && e.key === 'I') ||
                (e.ctrlKey && e.shiftKey && e.key === 'J') ||
                (e.ctrlKey && e.key === 'u')
            ) {
                e.preventDefault();
            }
        };

        document.addEventListener('contextmenu', handleContextMenu);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('contextmenu', handleContextMenu);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    // Initialize
    useEffect(() => {
        try {
            const savedKeys = localStorage.getItem('gemini_api_keys');
            if (savedKeys) {
                const parsed = JSON.parse(savedKeys);
                setApiKeysState(parsed);
                setApiKeys(parsed);
            }
        } catch (e) {
            console.warn("Local storage access blocked", e);
        }

        // Check system theme
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            setTheme('dark');
        }
    }, []);

    useEffect(() => {
        document.documentElement.className = theme;
    }, [theme]);

    // Funny Message Interval (General)
    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (isGeneratingStory) {
            setLoadingMessage(FUNNY_MESSAGES[Math.floor(Math.random() * FUNNY_MESSAGES.length)]);
            interval = setInterval(() => {
                const randomIndex = Math.floor(Math.random() * FUNNY_MESSAGES.length);
                setLoadingMessage(FUNNY_MESSAGES[randomIndex]);
            }, 2500);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isGeneratingStory]);

     // Story Specific Message Interval
     useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (isGeneratingStory) {
            setStoryLoadingMessage(STORY_LOADING_MESSAGES[0]);
            interval = setInterval(() => {
                const randomIndex = Math.floor(Math.random() * STORY_LOADING_MESSAGES.length);
                setStoryLoadingMessage(STORY_LOADING_MESSAGES[randomIndex]);
            }, 3000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isGeneratingStory]);

    // Handlers
    const handleThemeToggle = () => setTheme(theme === 'light' ? 'dark' : 'light');
    
    const handleApiKeysSave = (keys: string[]) => {
        setApiKeysState(keys);
        setApiKeys(keys);
        localStorage.setItem('gemini_api_keys', JSON.stringify(keys));
        setShowApiKeyModal(false);
    };

    const handleApiError = (err: any) => {
        const errorMessage = err?.message || JSON.stringify(err);
        if (
            err.name === "AllApiKeysFailedError" || 
            errorMessage.includes("429") || 
            errorMessage.includes("quota") ||
            errorMessage.includes("RESOURCE_EXHAUSTED")
        ) {
            setShowApiKeyModal(true);
        }
    };

    // Unified Character Image Handler (Syncs Wizard <-> UGC)
    const handleGlobalCharacterImageChange = (img: CharacterImageData | null) => {
        setCharacterImage(img);
        setUgcBaseImages(prev => [img, prev[1]]); // Sync Index 0 (Character)
    };

    // Unified UGC Image Handler (Syncs UGC <-> Wizard)
    const handleUgcBaseImageChange = (img: CharacterImageData | null, idx: number) => {
        // If modifying index 0 (Character), sync back to Wizard
        if (idx === 0) {
            setCharacterImage(img);
        }
        
        setUgcBaseImages(prev => {
            const newImages = [...prev];
            newImages[idx] = img;
            return newImages;
        });
    };

    const handleGenreChange = async (genre: Genre) => {
        setSelectedGenre(genre);
        setIsLoadingIdeas(true);
        try {
            const newIdeas = await generateStoryIdeas(genre.name);
            setStoryIdeas(newIdeas);
        } catch (e) {
            console.error(e);
            handleApiError(e);
        } finally {
            setIsLoadingIdeas(false);
        }
    };

    const handleSelectIdea = (idea: StoryIdea) => {
        setStoryText(prev => prev ? `${prev}\n\n${idea.text}` : idea.text);
    };

    const handlePolishStory = async () => {
        if (!storyText) return;
        setIsPolishing(true);
        try {
            const polished = await polishStoryText(storyText);
            setStoryText(polished);
        } catch (e) {
            console.error(e);
            alert('Gagal memoles cerita.');
            handleApiError(e);
        } finally {
            setIsPolishing(false);
        }
    };

    const handleGenerateStory = async () => {
        setIsGeneratingStory(true);
        setGeneratedImages([]);
        
        try {
            const story = await generateFullStory(storyText, selectedGenre.name, characterGender);
            setFullStory(story);
            
            // Pass character details to ensure consistency in prompts
            const genderStr = characterGender === 'male' ? 'Male' : characterGender === 'female' ? 'Female' : 'Character';
            const fullCharacterDesc = `${genderStr}. ${characterText}`.trim();

            const scenes = await generateStoryScenes(story, fullCharacterDesc);
            setSceneNarrations(scenes.map(s => s.narration));
            
            const initialImages: GeneratedImage[] = scenes.map((s, i) => ({
                id: `img-${i}`,
                prompt: s.imagePrompt,
                src: null,
                isLoading: true 
            }));
            setGeneratedImages(initialImages);
            setView('storybook');

            // Give a small initial delay to allow quota to cool down from text generation
            await new Promise(r => setTimeout(r, 5000));

            // IMPORTANT: Loop image generation in background so UI updates one by one
            // DO NOT await the entire loop before finishing the function
            // But since we are inside an async function triggered by button, we can await here
            // and user sees progress bars update.
            
            for (let i = 0; i < scenes.length; i++) {
                try {
                    // Add delay to prevent XHR errors from congestion
                    // Increased delay to 40s to prevent 429 errors (Rate Limits)
                    if (i > 0) await new Promise(r => setTimeout(r, 40000));

                    // We pass true for 'enhanceQuality' to ensure head-to-toe/consistent rendering
                    const base64 = await generateImage(scenes[i].imagePrompt, imageAspectRatio);
                    setGeneratedImages(prev => {
                        const newImages = [...prev];
                        newImages[i] = {
                            ...newImages[i],
                            src: base64,
                            isLoading: false
                        };
                        return newImages;
                    });
                } catch (err) {
                    console.error(`Failed to generate image ${i+1}`, err);
                    handleApiError(err);
                    setGeneratedImages(prev => {
                        const newImages = [...prev];
                        newImages[i] = {
                            ...newImages[i],
                            isLoading: false 
                        };
                        return newImages;
                    });
                }
            }

        } catch (e) {
            console.error(e);
            alert('Gagal membuat cerita: ' + (e as Error).message);
            handleApiError(e);
        } finally {
            setIsGeneratingStory(false);
        }
    };

    const handleRegenerateImage = async (imageToRegen: GeneratedImage) => {
        const index = generatedImages.findIndex(img => img.id === imageToRegen.id);
        if (index === -1) return;

        setGeneratedImages(prev => {
            const newImages = [...prev];
            newImages[index] = { ...newImages[index], isLoading: true };
            return newImages;
        });

        try {
            const base64 = await generateImage(imageToRegen.prompt, imageAspectRatio);
            setGeneratedImages(prev => {
                const newImages = [...prev];
                newImages[index] = { ...newImages[index], src: base64, isLoading: false };
                return newImages;
            });
        } catch (error) {
             console.error("Regen failed", error);
             handleApiError(error);
             setGeneratedImages(prev => {
                const newImages = [...prev];
                newImages[index] = { ...newImages[index], isLoading: false };
                return newImages;
            });
        }
    };

    const handleDownloadImages = async () => {
      const validImages = generatedImages.filter(img => img.src);
      if (validImages.length === 0) return;

      const zip = new JSZip();
      let storyContent = `JUDUL: CERITA OLEH EMHATECH AI\n\nCERITA LENGKAP:\n${fullStory}\n\n---\n\nDETAIL ADEGAN (8 SCENE):\n\n`;
      generatedImages.forEach((img, i) => {
          const narration = sceneNarrations[i] || "";
          storyContent += `ADEGAN ${i + 1}:\nVisual Prompt: ${img.prompt}\nNarasi: ${narration}\n\n`;
      });
      zip.file("cerita_dan_narasi.txt", storyContent);

      validImages.forEach((img, i) => {
          const data = img.src!.split(',')[1];
          zip.file(`adegan_${i + 1}.jpg`, data, { base64: true });
      });

      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = "terimakasih-emhatech-ganteng.zip";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };

    const handleDownloadAudio = async () => {
        const textToSpeak = sceneNarrations.join('\n\n') || fullStory;
        if (!textToSpeak.trim()) {
            alert('Tidak ada cerita untuk dijadikan audio.');
            return;
        }

        setIsGeneratingAudio(true);
        try {
            const base64Audio = await generateSpeech(textToSpeak, selectedVoice);
            const pcmData = decodeBase64(base64Audio);
            const wavBlob = pcmToWavBlob(pcmData, 24000, 1, 16);
            
            const url = URL.createObjectURL(wavBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `cerita-emhatech-${Date.now()}.wav`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error(e);
            alert('Gagal membuat audio: ' + (e as Error).message);
            handleApiError(e);
        } finally {
            setIsGeneratingAudio(false);
        }
    };

    const handleDownloadUGC = async () => {
        const validImages = ugcGeneratedImages.filter((img): img is GeneratedImage => img !== null && img.src !== null);
        if (validImages.length === 0 && videoJsons.length === 0) return;

        const zip = new JSZip();
        let textContent = `SKENARIO UGC:\n${ugcScenario}\n\n---\n\n`;
        videoJsons.forEach((json, index) => {
            if (json) {
                textContent += `ADEGAN ${index + 1} (JSON):\n${json}\n\n`;
            }
        });
        zip.file("ugc_scripts_dan_prompts.txt", textContent);

        ugcGeneratedImages.forEach((img, i) => {
            if (img && img.src) {
                const data = img.src.split(',')[1];
                zip.file(`ugc_adegan_${i + 1}.jpg`, data, { base64: true });
            }
        });

        const content = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(content);
        const a = document.createElement('a');
        a.href = url;
        a.download = "terimakasih-emhatech-ganteng.zip";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleGenerateUGC = async (useCharacter: boolean, useProduct: boolean) => {
        setIsGeneratingUGC(true);
        setUgcGeneratedImages(Array(7).fill(null));
        setVideoJsons([]);
        
        try {
            // Prepare character description from Wizard data to ensure global consistency
            const genderStr = characterGender === 'male' ? 'Male' : characterGender === 'female' ? 'Female' : 'Character';
            const fullCharacterDesc = `${genderStr}. ${characterText}`.trim();

            // 1. Generate Scripts (Returns Array of Objects)
            // Pass the character description so the prompt generator knows who to put in the UGC
            const scripts = await generateUGCScripts(ugcScenario, ugcLanguage, fullCharacterDesc);
            
            // Convert objects back to strings for display purposes in JsonDisplay
            setVideoJsons(scripts.map(s => JSON.stringify(s, null, 2)));
            
            // 2. Generate Images for each script
            const initialImages: GeneratedImage[] = scripts.map((s, i) => {
                return {
                    id: `ugc-${i}`,
                    prompt: s.visual_prompt,
                    src: null,
                    isLoading: true
                };
            });
            setUgcGeneratedImages(initialImages);

            // Initial delay to allow quota settlement from script generation
            await new Promise(r => setTimeout(r, 5000));

            for(let i = 0; i < scripts.length; i++) {
                 try {
                    // Add delay - Increased to 40s to prevent 429
                    if (i > 0) await new Promise(r => setTimeout(r, 40000));
                    
                    // Enhance UGC prompts for better results if needed
                    const finalPrompt = `${initialImages[i].prompt}, high quality, photorealistic, 8k, detailed`;
                    const base64 = await generateImage(finalPrompt, '9:16');
                    
                    setUgcGeneratedImages(prev => {
                        const newImgs = [...prev];
                        if(newImgs[i]) {
                             newImgs[i] = { ...newImgs[i]!, src: base64, isLoading: false };
                        }
                        return newImgs;
                    });
                 } catch (err) {
                    console.error(`Failed UGC image ${i}`, err);
                     handleApiError(err);
                     setUgcGeneratedImages(prev => {
                        const newImgs = [...prev];
                        if(newImgs[i]) newImgs[i] = { ...newImgs[i]!, isLoading: false };
                        return newImgs;
                    });
                 }
            }
        } catch (e) {
            console.error(e);
            alert('Gagal membuat UGC content: ' + (e as Error).message);
            handleApiError(e);
        } finally {
            setIsGeneratingUGC(false);
        }
    };

    const handleGetLyrics = async () => {
        setIsFetchingLyrics(true);
        setOriginalLyrics('');
        setLyricSources([]);
        try {
            const { lyrics, sources } = await generateLyrics(youtubeUrl);
            setOriginalLyrics(lyrics);
            setLyricSources(sources);
        } catch (e) {
            console.error(e);
            setOriginalLyrics('Gagal mengambil lirik. Silakan coba lagi.');
            handleApiError(e);
        } finally {
            setIsFetchingLyrics(false);
        }
    };

    const handleTranslateLyrics = async () => {
        if (!originalLyrics) return;
        setIsTranslatingLyrics(true);
        setTranslatedLyrics(null);
        try {
            const translated = await translateLyrics(originalLyrics, selectedLyricLanguage);
            setTranslatedLyrics(translated);
        } catch (e) {
            console.error(e);
            alert('Gagal menerjemahkan lirik.');
            handleApiError(e);
        } finally {
            setIsTranslatingLyrics(false);
        }
    };

    const handleGenerateVideo = async (prompt: string, ratio: AspectRatio, model: VeoModel, res: VideoResolution, img: CharacterImageData | null) => {
        setIsGeneratingVideo(true);
        setGeneratedVideoUrl(null);
        try {
            const url = await generateVeoVideo(prompt, model, ratio, res, img?.base64);
            setGeneratedVideoUrl(url);
        } catch (e) {
            console.error(e);
            alert('Gagal membuat video: ' + (e as Error).message);
            handleApiError(e);
        } finally {
            setIsGeneratingVideo(false);
        }
    };

  return (
    <div className={`min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300 font-sans flex flex-col relative select-none`}>
      
      {/* Story specific Loading Overlay */}
      {isGeneratingStory && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in cursor-wait">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 max-w-md w-full text-center border-2 border-cyan-500 transform scale-100 transition-transform">
            <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center justify-center animate-ping opacity-20">
                    <div className="h-20 w-20 bg-cyan-500 rounded-full"></div>
                </div>
                <Spinner className="h-20 w-20 text-cyan-600 dark:text-cyan-400 mx-auto relative z-10" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4 animate-pulse">
                Sedang Merangkai Cerita...
            </h3>
            <div className="bg-cyan-50 dark:bg-cyan-900/30 p-4 rounded-xl border border-cyan-100 dark:border-cyan-800">
                <p className="text-lg text-cyan-700 dark:text-cyan-300 font-medium">
                   "{storyLoadingMessage}"
                </p>
            </div>
          </div>
        </div>
      )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-grow">
            <Header 
                theme={theme} 
                onThemeToggle={handleThemeToggle} 
                onApiKeySettingsClick={() => setShowApiKeyModal(true)}
            />

            <div className="flex overflow-x-auto space-x-2 border-b border-slate-200 dark:border-slate-700 mt-8 mb-8 pb-1 scrollbar-hide">
                <TabButton name="Wizard Cerita" active={view === 'wizard'} onClick={() => setView('wizard')} />
                <TabButton name="Buku Cerita" active={view === 'storybook'} onClick={() => setView('storybook')} disabled={generatedImages.length === 0 && view !== 'storybook'} />
                <TabButton name="UGC & Prompt" active={view === 'imageAffiliate'} onClick={() => setView('imageAffiliate')} />
                <TabButton name="Lirik Musik" active={view === 'musicLyric'} onClick={() => setView('musicLyric')} />
                <TabButton name="Video Generator" active={view === 'videoGenerator'} onClick={() => setView('videoGenerator')} />
                <TabButton name="Tentang" active={view === 'about'} onClick={() => setView('about')} />
            </div>

            <main className="min-h-[500px]">
                {view === 'wizard' && (
                    <StoryWizard
                        genres={GENRES}
                        selectedGenre={selectedGenre}
                        onGenreChange={handleGenreChange}
                        storyIdeas={storyIdeas}
                        isLoadingIdeas={isLoadingIdeas}
                        onSelectIdea={handleSelectIdea}
                        storyText={storyText}
                        onStoryTextChange={setStoryText}
                        onDismissIdea={(idea) => setStoryIdeas(prev => prev.filter(i => i.id !== idea.id))}
                        isStoryReady={storyText.trim().length > 50}
                        onGenerateStory={handleGenerateStory}
                        isGeneratingStory={isGeneratingStory}
                        onPolishStory={handlePolishStory}
                        isPolishing={isPolishing}
                        characterImage={characterImage}
                        onCharacterImageChange={handleGlobalCharacterImageChange} // Use unified handler
                        characterText={characterText}
                        onCharacterTextChange={setCharacterText}
                        characterGender={characterGender}
                        onCharacterGenderChange={setCharacterGender}
                        animalImage={animalImage}
                        onAnimalImageChange={setAnimalImage}
                        imageAspectRatio={imageAspectRatio}
                        onImageAspectRatioChange={setImageAspectRatio}
                    />
                )}

                {view === 'storybook' && (
                    <StorybookView
                        fullStory={fullStory}
                        generatedImages={generatedImages}
                        isGeneratingAudio={isGeneratingAudio}
                        onDownloadAudio={handleDownloadAudio}
                        onDownloadImages={handleDownloadImages}
                        onRegenerateImage={handleRegenerateImage}
                        selectedVoice={selectedVoice}
                        onVoiceChange={setSelectedVoice}
                        voiceOptions={VOICE_OPTIONS}
                        sceneNarrations={sceneNarrations}
                    />
                )}

                {view === 'imageAffiliate' && (
                    <ImageAffiliateView
                        baseImages={ugcBaseImages}
                        onBaseImageChange={handleUgcBaseImageChange} // Use unified handler
                        isGenerating={isGeneratingUGC}
                        onGenerate={handleGenerateUGC}
                        generatedImages={ugcGeneratedImages}
                        videoJsons={videoJsons}
                        onDownloadAll={handleDownloadUGC}
                        scenario={ugcScenario}
                        onScenarioChange={setUgcScenario}
                        languages={UGC_LANGUAGES}
                        selectedLanguage={ugcLanguage}
                        onLanguageChange={setUgcLanguage}
                    />
                )}

                {view === 'musicLyric' && (
                    <MusicLyricView
                        youtubeUrl={youtubeUrl}
                        onYoutubeUrlChange={setYoutubeUrl}
                        onGetLyrics={handleGetLyrics}
                        isFetchingLyrics={isFetchingLyrics}
                        originalLyrics={originalLyrics}
                        onOriginalLyricsChange={setOriginalLyrics}
                        lyricSources={lyricSources}
                        onTranslateLyrics={handleTranslateLyrics}
                        isTranslatingLyrics={isTranslatingLyrics}
                        translatedLyrics={translatedLyrics}
                        languages={LYRIC_LANGUAGES}
                        selectedLanguage={selectedLyricLanguage}
                        onLanguageChange={setSelectedLyricLanguage}
                    />
                )}

                {view === 'videoGenerator' && (
                    <VideoGeneratorView
                        isGenerating={isGeneratingVideo}
                        onGenerate={handleGenerateVideo}
                        videoUrl={generatedVideoUrl}
                        onReset={() => setGeneratedVideoUrl(null)}
                    />
                )}

                {view === 'about' && <AboutView />}
            </main>
        </div>

        <Footer />

        <ApiKeyModal
            isOpen={showApiKeyModal}
            currentApiKeys={apiKeys}
            onClose={() => setShowApiKeyModal(false)}
            onSave={handleApiKeysSave}
        />
    </div>
  );
};
