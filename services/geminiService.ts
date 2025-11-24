import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Gender, AspectRatio, ProductCategory } from '../types';

let apiKeys: string[] = [];

export function setApiKeys(keys: string[]) {
    apiKeys = keys;
}

// Helper to extract error message robustly from various error objects/formats
function getErrorMessage(error: any): string {
    if (typeof error === 'string') return error;
    if (error instanceof Error) return error.message;
    // Handle the specific JSON error object structure usually returned by the proxy
    // {"error":{"code":500,"message":"...","status":"UNKNOWN"}}
    if (error?.error?.message) return error.error.message;
    if (error?.message) return error.message;
    
    try {
        return JSON.stringify(error);
    } catch {
        return "Unknown Error";
    }
}

// Helper to resize image to reduce payload size and prevent RPC errors
// Reduced default to 256px for reference images to speed up processing
async function resizeImageBase64(base64Str: string, maxWidth = 256): Promise<string> {
    if (!base64Str || !base64Str.startsWith('data:image')) return base64Str;
    
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }
            } else {
                if (height > maxWidth) {
                    width = Math.round((width * maxWidth) / height);
                    height = maxWidth;
                }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(img, 0, 0, width, height);
                // Compress to JPEG 0.5 to significantly reduce size
                resolve(canvas.toDataURL('image/jpeg', 0.5));
            } else {
                resolve(base64Str);
            }
        };
        img.onerror = () => resolve(base64Str);
        img.src = base64Str;
    });
}

async function callWithApiKeyRotation<T>(operation: (client: GoogleGenAI, key: string) => Promise<T>): Promise<T> {
    const keysToTry = apiKeys.length > 0 ? apiKeys : [process.env.API_KEY || ''];
    let lastError: any;
    
    for (const key of keysToTry) {
        if (!key) continue;
        try {
            const client = new GoogleGenAI({ apiKey: key });
            return await operation(client, key);
        } catch (error: any) {
            const errorMessage = getErrorMessage(error);
            
            // Retry on specific RPC or XHR errors which are often transient
            const isTransient = errorMessage.includes("Rpc failed") || 
                               errorMessage.includes("xhr error") || 
                               errorMessage.includes("fetch failed") ||
                               errorMessage.includes("500") ||
                               errorMessage.includes("503");

            if (isTransient) {
                 console.warn(`Transient network error with key ${key.substring(0,5)}...: ${errorMessage}. Retrying...`);
                 // Add a small delay before retrying to allow connection to reset
                 await new Promise(resolve => setTimeout(resolve, 1500));
            } else {
                 console.warn("API Call failed with key", key.substring(0, 5) + "...", errorMessage);
            }
            lastError = error;
        }
    }
    
    const finalErrorMessage = getErrorMessage(lastError);
    // Explicitly check for empty key scenarios common in GitHub deployments
    if (finalErrorMessage.includes("API key not valid") || keysToTry.every(k => !k)) {
        throw new Error("API Key hilang atau tidak valid. Silakan atur di tombol 'Gerigi' di pojok kanan atas.");
    }
    throw new Error(finalErrorMessage || "All API keys failed or none provided.");
}

function cleanJsonText(text: string): string {
    if (!text) return "[]";
    // Remove markdown code blocks more aggressively and trim
    let cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    
    // Find the first [ or {
    const firstOpen = cleaned.search(/\[|\{/);
    if (firstOpen !== -1) {
        cleaned = cleaned.substring(firstOpen);
        
        // Try to find the matching closing bracket/brace at the end
        const isArray = cleaned.startsWith('[');
        
        if (isArray) {
            // For arrays, find the last closing object brace '}' inside it, 
            // in case the array itself is truncated (missing ']')
            const lastObjClose = cleaned.lastIndexOf('}');
            if (lastObjClose !== -1) {
                // Cut off after the last complete object and ensure it ends with ]
                // This handles cases where the JSON stream was cut off mid-object or mid-array
                let candidate = cleaned.substring(0, lastObjClose + 1);
                if (!candidate.endsWith(']')) {
                    candidate += ']';
                }
                return candidate;
            } else {
                // If no object closing found, return empty array to be safe
                return "[]";
            }
        } else {
             const lastClose = cleaned.lastIndexOf('}');
             if (lastClose !== -1) {
                return cleaned.substring(0, lastClose + 1);
             }
        }
    }
    
    return cleaned;
}

function safeJsonParse(text: string, fallback: any) {
    const cleaned = cleanJsonText(text);
    try {
        return JSON.parse(cleaned);
    } catch (e) {
        // Truncate long error logs for readability
        const errorSnippet = text.length > 500 ? text.substring(0, 200) + '... [TRUNCATED]' : text;
        console.error(`JSON Parse Failed. Length: ${text.length}. Snippet: ${errorSnippet}`);
        
        // Attempt aggressive recovery for simple arrays
        if (cleaned.startsWith('[')) {
            // Try closing it if it looks like a valid start
            try { return JSON.parse(cleaned + ']'); } catch (e2) {}
            try { return JSON.parse(cleaned + '}]'); } catch (e3) {}
        }
        
        return fallback;
    }
}

export async function generateStoryIdeas(genre: string): Promise<{id: string, text: string}[]> {
    return callWithApiKeyRotation(async (client) => {
        const response = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Generate 8 creative and unique story ideas for the genre: "${genre}". 
            Return strictly a JSON array of strings.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                }
            }
        });
        const texts: string[] = safeJsonParse(response.text || "[]", []);
        return texts.map((text, i) => ({ id: Date.now() + '-' + i, text }));
    });
}

export async function polishStoryText(text: string): Promise<string> {
    return callWithApiKeyRotation(async (client) => {
        const response = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Polish the following story text to make it more engaging, descriptive, and professional, while keeping the same plot:\n\n${text}`,
        });
        return response.text || text;
    });
}

export async function generateFullStory(storyText: string, genre: string, gender: Gender): Promise<string> {
    return callWithApiKeyRotation(async (client) => {
        const genderContext = gender === 'male' ? 'laki-laki' : gender === 'female' ? 'perempuan' : '';
        const response = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Tulis cerita lengkap yang menarik dan terstruktur dengan baik berdasarkan plot berikut: "${storyText}". Genre: ${genre}. ${genderContext ? `Karakter utama adalah ${genderContext}.` : ''} 
            
            INSTRUKSI KHUSUS (STRUKTUR 8 BABAK):
            Agar cerita memiliki alur yang pas untuk 8 adegan visual, gunakan struktur berikut:
            1. Pendahuluan: Pengenalan karakter dan dunia mereka.
            2. Pemicu: Masalah atau tantangan muncul (Inciting Incident).
            3. Reaksi: Karakter mulai bertindak menghadapi masalah.
            4. Pendalaman: Tantangan meningkat atau perjalanan berlanjut (Rising Action).
            5. Titik Tengah: Sebuah twist, kegagalan, atau penemuan penting.
            6. Krisis: Situasi tampak paling sulit atau gelap.
            7. Klimaks: Puncak konflik atau pertarungan utama.
            8. Resolusi: Penyelesaian masalah dan akhir cerita.

            Tulis dalam bahasa Indonesia yang deskriptif dan menggugah imajinasi, pastikan transisi antar bagian mengalir mulus.`,
        });
        return (response.text || "").trim();
    });
}

export async function generateStoryScenes(fullStory: string, characterDesc: string = ''): Promise<{ imagePrompt: string; narration: string }[]> {
    return callWithApiKeyRotation(async (client) => {
        const response = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Analisis cerita berikut dan bagi menjadi TEPAT 8 adegan kunci.
            
            PENTING - KONSISTENSI KARAKTER & VISUAL (CRITICAL):
            1. Deskripsi Karakter Basis: "${characterDesc || 'A main character'}".
            2. INSTRUCTION: In EVERY output "imagePrompt", you MUST include the full physical description of the character (hair color, clothes, face features).
            3. Example: "A young man with messy red hair wearing a black leather jacket..." (Repeat this in every prompt).
            4. Maintain consistent setting and atmosphere.
            
            Untuk setiap adegan (Total 8), berikan JSON:
            1. "imagePrompt": Prompt bahasa Inggris yang SANGAT DETIL dan KONSISTEN secara visual.
            2. "narration": Teks narasi bahasa Indonesia (2-3 kalimat).
            
            CERITA:\n${fullStory}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            imagePrompt: { type: Type.STRING },
                            narration: { type: Type.STRING }
                        },
                        required: ["imagePrompt", "narration"]
                    }
                }
            }
        });
        const json = safeJsonParse(response.text || "[]", []);
        if (!Array.isArray(json) || json.length === 0) throw new Error("Gagal menghasilkan adegan cerita (Invalid JSON).");
        return json;
    });
}

export async function generateImage(prompt: string, aspectRatio: AspectRatio, referenceImages: string[] = []): Promise<string> {
    return callWithApiKeyRotation(async (client) => {
        const ratio = aspectRatio === '16:9' ? '16:9' : '9:16'; 
        
        // Enhanced Prompt Logic for Strict Consistency
        let consistencyPrompt = "";
        if (referenceImages.length > 0) {
             consistencyPrompt = `
             STRICT REFERENCE ADHERENCE INSTRUCTIONS:
             You have been provided with reference image(s) acting as the Absolute Source of Truth.
             
             1. CHARACTER LOCK (Face & Body):
                - The output image MUST depict the EXACT SAME person as in the reference (Same face shape, eyes, hair, body type).
                - Maintain consistent ethnicity and age.
                - KEEP THE SAME CLOTHES unless explicitly told to change.
             
             2. PRODUCT LOCK (Object Identity):
                - If a product reference is provided, it MUST appear exactly as shown (same packaging, color, logo).
                
             3. CONTEXT AWARE INTERACTION (Crucial):
                - Follow the prompt's verb strictly (WEARING vs HOLDING vs RIDING).
                - Do NOT deviate from the action described in the prompt.
             `;
        }

        const enhancedPrompt = `VISUAL PROMPT: ${prompt}
        
        ${consistencyPrompt}
        
        STYLE: Professional Commercial Photography, 8k resolution, highly detailed, viral social media aesthetic, perfect lighting, sharp focus, depth of field, photorealistic.
        
        NEGATIVE PROMPT: text, writing, letters, words, alphabet, watermark, logo, signature, subtitles, captions, typography, brand name, label, ui, interface, menu, buttons, speech bubble, thought bubble, cartoon, illustration, painting, distorted face, bad hands, extra fingers, blurry, low quality, ugly, distorted text, text overlay, morphing, changing clothes, different face, sign, poster, billboard.`;

        const parts: any[] = [];
        
        // Aggressively resize to 256px max for references to ensure successful request and speed
        if (referenceImages.length > 0) {
             const resizedRefs = await Promise.all(referenceImages.map(img => resizeImageBase64(img, 256)));
             resizedRefs.forEach(base64 => {
                const match = base64.match(/^data:(.+);base64,(.+)$/);
                if (match) {
                    parts.push({
                        inlineData: {
                            mimeType: match[1],
                            data: match[2]
                        }
                    });
                }
            });
        }

        parts.push({ text: enhancedPrompt });

        let attempt = 0;
        const maxAttempts = 5; // Increased attempts to handle 429s better

        while (attempt < maxAttempts) {
            try {
                // Increased timeout wrapper - 90s to allow queue processing
                const timeoutPromise = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error("API Request Timeout")), 90000)
                );

                const response = await Promise.race([
                    client.models.generateContent({
                        model: 'gemini-2.5-flash-image',
                        contents: {
                            parts: parts
                        },
                        config: {
                            imageConfig: {
                                aspectRatio: ratio
                            }
                        }
                    }),
                    timeoutPromise
                ]) as any;

                if (response.candidates && response.candidates[0].content.parts) {
                    for (const part of response.candidates[0].content.parts) {
                        if (part.inlineData) {
                            return `data:image/png;base64,${part.inlineData.data}`;
                        }
                    }
                    // If we reach here, no inlineData was found. Check for text (often a safety refusal).
                    const textPart = response.candidates[0].content.parts.find((p: any) => p.text);
                    if (textPart) {
                         // Check for refusal
                         if (textPart.text.toLowerCase().includes("safety") || textPart.text.toLowerCase().includes("unsafe")) {
                             throw new Error("Gambar ditolak oleh filter keamanan (Safety Filter). Coba ubah prompt.");
                         }
                        throw new Error(`Model Refused: ${textPart.text}`);
                    }
                }
                throw new Error("No image data returned (Empty response)");
            } catch (err: any) {
                const errMsg = getErrorMessage(err);
                console.warn(`Generate image attempt ${attempt + 1} failed:`, errMsg);
                
                // If safety error, do not retry, just throw
                if (errMsg.includes("Safety Filter") || errMsg.includes("unsafe")) {
                    throw new Error(errMsg);
                }

                attempt++;
                
                const isRateLimit = 
                    errMsg.includes('429') || 
                    errMsg.includes('RESOURCE_EXHAUSTED') ||
                    errMsg.includes('quota');
                
                const isRpcError = 
                    errMsg.includes('Rpc failed') || 
                    errMsg.includes('xhr error') ||
                    errMsg.includes('fetch failed') ||
                    errMsg.includes('Timeout') ||
                    errMsg.includes('500');

                if (attempt === maxAttempts) throw new Error(`Gagal setelah ${maxAttempts} percobaan: ${errMsg}`);
                
                // Dynamic backoff: 
                // Rate limit: start at 15s + attempt * 5s 
                const delay = isRateLimit ? 15000 + (attempt * 5000) : isRpcError ? 5000 : 4000;
                console.log(`Waiting ${delay}ms before retry...`);
                await new Promise(r => setTimeout(r, delay));
            }
        }
        throw new Error("Gagal menghasilkan gambar setelah beberapa percobaan.");
    });
}

export async function generateSpeech(text: string, voice: string): Promise<string> {
    return callWithApiKeyRotation(async (client) => {
        const response = await client.models.generateContent({
            model: 'gemini-2.5-flash-preview-tts',
            contents: [{
                parts: [{ text: text }]
            }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: voice }
                    }
                }
            }
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) {
            console.error("Response does not contain audio data.");
            throw new Error("Tidak ada audio yang dihasilkan.");
        }
        return base64Audio;
    });
}

export async function generateLyrics(query: string): Promise<{ lyrics: string, sources: any[] }> {
    return callWithApiKeyRotation(async (client) => {
        // Robust prompt for accurate searching and extraction with WORLDWIDE scope
        const prompt = `
        You are the Ultimate World Music Archivist. Your capabilities extend to EVERY corner of the internet.
        USER REQUEST: "Mengelilingi seluruh sumber yang ada di dunia karena yang aku butuhkan semua lagu dari seluruh dunia" (Cover all sources in the world, need all songs from around the world).
        
        QUERY: "${query}".
        
        MISSION:
        1. **GLOBAL HUNT**: Search Indonesia, Asia (Japan, Korea, China, Thailand), West, Latin, Arab, Africa. No boundaries.
        2. **SOURCE CHECK**: Scan Genius, Musixmatch, KapanLagi, Melon, Uta-Net, Vagalume, Anghami, YouTube Captions, and official artist sites.
        3. **IDENTIFY**: First, verify the correct Artist and Title.
        4. **EXTRACT**: 
           - Get the COMPLETE original lyrics.
           - FOR NON-LATIN SONGS (K-Pop, J-Pop, Thai, etc.): YOU MUST PROVIDE THE ORIGINAL SCRIPT (Hangul/Kanji/Thai) AND Romanization if possible.
           - Ensure structure (Verse, Chorus) is preserved.
        5. **FORMAT**: 
        
        Title: [Song Title]
        Artist: [Artist Name]
        
        [Full Lyrics Body]
        `;

        const response = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }] // Enable Google Search for accuracy
            }
        });
        
        const lyrics = response.text || "Lirik tidak ditemukan. Pastikan judul atau link benar.";
        
        // Extract sources from grounding metadata if available
        const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((c: any) => c.web).filter(Boolean) || [];
        
        return { lyrics, sources };
    });
}

export async function translateLyrics(text: string, targetLanguage: string): Promise<{original: string, translated: string}[]> {
    return callWithApiKeyRotation(async (client) => {
        const response = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Translate the following lyrics to ${targetLanguage}. Return a JSON array of objects with 'original' and 'translated' keys.
            
            LYRICS:
            ${text}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            original: { type: Type.STRING },
                            translated: { type: Type.STRING }
                        }
                    }
                }
            }
        });
        return safeJsonParse(response.text || "[]", []);
    });
}

export async function generateUGCScripts(
    scenario: string, 
    language: string, 
    characterDesc: string = '', 
    productDesc: string = '',
    includeProduct: boolean = false, 
    productImageBase64?: string,
    productCategory: ProductCategory = 'general'
): Promise<any[]> {
    return callWithApiKeyRotation(async (client) => {
        const parts: any[] = [];

        // 1. Multimodal Analysis
        if (includeProduct && productImageBase64) {
             const resizedProduct = await resizeImageBase64(productImageBase64, 256);
             const match = resizedProduct.match(/^data:(.+);base64,(.+)$/);
             if (match) {
                parts.push({
                    inlineData: {
                        mimeType: match[1],
                        data: match[2]
                    }
                });
             }
        }

        // 2. Product Instructions
        let productBehaviorInstruction = "";
        if (includeProduct) {
            switch (productCategory) {
                case 'clothing':
                    productBehaviorInstruction = "ACTION: The character MUST be WEARING the product on their body. Do NOT hold it.";
                    break;
                case 'perfume_skincare':
                    productBehaviorInstruction = "ACTION: The character MUST be HOLDING the bottle in hand or APPLYING it.";
                    break;
                case 'vehicle':
                    productBehaviorInstruction = "ACTION: The character MUST be RIDING or DRIVING the vehicle.";
                    break;
                case 'footwear':
                    productBehaviorInstruction = "ACTION: The character MUST be WEARING the shoes on their feet.";
                    break;
                case 'headwear':
                    productBehaviorInstruction = "ACTION: The character MUST be WEARING the hat/helmet on their head.";
                    break;
                case 'eyewear':
                    productBehaviorInstruction = "ACTION: The character MUST be WEARING the glasses on their face.";
                    break;
                case 'toy_gadget':
                    productBehaviorInstruction = "ACTION: The character MUST be PLAYING WITH or HOLDING the gadget.";
                    break;
                case 'general':
                default:
                    productBehaviorInstruction = "ACTION: The character should be HOLDING or USING the product.";
                    break;
            }
        }

        const productInstruction = includeProduct 
            ? `STRICT PROFESSIONAL AFFILIATE MARKETING MODE:
               - CATEGORY LOCK: **${productCategory.toUpperCase()}**.
               - ${productBehaviorInstruction}
               - PRODUCT DETAIL INSTRUCTIONS: ${productDesc || 'Match the appearance of the product image provided.'}
               - Ensure product appearance matches reference exactly.
               - Scenes: Hook -> Problem -> Solution -> Social Proof -> CTA (Visual Only, NO TEXT).`
            : 'Focus on a cohesive personal lifestyle vlog.';

        const promptText = `Create a 7-scene video script sequence (vertical 9:16) based on: "${scenario}".
            Target Language: ${language}.

            ${productInstruction}
            
            VISUAL CONSISTENCY RULES:
               - CHARACTER BASE: "${characterDesc || 'The main subject'}".
               - INSTRUCTION: In EVERY 'visual_prompt', REPEAT the character's physical description.
               - STRICTLY NO TEXT DESCRIPTIONS: The 'visual_prompt' MUST NOT contain words like "text", "words", "caption", "sign", "overlay", "title", "logo".
               - FOR SCENE 7 (CTA): Describe a physical action (e.g., character pointing, waving, smiling, thumbs up) WITHOUT any background text or floating words.
               - IMPORTANT: Keep visual prompts concise (under 50 words) to prevent token overflow, but descriptive enough for generation.

            CRITICAL OUTPUT RULES:
            1. Output strictly a JSON ARRAY of 7 objects.
            2. "visual_prompt": Detailed but efficient English prompt for Image Gen AI (PURE VISUALS ONLY).
            3. "spoken_script": Natural, viral-style voiceover in ${language}.
            4. "background_sound": Audio mood/sfx suggestion.
            
            JSON Schema:
            [
              { "scene_number": 1, "visual_prompt": "...", "spoken_script": "...", "background_sound": "..." }
            ]`;

        parts.push({ text: promptText });

        const response = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: parts },
            config: {
                responseMimeType: "application/json",
                // We don't explicitly set maxOutputTokens to avoid cutting it off unnecessarily, 
                // but rely on the model's default which is usually generous for Flash.
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            scene_number: { type: Type.INTEGER },
                            visual_prompt: { type: Type.STRING },
                            spoken_script: { type: Type.STRING },
                            background_sound: { type: Type.STRING }
                        }
                    }
                }
            }
        });
        const json = safeJsonParse(response.text || "[]", []);
        if (!Array.isArray(json) || json.length === 0) {
             console.warn("UGC Script generation returned empty or invalid JSON");
        }
        return json;
    });
}

// VIDEO GENERATION (VEO)
export async function generateVeoVideo(prompt: string, imageBase64: string | null, aspectRatio: AspectRatio = '16:9'): Promise<string> {
    return callWithApiKeyRotation(async (client, key) => {
        // Use the 'generate-preview' model for better quality as requested ("veo3.1 terbaru")
        // NOTE: Veo requires a paid tier project. 
        const request: any = {
            model: 'veo-3.1-generate-preview', 
            prompt: prompt,
            config: {
                 numberOfVideos: 1,
                 resolution: '720p',
                 aspectRatio: aspectRatio 
            }
        };

        if (imageBase64) {
             // Extract base64 data and mime type
             const match = imageBase64.match(/^data:(.+);base64,(.+)$/);
             if (match) {
                 request.image = {
                     mimeType: match[1],
                     imageBytes: match[2]
                 };
             }
        }

        let operation = await client.models.generateVideos(request);

        // Polling loop
        while (!operation.done) {
             await new Promise(r => setTimeout(r, 5000)); // Poll every 5 seconds
             operation = await client.operations.getVideosOperation({ operation: operation });
        }

        const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!videoUri) throw new Error("No video URI returned from Veo.");

        // Fetch the actual video blob using the same key
        const vidResponse = await fetch(`${videoUri}&key=${key}`);
        if (!vidResponse.ok) throw new Error("Failed to download video file.");
        
        const blob = await vidResponse.blob();
        return URL.createObjectURL(blob);
    });
}