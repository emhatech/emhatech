
import { Genre, VoiceOption, LanguageOption, ProductCategoryOption } from './types';

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

export const PRODUCT_CATEGORIES: ProductCategoryOption[] = [
    { label: 'Umum / Lainnya', value: 'general', actionVerb: 'Holding/Showing' },
    { label: 'Baju / Celana (Fashion)', value: 'clothing', actionVerb: 'WEARING on body' },
    { label: 'Parfum / Skincare / Botol', value: 'perfume_skincare', actionVerb: 'HOLDING in hand / APPLYING' },
    { label: 'Kendaraan (Motor/Mobil/Sepeda)', value: 'vehicle', actionVerb: 'RIDING / DRIVING / SITTING ON' },
    { label: 'Sepatu / Sendal', value: 'footwear', actionVerb: 'WEARING on feet' },
    { label: 'Topi / Helm', value: 'headwear', actionVerb: 'WEARING on head' },
    { label: 'Kacamata', value: 'eyewear', actionVerb: 'WEARING on face' },
    { label: 'Mainan / Gadget', value: 'toy_gadget', actionVerb: 'PLAYING WITH / HOLDING' },
];
