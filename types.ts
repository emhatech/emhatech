

export interface Genre {
  name: string;
  value: string;
  emoji: string;
}

export interface StoryIdea {
  id: string;
  text: string;
}

export type AspectRatio = '16:9' | '9:16';

export interface GeneratedImage {
  id: string;
  prompt: string;
  src: string | null;
  isLoading: boolean;
}

export interface CharacterImageData {
  base64: string;
  mimeType: string;
  name: string;
}

export type View = 'wizard' | 'storybook' | 'imageAffiliate' | 'about' | 'musicLyric' | 'videoGenerator' | 'imgToVideo';

export type Gender = 'male' | 'female' | 'unspecified';

export type Voice = 'Kore' | 'Puck' | 'Zephyr';

export interface VoiceOption {
  name: string;
  value: Voice;
}

export interface LanguageOption {
  name: string;
  value: string;
}

export interface LyricLine {
  original: string;
  translated: string;
}

export interface LyricData {
  lyrics: string;
  sources: { title: string; uri: string }[];
}

export type ProductCategory = 
  | 'general' 
  | 'clothing' 
  | 'perfume_skincare' 
  | 'vehicle' 
  | 'footwear' 
  | 'headwear' 
  | 'eyewear' 
  | 'toy_gadget';

export interface ProductCategoryOption {
    label: string;
    value: ProductCategory;
    actionVerb: string; // e.g. "Wearing", "Holding", "Riding"
}