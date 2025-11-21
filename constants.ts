import { Genre, VoiceOption, LanguageOption } from './types';

export const INITIAL_IDEAS_COUNT = 16;

export const GENRES: Genre[] = [
  { name: 'Petualangan Fantasi', value: 'fantasy_adventure', emoji: '🧙' },
  { name: 'Misteri Fiksi Ilmiah', value: 'sci_fi_mystery', emoji: '👽' },
  { name: 'Komedi Mengharukan', value: 'heartwarming_comedy', emoji: '😂' },
  { name: 'Pencarian Epik', value: 'epic_quest', emoji: '🗺️' },
  { name: 'Asal-usul Pahlawan Super', value: 'superhero_origin', emoji: '🦸' },
  { name: 'Thriller Menyeramkan', value: 'spooky_thriller', emoji: '👻' },
];

export const VOICE_OPTIONS: VoiceOption[] = [
  { name: 'Wanita (Narator)', value: 'Kore' },
  { name: 'Pria (Narator)', value: 'Puck' },
  { name: 'Pria (Bersemangat)', value: 'Zephyr' },
];

export const UGC_LANGUAGES: LanguageOption[] = [
  { name: 'Indonesia', value: 'Indonesian' },
  { name: 'Inggris', value: 'English' },
  { name: 'Jepang', value: 'Japanese' },
  { name: 'Korea', value: 'Korean' },
  { name: 'Spanyol', value: 'Spanish' },
  { name: 'Malaysia', value: 'Malay' },
  { name: 'India', value: 'Hindi' },
];

export const LYRIC_LANGUAGES: LanguageOption[] = [
    { name: 'Inggris', value: 'English' },
    { name: 'Jepang', value: 'Japanese' },
    { name: 'Indonesia', value: 'Indonesian' },
    { name: 'Jawa', value: 'Javanese' },
    { name: 'Sunda', value: 'Sundanese' },
];