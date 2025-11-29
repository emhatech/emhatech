
import React from 'react';
import { Genre, StoryIdea, CharacterImageData, Gender, AspectRatio } from '../types';
import { PlusIcon, SparklesIcon, XIcon, WandIcon, LandscapeIcon, PortraitIcon, FilmIcon } from './Icons';
import { Spinner } from './common/Spinner';
import { CharacterCreator } from './CharacterCreator';
import { ToggleButton } from './common/ToggleButton';
import { ImageUploader } from './common/ImageUploader';

interface StoryWizardProps {
  genres: Genre[];
  selectedGenre: Genre;
  onGenreChange: (genre: Genre) => void;
  storyIdeas: StoryIdea[];
  isLoadingIdeas: boolean;
  onSelectIdea: (idea: StoryIdea) => void;
  storyText: string;
  onStoryTextChange: (text: string) => void;
  onDismissIdea: (idea: StoryIdea) => void;
  isStoryReady: boolean;
  onGenerateStory: () => void;
  isGeneratingStory: boolean;
  onPolishStory: () => void;
  isPolishing: boolean;
  characterImage: CharacterImageData | null;
  onCharacterImageChange: (imageData: CharacterImageData | null) => void;
  onCharacterTextChange: (text: string) => void;
  characterText: string;
  characterGender: Gender;
  onCharacterGenderChange: (gender: Gender) => void;
  animalImage: CharacterImageData | null;
  onAnimalImageChange: (imageData: CharacterImageData | null) => void;
  imageAspectRatio: AspectRatio;
  onImageAspectRatioChange: (ratio: AspectRatio) => void;
  sceneCount: number;
  onSceneCountChange: (count: number) => void;
}

export const StoryWizard: React.FC<StoryWizardProps> = ({
  genres,
  selectedGenre,
  onGenreChange,
  storyIdeas,
  isLoadingIdeas,
  onSelectIdea,
  storyText,
  onStoryTextChange,
  onDismissIdea,
  isStoryReady,
  onGenerateStory,
  isGeneratingStory,
  onPolishStory,
  isPolishing,
  characterImage,
  onCharacterImageChange,
  onCharacterTextChange,
  characterText,
  characterGender,
  onCharacterGenderChange,
  animalImage,
  onAnimalImageChange,
  imageAspectRatio,
  onImageAspectRatioChange,
  sceneCount,
  onSceneCountChange,
}) => {
  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in pb-12">
      
      {/* SECTION 1: INSPIRATION (Genre & Ideas) */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors duration-300">
        <div className="mb-6 text-center">
            <h2 className="text-xl font-bold text-cyan-700 dark:text-cyan-400 mb-2">Langkah 1: Tentukan Tema & Ide</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Pilih genre favorit Anda dan klik ide cerita untuk memulai.</p>
        </div>

        {/* Genres */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {genres.map(genre => (
            <ToggleButton
              key={genre.value}
              name={genre.name}
              onClick={() => onGenreChange(genre)}
              active={selectedGenre.value === genre.value}
            >
              <span className="text-lg mr-1">{genre.emoji}</span>
            </ToggleButton>
          ))}
        </div>

        {/* Idea Pool Grid */}
        <div className="bg-indigo-50 dark:bg-slate-900/50 p-4 rounded-xl border border-indigo-100 dark:border-slate-700">
            <h3 className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mb-3 flex items-center">
                <SparklesIcon className="h-4 w-4 mr-2"/>
                Kumpulan Ide Cerita (Klik untuk tambah)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
            {isLoadingIdeas ? (
                Array.from({ length: 8 }).map((_, index) => (
                    <div key={index} className="bg-white dark:bg-slate-800 h-20 rounded-lg animate-pulse border border-slate-200 dark:border-slate-700"></div>
                ))
            ) : (
                storyIdeas.map(idea => (
                <div key={idea.id} className="relative group">
                    <button
                    type="button"
                    onClick={() => onSelectIdea(idea)}
                    className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-left p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-md transition-all duration-200 w-full h-full min-h-[5rem] text-xs sm:text-sm flex flex-col justify-between"
                    >
                    <span className="line-clamp-3 mb-1">{idea.text}</span>
                    <PlusIcon className="h-4 w-4 text-indigo-400 self-end"/>
                    </button>
                    <button 
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onDismissIdea(idea); }}
                        className="absolute -top-1 -right-1 p-1 rounded-full bg-red-100 text-red-500 opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all z-10 shadow-sm"
                        title="Hapus ide ini"
                    >
                        <XIcon className="h-3 w-3" />
                    </button>
                </div>
                ))
            )}
            </div>
        </div>
      </div>

      {/* SECTION 2: CONFIGURATION (Character & Settings) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Character Config */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
               <h2 className="text-lg font-bold text-cyan-700 dark:text-cyan-400 mb-4 flex items-center">
                    <span className="bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 w-6 h-6 rounded-full flex items-center justify-center text-sm mr-2">2</span>
                    Karakter Utama
               </h2>
               <CharacterCreator 
                    characterImage={characterImage}
                    onCharacterImageChange={onCharacterImageChange}
                    onCharacterTextChange={onCharacterTextChange}
                    characterText={characterText}
                    gender={characterGender}
                    onGenderChange={onCharacterGenderChange}
                />
          </div>

          {/* Visual Settings */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
                <h2 className="text-lg font-bold text-cyan-700 dark:text-cyan-400 mb-4 flex items-center">
                    <span className="bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 w-6 h-6 rounded-full flex items-center justify-center text-sm mr-2">3</span>
                    Pengaturan Visual & Durasi
               </h2>
               
               <div className="mb-6 space-y-4">
                    <div>
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Rasio Gambar</p>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => onImageAspectRatioChange('16:9')}
                                className={`flex-1 py-3 px-4 rounded-lg border text-sm font-semibold transition-all flex flex-col items-center justify-center gap-2 ${
                                    imageAspectRatio === '16:9'
                                        ? 'bg-cyan-50 dark:bg-cyan-900/20 border-cyan-500 text-cyan-700 dark:text-cyan-400 ring-1 ring-cyan-500'
                                        : 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-600'
                                }`}
                            >
                                <LandscapeIcon className="h-6 w-6" />
                                Landscape (16:9)
                            </button>
                            <button
                                type="button"
                                onClick={() => onImageAspectRatioChange('9:16')}
                                className={`flex-1 py-3 px-4 rounded-lg border text-sm font-semibold transition-all flex flex-col items-center justify-center gap-2 ${
                                    imageAspectRatio === '9:16'
                                        ? 'bg-cyan-50 dark:bg-cyan-900/20 border-cyan-500 text-cyan-700 dark:text-cyan-400 ring-1 ring-cyan-500'
                                        : 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-600'
                                }`}
                            >
                                <PortraitIcon className="h-6 w-6" />
                                Portrait (9:16)
                            </button>
                        </div>
                    </div>

                    <div>
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Jumlah Scene / Adegan</p>
                        <div className="flex gap-2">
                             {[5, 10, 15].map(count => (
                                <button
                                    key={count}
                                    type="button"
                                    onClick={() => onSceneCountChange(count)}
                                    className={`flex-1 py-2 px-3 rounded-lg border text-sm font-bold transition-all ${
                                        sceneCount === count
                                            ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500 text-indigo-700 dark:text-indigo-400 ring-1 ring-indigo-500'
                                            : 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-600'
                                    }`}
                                >
                                    {count} Scene
                                </button>
                             ))}
                        </div>
                    </div>
               </div>

               <div className="mt-auto">
                    <ImageUploader
                        image={animalImage}
                        onImageChange={onAnimalImageChange}
                        label="Pendamping / Hewan (Opsional)"
                        heightClass="h-20"
                    />
               </div>
          </div>
      </div>

      {/* SECTION 3: COMPOSITION (Text & Actions) */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg">
        <h2 className="text-lg font-bold text-cyan-700 dark:text-cyan-400 mb-4 flex items-center">
            <span className="bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 w-6 h-6 rounded-full flex items-center justify-center text-sm mr-2">4</span>
            Tulis Alur Cerita
        </h2>

        <div className="relative bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-300 dark:border-slate-600 focus-within:ring-2 focus-within:ring-cyan-500 focus-within:border-transparent transition-all mb-6">
            <textarea
                value={storyText}
                onChange={(e) => onStoryTextChange(e.target.value)}
                className="w-full bg-transparent p-6 min-h-[200px] resize-y text-slate-700 dark:text-slate-200 focus:outline-none text-lg leading-relaxed placeholder-slate-400 dark:placeholder-slate-500"
                placeholder="Mulai menulis di sini, atau klik ide di atas untuk memulai..."
            />
            <div className="absolute bottom-4 right-4 text-xs text-slate-400">
                {storyText.length} karakter
            </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
             <button
                type="button"
                onClick={onPolishStory}
                disabled={!isStoryReady || isPolishing || isGeneratingStory}
                className="sm:w-1/3 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 font-bold py-4 px-6 rounded-xl flex items-center justify-center transition-all duration-200 hover:bg-amber-200 dark:hover:bg-amber-900/50 border border-amber-200 dark:border-amber-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isPolishing ? (
                    <>
                        <Spinner className="h-5 w-5 mr-2 text-amber-600"/>
                        Memoles...
                    </>
                ) : (
                    <>
                        <WandIcon className="h-5 w-5 mr-2"/>
                        Poles Tulisan AI
                    </>
                )}
            </button>

            <button
                type="button"
                onClick={onGenerateStory}
                disabled={!isStoryReady || isGeneratingStory || isPolishing}
                className="sm:w-2/3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center transition-all duration-200 hover:from-cyan-700 hover:to-blue-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:from-slate-400 disabled:to-slate-500 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
            >
                {isGeneratingStory ? (
                    <>
                        <Spinner className="h-6 w-6 mr-3 text-white"/>
                        <span className="text-lg">Sedang Merangkai {sceneCount} Scene...</span>
                    </>
                ) : (
                    <>
                        <SparklesIcon className="h-6 w-6 mr-3"/>
                        <span className="text-lg">GENERATE STORYBOOK</span>
                    </>
                )}
            </button>
        </div>
      </div>

    </div>
  );
};
