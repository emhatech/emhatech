
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
import { ImageToVideoView } from './components/ImageToVideoView';
import { TabButton } from './components/common/TabButton';
import { Spinner } from './components/common/Spinner';
import { GENRES, INITIAL_IDEAS_COUNT } from './constants';
import { 
    Genre, StoryIdea, GeneratedImage, CharacterImageData, CharacterImageData as CharacterImageDataAlias, Gender, 
    View, Voice, AspectRatio, LyricLine, ProductCategory 
} from './types';
import { 
    setApiKeys, generateFullStory, generateStoryScenes, 
    generateStoryIdeas, polishStoryText, generateImage, generateSpeech,
    generateLyrics, translateLyrics, generateUGCScripts
} from './services/geminiService';
import { pcmToWavBlob, decodeBase64 } from './utils/audio';
import { VOICE_OPTIONS, UGC_LANGUAGES, LYRIC_LANGUAGES } from './constants';

// Removed Hardcoded DEFAULT_API_KEY for security

const FUNNY_MESSAGES = [
    "EmhaTech sedang memasak, tunggu dulu ya... 🍳",
    "AI sedang ngebut, sabar sebentar... 🏎️",
    "Sedang merender pixel dengan kecepatan tinggi... ⚡",
    "Menghubungi server di luar angkasa... 🚀",
    "Jangan di-close, nanti prosesnya ulang dari nol... 😢",
    "Sedang melukis detail resolusi tinggi... 🎨",
    "Memoles hasil agar estetik... ✨",
    "Sedang memanggil roh kreativitas... 👻",
    "Tunggu ya, AI butuh bernafas juga... 😮‍💨",
    "Hampir jadi! Tahan nafas... 😤"
];

const STORY_LOADING_MESSAGES = [
    "Membuat adegan sinematik... 🎬",
    "Merender karakter agar konsisten... 👤",
    "Mengatur pencahayaan digital... 💡",
    "Menyusun naskah voice over... 🎙️",
    "Sedang menggenerate adegan sekaligus... 📚",
    "Sabar ya, kualitas bagus butuh waktu... ⏳",
    "Sedang memproses prompt video Veo... 🎥",
    "Menggabungkan elemen visual dan cerita... 🔗",
    "Sedikit lagi selesai... 🏁",
    "AI sedang bekerja keras untuk Anda... 🤖"
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
    const [sceneCount, setSceneCount] = useState<number>(10);

    // Storybook State
    const [fullStory, setFullStory] = useState('');
    const [sceneNarrations, setSceneNarrations] = useState<string[]>([]);
    const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
    const [selectedVoice, setSelectedVoice] = useState<Voice>('Kore');
    const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);

    // UGC/Affiliate State
    const [ugcBaseImages, setUgcBaseImages] = useState<(CharacterImageData | null)[]>([null, null]);
    const [ugcCharacterDesc, setUgcCharacterDesc] = useState(''); 
    const [ugcProductDesc, setUgcProductDesc] = useState(''); 
    const [ugcScenario, setUgcScenario] = useState('A captivating, high-quality cinematic showcase featuring the subject in various aesthetic lifestyle settings. Professional lighting, elegant composition, viral social media style.');
    const [ugcGeneratedImages, setUgcGeneratedImages] = useState<(GeneratedImage | null)[]>(Array(6).fill(null));
    const [videoJsons, setVideoJsons] = useState<string[]>([]);
    const [isGeneratingUGC, setIsGeneratingUGC] = useState(false);
    const [ugcLanguage, setUgcLanguage] = useState('Indonesian');
    const [ugcShotType, setUgcShotType] = useState('default');

    // Music/Lyrics State
    const [youtubeUrl, setYoutubeUrl] = useState('');
    const [originalLyrics, setOriginalLyrics] = useState('');
    const [translatedLyrics, setTranslatedLyrics] = useState<LyricLine[] | null>(null);
    const [isFetchingLyrics, setIsFetchingLyrics] = useState(false);
    const [isTranslatingLyrics, setIsTranslatingLyrics] = useState(false);
    const [lyricSources, setLyricSources] = useState<{ title: string; uri: string }[]>([]);
    const [selectedLyricLanguage, setSelectedLyricLanguage] = useState('Indonesian');

    // Security: Prevent Right Click and DevTools
    useEffect(() => {
        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault();
        };

        const handleKeyDown = (e: KeyboardEvent) => {
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

    // Initialize and Load Drafts
    useEffect(() => {
        try {
            const savedKeys = localStorage.getItem('gemini_api_keys');
            if (savedKeys) {
                try {
                    const parsed = JSON.parse(savedKeys);
                    setApiKeysState(parsed);
                    setApiKeys(parsed);
                } catch (jsonError) {
                    console.warn("Failed to parse saved API keys, clearing storage.", jsonError);
                    localStorage.removeItem('gemini_api_keys');
                    setApiKeysState([]);
                    setApiKeys([]);
                }
            } else {
                 // Check environment variable
                 const envKey = process.env.API_KEY;
                 if (envKey) {
                     setApiKeysState([envKey]);
                     setApiKeys([envKey]);
                 } else {
                     setApiKeysState([]);
                     setApiKeys([]);
                     // No keys found, prompt user to enter one
                     setTimeout(() => setShowApiKeyModal(true), 1000);
                 }
            }

            const savedDraft = localStorage.getItem('emhatech_wizard_draft');
            if (savedDraft) {
                try {
                    const parsed = JSON.parse(savedDraft);
                    if (parsed.storyText) setStoryText(parsed.storyText);
                    if (parsed.characterText) setCharacterText(parsed.characterText);
                    if (parsed.characterGender) setCharacterGender(parsed.characterGender);
                    if (parsed.selectedGenreValue) {
                        const savedGenre = GENRES.find(g => g.value === parsed.selectedGenreValue);
                        if (savedGenre) setSelectedGenre(savedGenre);
                    }
                    if (parsed.sceneCount) setSceneCount(parsed.sceneCount);
                } catch (e) {
                    console.error("Failed to parse draft", e);
                }
            }
        } catch (e) {
            console.error("Error initializing app:", e);
        }
    }, []);

    // Dark Mode Toggle
    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);

    // Save Draft on Change
    useEffect(() => {
        const draft = {
            storyText,
            characterText,
            characterGender,
            selectedGenreValue: selectedGenre.value,
            sceneCount
        };
        localStorage.setItem('emhatech_wizard_draft', JSON.stringify(draft));
    }, [storyText, characterText, characterGender, selectedGenre, sceneCount]);

    // Global Error Handler for specific API errors
    useEffect(() => {
        const originalConsoleError = console.error;
        console.error = (...args) => {
            const errorMsg = args.map(arg => typeof arg === 'string' ? arg : '').join(' ');
            if (errorMsg.includes("Rpc failed") || errorMsg.includes("xhr error")) {
                // We are now handling retries internally in services, so we might want to suppress duplicate alerts or make them less intrusive
                // But keeping it as a fallback notification is okay.
                // console.warn("Network error detected globally.");
            }
            originalConsoleError(...args);
        };
        return () => {
            console.error = originalConsoleError;
        };
    }, []);


    // --- Logic for Story Wizard ---

    const handleGenerateStoryIdeas = async () => {
        setIsLoadingIdeas(true);
        try {
            const ideas = await generateStoryIdeas(selectedGenre.name);
            setStoryIdeas(ideas);
        } catch (error) {
            console.error(error);
            // alert(`Gagal memuat ide: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsLoadingIdeas(false);
        }
    };

    // Load ideas when genre changes, ONLY if needed (to prevent refresh on tab switch)
    useEffect(() => {
        if (view === 'wizard') {
             // Fetch only if empty or if explicit refresh needed. 
             // We use storyIdeas.length === 0 as a proxy for "initial load for this genre"
             if (storyIdeas.length === 0) {
                 handleGenerateStoryIdeas();
             }
        }
    }, [selectedGenre, view]);

    // Reset ideas if genre actually changes via UI interaction so logic above can refill
    const handleGenreChange = (newGenre: Genre) => {
        setSelectedGenre(newGenre);
        setStoryIdeas([]); // Clear to trigger effect
    };

    const handleSelectIdea = (idea: StoryIdea) => {
        setStoryText(idea.text);
    };

    const handleDismissIdea = (idea: StoryIdea) => {
        setStoryIdeas(prev => prev.filter(i => i.id !== idea.id));
    };

    const handlePolishStory = async () => {
        if (!storyText.trim()) return;
        setIsPolishing(true);
        try {
            const polished = await polishStoryText(storyText);
            setStoryText(polished);
        } catch (error) {
            alert('Gagal memoles cerita. Pastikan API Key sudah diatur.');
        } finally {
            setIsPolishing(false);
        }
    };

    const handleGenerateStory = async () => {
        if (!storyText.trim()) return;
        setIsGeneratingStory(true);
        setStoryLoadingMessage(`Membuat ${sceneCount} adegan visual...`);
        
        try {
            const fullStoryText = await generateFullStory(storyText, selectedGenre.name, characterGender, sceneCount);
            setFullStory(fullStoryText);

            const characterDesc = characterText || (characterImage ? 'A character matching the uploaded reference image' : '');
            const scenes = await generateStoryScenes(fullStoryText, characterDesc, sceneCount);
            
            setSceneNarrations(scenes.map(s => s.narration));
            
            const initialImages = scenes.map((scene, index) => ({
                id: `scene-${Date.now()}-${index}`,
                prompt: scene.imagePrompt,
                src: null,
                isLoading: true
            }));
            setGeneratedImages(initialImages);
            setView('storybook');
            setIsGeneratingStory(false);

            const newImages = [...initialImages];
            const refImages = characterImage ? [characterImage.base64] : [];
            if (animalImage) refImages.push(animalImage.base64);

            for (let i = 0; i < scenes.length; i++) {
                try {
                    // Reduced delay for faster generation
                    if (i > 0) await new Promise(r => setTimeout(r, 2000));
                    
                    const base64Image = await generateImage(scenes[i].imagePrompt, imageAspectRatio, refImages);
                    newImages[i] = { ...newImages[i], src: base64Image, isLoading: false };
                    setGeneratedImages([...newImages]);
                } catch (error) {
                    console.error(`Error generating scene ${i + 1}:`, error);
                    newImages[i] = { ...newImages[i], isLoading: false, src: null };
                    setGeneratedImages([...newImages]);
                }
            }

        } catch (error: any) {
            console.error(error);
             if (getIsGlobalError(error)) {
                alert(`Error: ${error.message}`);
             } else {
                alert(`Gagal membuat cerita: ${error instanceof Error ? error.message : 'Pastikan API Key sudah diatur.'}`);
             }
            setIsGeneratingStory(false);
        }
    };
    
    const getIsGlobalError = (error: any) => {
        const msg = error?.message || "";
        return msg.includes("API Key") || msg.includes("Failed to fetch") || msg.includes("Rpc failed") || msg.includes("xhr error");
    };

    const handleRegenerateImage = async (imageToRegen: GeneratedImage) => {
        const index = generatedImages.findIndex(img => img.id === imageToRegen.id);
        if (index === -1) return;

        const updatedImages = [...generatedImages];
        updatedImages[index] = { ...updatedImages[index], isLoading: true, src: null };
        setGeneratedImages(updatedImages);

        try {
            const refImages = characterImage ? [characterImage.base64] : [];
            if (animalImage) refImages.push(animalImage.base64);

            const base64Image = await generateImage(imageToRegen.prompt, imageAspectRatio, refImages);
            updatedImages[index] = { ...updatedImages[index], src: base64Image, isLoading: false };
            setGeneratedImages(updatedImages);
        } catch (error) {
            alert("Gagal regenerasi gambar.");
            updatedImages[index] = { ...updatedImages[index], isLoading: false };
            setGeneratedImages(updatedImages);
        }
    };

    // --- Logic for Audio/Download ---

    const handleDownloadAudio = async () => {
        setIsGeneratingAudio(true);
        try {
            const zip = new JSZip();
            for (let i = 0; i < sceneNarrations.length; i++) {
                if (sceneNarrations[i]) {
                     try {
                        const base64Audio = await generateSpeech(sceneNarrations[i], selectedVoice);
                        const audioBytes = decodeBase64(base64Audio);
                        const wavBlob = pcmToWavBlob(audioBytes, 24000, 1, 16);
                        zip.file(`scene_${i + 1}_narration.wav`, wavBlob);
                     } catch (e) {
                         console.error(`Failed to generate audio for scene ${i}`, e);
                     }
                }
            }

            const content = await zip.generateAsync({ type: 'blob' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(content);
            link.download = 'cerita_audio_narasi.zip';
            link.click();

        } catch (error) {
            alert('Gagal mengunduh audio.');
        } finally {
            setIsGeneratingAudio(false);
        }
    };

    const handleDownloadImages = async () => {
        const zip = new JSZip();
        let count = 0;

        generatedImages.forEach((img, idx) => {
            if (img.src) {
                const base64Data = img.src.split(',')[1];
                zip.file(`scene_${idx + 1}.png`, base64Data, { base64: true });
                count++;
            }
        });

        if (count === 0) return alert("Belum ada gambar yang jadi.");

        const content = await zip.generateAsync({ type: 'blob' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = 'buku_cerita_emhatech.zip';
        link.click();
    };

    // --- Logic for UGC ---

    const handleGenerateUGC = async (useCharacter: boolean, useProduct: boolean, productCategory: ProductCategory) => {
        if (!ugcBaseImages[0] && !ugcBaseImages[1]) {
            alert("Harap unggah minimal karakter atau produk.");
            return;
        }

        setIsGeneratingUGC(true);
        setUgcGeneratedImages(Array(6).fill(null)); // Reset to 6
        setVideoJsons([]);

        try {
            const charDesc = useCharacter ? ugcCharacterDesc : '';
            const prodDesc = useProduct ? ugcProductDesc : '';
            
            const scripts = await generateUGCScripts(
                ugcScenario, 
                ugcLanguage, 
                charDesc, 
                prodDesc, 
                useProduct, 
                ugcBaseImages[1]?.base64,
                productCategory,
                ugcShotType
            );
            
            const jsonStrings = scripts.map(s => JSON.stringify(s, null, 2));
            setVideoJsons(jsonStrings);

            const newUgcImages = Array(6).fill(null).map(() => ({ 
                id: Math.random().toString(), 
                prompt: '', 
                src: null, 
                isLoading: true 
            }));
            setUgcGeneratedImages(newUgcImages);

            const refImages: string[] = [];
            if (useCharacter && ugcBaseImages[0]) refImages.push(ugcBaseImages[0]!.base64);
            if (useProduct && ugcBaseImages[1]) refImages.push(ugcBaseImages[1]!.base64);

            for (let i = 0; i < scripts.length; i++) {
                try {
                     // Reduced delay for faster generation
                     if (i > 0) await new Promise(r => setTimeout(r, 2000));
                     
                     const visualPrompt = scripts[i].visual_prompt;
                     const base64 = await generateImage(visualPrompt, '9:16', refImages);
                     
                     newUgcImages[i] = { 
                         id: `ugc-${i}`, 
                         prompt: visualPrompt, 
                         src: base64, 
                         isLoading: false 
                     };
                     setUgcGeneratedImages([...newUgcImages]);

                } catch (e) {
                     console.error(e);
                     newUgcImages[i] = { ...newUgcImages[i]!, isLoading: false };
                     setUgcGeneratedImages([...newUgcImages]);
                }
            }

        } catch (error) {
            alert("Gagal generate UGC: " + (error instanceof Error ? error.message : 'Unknown'));
        } finally {
            setIsGeneratingUGC(false);
        }
    };

    const handleRegenerateUGCImage = async (index: number, useCharacter: boolean, useProduct: boolean, productCategory: ProductCategory) => {
        const scriptJson = videoJsons[index];
        if (!scriptJson) return;

        const updatedImages = [...ugcGeneratedImages];
        updatedImages[index] = { ...updatedImages[index]!, isLoading: true, src: null };
        setUgcGeneratedImages(updatedImages);

        try {
            const parsed = JSON.parse(scriptJson);
            const refImages: string[] = [];
            if (useCharacter && ugcBaseImages[0]) refImages.push(ugcBaseImages[0]!.base64);
            if (useProduct && ugcBaseImages[1]) refImages.push(ugcBaseImages[1]!.base64);

            const base64 = await generateImage(parsed.visual_prompt, '9:16', refImages);
             updatedImages[index] = { 
                 ...updatedImages[index]!, 
                 prompt: parsed.visual_prompt, 
                 src: base64, 
                 isLoading: false 
             };
             setUgcGeneratedImages(updatedImages);
        } catch (error) {
            updatedImages[index] = { ...updatedImages[index]!, isLoading: false };
            setUgcGeneratedImages(updatedImages);
        }
    };

    const handleDownloadAllUGC = async () => {
         const zip = new JSZip();
         let count = 0;
         
         ugcGeneratedImages.forEach((img, idx) => {
             if (img && img.src) {
                 const base64 = img.src.split(',')[1];
                 zip.file(`ugc_image_${idx + 1}.png`, base64, { base64: true });
                 count++;
             }
         });

         if (count === 0) return alert("Tidak ada gambar untuk diunduh.");

         const content = await zip.generateAsync({ type: 'blob' });
         const link = document.createElement('a');
         link.href = URL.createObjectURL(content);
         link.download = 'terimakasi-emhatech-ganteng.zip';
         link.click();
    };


    // --- Logic for Music Lyrics ---
    
    const handleGetLyrics = async () => {
        setIsFetchingLyrics(true);
        setTranslatedLyrics(null);
        try {
            const result = await generateLyrics(youtubeUrl);
            setOriginalLyrics(result.lyrics);
            setLyricSources(result.sources);
        } catch (error) {
            alert("Gagal mengambil lirik. Pastikan API Key valid.");
        } finally {
            setIsFetchingLyrics(false);
        }
    };

    const handleTranslateLyrics = async () => {
        setIsTranslatingLyrics(true);
        try {
            const translated = await translateLyrics(originalLyrics, selectedLyricLanguage);
            setTranslatedLyrics(translated);
        } catch (error) {
            alert("Gagal menerjemahkan lirik.");
        } finally {
            setIsTranslatingLyrics(false);
        }
    };

    const handleSaveApiKeys = (keys: string[]) => {
        setApiKeysState(keys);
        setApiKeys(keys);
        localStorage.setItem('gemini_api_keys', JSON.stringify(keys));
        setShowApiKeyModal(false);
    };

    return (
        <div className={`min-h-screen font-sans transition-colors duration-300 ${theme === 'dark' ? 'dark bg-slate-900' : 'bg-slate-100'}`}>
            <div className="flex flex-col min-h-screen">
                <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-grow">
                    
                    <Header 
                        theme={theme} 
                        onThemeToggle={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')} 
                        onApiKeySettingsClick={() => setShowApiKeyModal(true)}
                    />

                    {/* Main Content Layout */}
                    <main className="mt-8 flex flex-col lg:flex-row gap-6">
                        
                        {/* Sidebar Navigation */}
                        <aside className="lg:w-64 flex-shrink-0">
                            <nav className="flex flex-col space-y-2 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 sticky top-6">
                                <TabButton 
                                    name="Wizard Cerita" 
                                    active={view === 'wizard' || view === 'storybook'} 
                                    onClick={() => setView('wizard')} 
                                    vertical={true}
                                />
                                <TabButton 
                                    name="UGC Img & Prompt" 
                                    active={view === 'imageAffiliate'} 
                                    onClick={() => setView('imageAffiliate')} 
                                    vertical={true}
                                />
                                <TabButton 
                                    name="Lirik Musik" 
                                    active={view === 'musicLyric'} 
                                    onClick={() => setView('musicLyric')} 
                                    vertical={true}
                                />
                                <TabButton 
                                    name="Img to Video (Veo)" 
                                    active={view === 'imgToVideo'} 
                                    onClick={() => setView('imgToVideo')} 
                                    vertical={true}
                                />
                                <TabButton 
                                    name="Grok Generator (Web)" 
                                    active={false} 
                                    onClick={() => window.open('https://grok.com/', '_blank')} 
                                    vertical={true}
                                />
                                <a 
                                    href="https://wa.me/6285711087751?text=Butuh%20flow%20video"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full px-4 py-3 rounded-r-lg border-l-4 font-semibold transition-all duration-200 text-left focus:outline-none border-transparent text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-700 dark:hover:text-green-300 flex justify-between items-center group"
                                >
                                    Butuh Flow Video? (WA)
                                    <span className="text-xs opacity-50 group-hover:opacity-100">↗</span>
                                </a>
                                <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-700">
                                    <TabButton 
                                        name="Tentang" 
                                        active={view === 'about'} 
                                        onClick={() => setView('about')} 
                                        vertical={true}
                                    />
                                </div>
                            </nav>
                        </aside>

                        {/* View Content - Modified to use display toggling instead of conditional rendering */}
                        <div className="flex-1 min-w-0">
                            <div className={view === 'wizard' ? 'block' : 'hidden'}>
                                <StoryWizard
                                    genres={GENRES}
                                    selectedGenre={selectedGenre}
                                    onGenreChange={handleGenreChange}
                                    storyIdeas={storyIdeas}
                                    isLoadingIdeas={isLoadingIdeas}
                                    onSelectIdea={handleSelectIdea}
                                    storyText={storyText}
                                    onStoryTextChange={setStoryText}
                                    onDismissIdea={handleDismissIdea}
                                    isStoryReady={storyText.length > 20}
                                    onGenerateStory={handleGenerateStory}
                                    isGeneratingStory={isGeneratingStory}
                                    onPolishStory={handlePolishStory}
                                    isPolishing={isPolishing}
                                    characterImage={characterImage}
                                    onCharacterImageChange={setCharacterImage}
                                    onCharacterTextChange={setCharacterText}
                                    characterText={characterText}
                                    characterGender={characterGender}
                                    onCharacterGenderChange={setCharacterGender}
                                    animalImage={animalImage}
                                    onAnimalImageChange={setAnimalImage}
                                    imageAspectRatio={imageAspectRatio}
                                    onImageAspectRatioChange={setImageAspectRatio}
                                    sceneCount={sceneCount}
                                    onSceneCountChange={setSceneCount}
                                />
                            </div>

                            <div className={view === 'storybook' ? 'block' : 'hidden'}>
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                                        <button 
                                            onClick={() => setView('wizard')}
                                            className="text-cyan-600 dark:text-cyan-400 font-bold hover:underline"
                                        >
                                            ← Kembali ke Wizard
                                        </button>
                                        <span className="text-sm text-slate-500 dark:text-slate-400 Hasil Generasi Cerita"></span>
                                    </div>
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
                                </div>
                            </div>

                            <div className={view === 'imageAffiliate' ? 'block' : 'hidden'}>
                                <ImageAffiliateView 
                                    baseImages={ugcBaseImages}
                                    onBaseImageChange={(img, idx) => {
                                        const newImgs = [...ugcBaseImages];
                                        newImgs[idx] = img;
                                        setUgcBaseImages(newImgs);
                                    }}
                                    isGenerating={isGeneratingUGC}
                                    onGenerate={handleGenerateUGC}
                                    generatedImages={ugcGeneratedImages}
                                    videoJsons={videoJsons}
                                    onDownloadAll={handleDownloadAllUGC}
                                    scenario={ugcScenario}
                                    onScenarioChange={setUgcScenario}
                                    languages={UGC_LANGUAGES}
                                    selectedLanguage={ugcLanguage}
                                    onLanguageChange={setUgcLanguage}
                                    onRegenerate={handleRegenerateUGCImage}
                                    characterDesc={ugcCharacterDesc}
                                    onCharacterDescChange={setUgcCharacterDesc}
                                    productDesc={ugcProductDesc}
                                    onProductDescChange={setUgcProductDesc}
                                    shotType={ugcShotType}
                                    onShotTypeChange={setUgcShotType}
                                />
                            </div>

                            <div className={view === 'musicLyric' ? 'block' : 'hidden'}>
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
                            </div>

                            <div className={view === 'imgToVideo' ? 'block' : 'hidden'}>
                                <ImageToVideoView />
                            </div>

                            <div className={view === 'about' ? 'block' : 'hidden'}>
                                <AboutView />
                            </div>
                        </div>
                    </main>

                    {/* Loading Overlay */}
                    {(isGeneratingStory || isGeneratingUGC) && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
                            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center border-2 border-cyan-500/50">
                                <div className="mb-6 relative">
                                    <div className="absolute inset-0 bg-cyan-400 rounded-full opacity-20 animate-ping"></div>
                                    <Spinner className="h-16 w-16 text-cyan-500 mx-auto relative z-10" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">
                                    {isGeneratingUGC ? "Membuat Konten Viral..." : "Mewujudkan Imajinasi..."}
                                </h3>
                                <p className="text-cyan-600 dark:text-cyan-400 font-medium text-lg min-h-[3.5rem] flex items-center justify-center">
                                    {isGeneratingStory ? storyLoadingMessage : loadingMessage}
                                </p>
                            </div>
                        </div>
                    )}

                    <ApiKeyModal 
                        isOpen={showApiKeyModal}
                        currentApiKeys={apiKeys}
                        onClose={() => setShowApiKeyModal(false)}
                        onSave={handleSaveApiKeys}
                    />
                </div>
                
                <Footer />
            </div>
        </div>
    );
};
