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
    View, Voice, AspectRatio, LyricLine, ProductCategory 
} from './types';
import { 
    setApiKeys, generateFullStory, generateStoryScenes, 
    generateStoryIdeas, polishStoryText, generateImage, generateSpeech,
    generateLyrics, translateLyrics, generateUGCScripts
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
    const [ugcCharacterDesc, setUgcCharacterDesc] = useState(''); 
    const [ugcProductDesc, setUgcProductDesc] = useState(''); 
    const [ugcScenario, setUgcScenario] = useState('A captivating, high-quality cinematic showcase featuring the subject in various aesthetic lifestyle settings. Professional lighting, elegant composition, viral social media style.');
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
                }
            } else {
                 // On initial load, if NO keys are saved and NO process.env.API_KEY is available (e.g. GitHub Pages),
                 // Show the modal to prompt the user.
                 if (!process.env.API_KEY) {
                     setTimeout(() => setShowApiKeyModal(true), 1000);
                 }
            }

            // Load Auto-Saved Drafts
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
                } catch (e) {
                    console.warn("Failed to load saved draft", e);
                }
            }
        } catch (e) {
            console.warn("Local storage access blocked or failed", e);
        }

        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            setTheme('dark');
        }
    }, []);

    // Auto-Save Drafts Effect
    useEffect(() => {
        const draft = {
            storyText,
            characterText,
            characterGender,
            selectedGenreValue: selectedGenre.value
        };
        localStorage.setItem('emhatech_wizard_draft', JSON.stringify(draft));
    }, [storyText, characterText, characterGender, selectedGenre]);

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
        const errorMessage = (err?.message || JSON.stringify(err)).toLowerCase();
        // Enhanced error detection for common API key or quota issues
        if (
            err.name === "AllApiKeysFailedError" || 
            errorMessage.includes("429") || 
            errorMessage.includes("quota") ||
            errorMessage.includes("resource_exhausted") ||
            errorMessage.includes("api key") ||
            errorMessage.includes("403") ||
            errorMessage.includes("400") ||
            errorMessage.includes("fetch failed") ||
            errorMessage.includes("not valid")
        ) {
            setShowApiKeyModal(true);
        }
    };

    const handleGlobalCharacterImageChange = (img: CharacterImageData | null) => {
        setCharacterImage(img);
        setUgcBaseImages(prev => [img, prev[1]]); 
    };

    const handleUgcBaseImageChange = (img: CharacterImageData | null, idx: number) => {
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
            alert('Gagal memoles cerita. Periksa Koneksi/API Key.');
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

            await new Promise(r => setTimeout(r, 3000));

            const refImages = characterImage?.base64 ? [characterImage.base64] : [];

            for (let i = 0; i < scenes.length; i++) {
                try {
                    if (i > 0) await new Promise(r => setTimeout(r, 8000));

                    const base64 = await generateImage(scenes[i].imagePrompt, imageAspectRatio, refImages);
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
            const refImages = characterImage?.base64 ? [characterImage.base64] : [];
            const base64 = await generateImage(imageToRegen.prompt, imageAspectRatio, refImages);
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
                newImages[index] = { ...newImages[index]!, isLoading: false };
                return newImages;
            });
        }
    };

    const handleDownloadImages = async () => {
      const validImages = generatedImages.filter(img => img.src);
      if (validImages.length === 0) {
          alert("Tidak ada gambar untuk disimpan. Silakan generate cerita terlebih dahulu.");
          return;
      }

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
        if (validImages.length === 0 && videoJsons.length === 0) {
             alert("Tidak ada konten UGC untuk disimpan. Silakan generate terlebih dahulu.");
             return;
        }

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

    const handleGenerateUGC = async (useCharacter: boolean, useProduct: boolean, productCategory: ProductCategory) => {
        setIsGeneratingUGC(true);
        setUgcGeneratedImages(Array(7).fill(null));
        setVideoJsons([]);
        
        try {
            const genderStr = characterGender === 'male' ? 'Male' : characterGender === 'female' ? 'Female' : 'Character';
            const charDescToUse = ugcCharacterDesc.trim() ? ugcCharacterDesc : `${genderStr}. ${characterText}`;
            const hasProductImage = !!ugcBaseImages[1];
            const includeProduct = useProduct && hasProductImage;
            const promptToUse = ugcScenario.trim() || 'A captivating, high-quality cinematic showcase featuring the subject in various aesthetic lifestyle settings. Professional lighting, elegant composition, viral social media style.';

            const productImage = includeProduct ? ugcBaseImages[1]?.base64 : undefined;
            
            const scripts = await generateUGCScripts(
                promptToUse, 
                ugcLanguage, 
                charDescToUse, 
                ugcProductDesc, 
                includeProduct, 
                productImage,
                productCategory 
            );
            
            const jsonStrings = scripts.map(s => JSON.stringify(s, null, 2));
            setVideoJsons(jsonStrings);

            const initialImages: GeneratedImage[] = scripts.map((s, i) => ({
                id: `ugc-${Date.now()}-${i}`,
                prompt: s.visual_prompt,
                src: null,
                isLoading: true
            }));
            setUgcGeneratedImages(initialImages);

            const referenceImages: string[] = [];
            
            if (useCharacter && ugcBaseImages[0]?.base64) {
                referenceImages.push(ugcBaseImages[0].base64);
            }
            if (includeProduct && ugcBaseImages[1]?.base64) {
                referenceImages.push(ugcBaseImages[1].base64);
            }

            for (let i = 0; i < scripts.length; i++) {
                if (i > 0) await new Promise(r => setTimeout(r, 8000)); 

                try {
                    const base64 = await generateImage(scripts[i].visual_prompt, '9:16', referenceImages);
                    setUgcGeneratedImages(prev => {
                        const newImages = [...prev];
                        if (newImages[i]) {
                             newImages[i] = { ...newImages[i]!, src: base64, isLoading: false };
                        }
                        return newImages;
                    });
                } catch (err) {
                    console.error(`Failed UGC image ${i}`, err);
                    handleApiError(err);
                    setUgcGeneratedImages(prev => {
                        const newImages = [...prev];
                        if (newImages[i]) {
                             newImages[i] = { ...newImages[i]!, isLoading: false };
                        }
                        return newImages;
                    });
                }
            }

        } catch (e) {
            console.error(e);
            alert('Gagal membuat konten UGC: ' + (e as Error).message);
            handleApiError(e);
        } finally {
            setIsGeneratingUGC(false);
        }
    };

    const handleRegenerateUGC = async (index: number, useCharacter: boolean, useProduct: boolean, productCategory: ProductCategory) => {
        if (!videoJsons[index]) return;

        let prompt = "";
        try {
             const script = JSON.parse(videoJsons[index]);
             prompt = script.visual_prompt;
        } catch (e) {
            return;
        }

        setUgcGeneratedImages(prev => {
            const newImages = [...prev];
            if (newImages[index]) {
                 newImages[index] = { ...newImages[index]!, isLoading: true };
            }
            return newImages;
        });

        try {
            const referenceImages: string[] = [];
            if (useCharacter && ugcBaseImages[0]?.base64) {
                referenceImages.push(ugcBaseImages[0].base64);
            }
            if (useProduct && ugcBaseImages[1]?.base64) {
                referenceImages.push(ugcBaseImages[1].base64);
            }

            const base64 = await generateImage(prompt, '9:16', referenceImages);
            
            setUgcGeneratedImages(prev => {
                const newImages = [...prev];
                newImages[index] = { ...newImages[index]!, src: base64, isLoading: false };
                return newImages;
            });
        } catch (e) {
             console.error(e);
             handleApiError(e);
             setUgcGeneratedImages(prev => {
                const newImages = [...prev];
                newImages[index] = { ...newImages[index]!, isLoading: false };
                return newImages;
            });
        }
    };

    const handleGetLyrics = async () => {
        if (!youtubeUrl) return;
        setIsFetchingLyrics(true);
        setOriginalLyrics('');
        setTranslatedLyrics(null);
        setLyricSources([]);
        
        try {
            const { lyrics, sources } = await generateLyrics(youtubeUrl);
            setOriginalLyrics(lyrics);
            setLyricSources(sources);
        } catch (e) {
             console.error(e);
             handleApiError(e);
             setOriginalLyrics("Gagal mendapatkan lirik. Pastikan link benar atau coba judul lagu.");
        } finally {
            setIsFetchingLyrics(false);
        }
    };

    const handleTranslateLyrics = async () => {
        if (!originalLyrics) return;
        setIsTranslatingLyrics(true);
        try {
            const result = await translateLyrics(originalLyrics, selectedLyricLanguage);
            setTranslatedLyrics(result);
        } catch (e) {
            console.error(e);
            handleApiError(e);
            alert("Gagal menerjemahkan lirik.");
        } finally {
             setIsTranslatingLyrics(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300">
            <ApiKeyModal 
                isOpen={showApiKeyModal} 
                currentApiKeys={apiKeys} 
                onClose={() => setShowApiKeyModal(false)} 
                onSave={handleApiKeysSave} 
            />
            
            <div className="bg-red-600 text-white py-2 overflow-hidden shadow-md relative z-20 border-b border-red-800">
                 <div className="marquee-container">
                    <div className="marquee-content font-bold text-sm sm:text-base tracking-wider uppercase">
                        WARNING: UBAH TOOLS INI TIDAK ADA GARANSI TERIMAKASIH!!!  &nbsp;&nbsp;&nbsp;  WARNING: UBAH TOOLS INI TIDAK ADA GARANSI TERIMAKASIH!!!
                    </div>
                 </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-6 flex-grow flex flex-col">
                <Header theme={theme} onThemeToggle={handleThemeToggle} onApiKeySettingsClick={() => setShowApiKeyModal(true)} />

                <nav className="flex overflow-x-auto gap-2 my-6 pb-2 no-scrollbar">
                    <TabButton name="Generator Cerita" active={view === 'wizard' || view === 'storybook'} onClick={() => setView('wizard')} />
                    <TabButton name="Video Generator (Veo)" active={view === 'videoGenerator'} onClick={() => setView('videoGenerator')} />
                    <TabButton name="UGC Img & Prompt" active={view === 'imageAffiliate'} onClick={() => setView('imageAffiliate')} />
                    <TabButton name="Lirik & Musik" active={view === 'musicLyric'} onClick={() => setView('musicLyric')} />
                    <TabButton name="Tentang" active={view === 'about'} onClick={() => setView('about')} />
                </nav>

                <main className="flex-grow flex flex-col">
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
                            isStoryReady={!!storyText.trim()}
                            onGenerateStory={handleGenerateStory}
                            isGeneratingStory={isGeneratingStory}
                            onPolishStory={handlePolishStory}
                            isPolishing={isPolishing}
                            characterImage={characterImage}
                            onCharacterImageChange={handleGlobalCharacterImageChange}
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

                    {view === 'videoGenerator' && (
                        <VideoGeneratorView />
                    )}

                    {view === 'imageAffiliate' && (
                        <ImageAffiliateView
                            baseImages={ugcBaseImages}
                            onBaseImageChange={handleUgcBaseImageChange}
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
                            onRegenerate={handleRegenerateUGC}
                            characterDesc={ugcCharacterDesc}
                            onCharacterDescChange={setUgcCharacterDesc}
                            productDesc={ugcProductDesc}
                            onProductDescChange={setUgcProductDesc}
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

                    {view === 'about' && <AboutView />}
                    
                    {isGeneratingStory && (
                         <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm">
                            <div className="text-center max-w-md p-8">
                                <Spinner className="h-16 w-16 text-cyan-600 mx-auto mb-6" />
                                <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">{storyLoadingMessage}</h3>
                                <p className="text-slate-600 dark:text-slate-400 animate-pulse">{loadingMessage}</p>
                            </div>
                        </div>
                    )}
                </main>
            </div>
            <Footer />
        </div>
    );
};
