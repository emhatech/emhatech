
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Gender, AspectRatio, ProductCategory, LyricLine } from '../types';

let apiKeys: string[] = [];

export function setApiKeys(keys: string[]) {
    apiKeys = keys;
}

// Helper to extract error message robustly
function getErrorMessage(error: any): string {
    if (!error) return "Unknown Error";
    if (typeof error === 'string') return error;
    if (error instanceof Error) return error.message;
    
    if (error.error) {
        const code = error.error.code ? `[${error.error.code}] ` : '';
        const status = error.error.status ? `[${error.error.status}] ` : '';
        const msg = error.error.message || JSON.stringify(error.error);
        return `${code}${status}${msg}`;
    }

    if (error.code && error.message && error.status) {
        return `[${error.code}] [${error.status}] ${error.message}`;
    }

    if (error.message) return error.message;
    
    try {
        return JSON.stringify(error);
    } catch {
        return "Unknown Error";
    }
}

// Helper to resize image
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
                resolve(canvas.toDataURL('image/jpeg', 0.5));
            } else {
                resolve(base64Str);
            }
        };
        img.onerror = () => resolve(base64Str);
        img.src = base64Str;
    });
}

// Helper for simple retry without rotation (used for fixed-key operations like Veo)
async function retryOperation<T>(fn: () => Promise<T>, retries = 3, operationName = "Operation"): Promise<T> {
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (error: any) {
            const msg = getErrorMessage(error);
            const isTransient = msg.includes("Rpc failed") || 
                                msg.includes("xhr error") || 
                                msg.includes("fetch failed") || 
                                msg.includes("503") ||
                                msg.includes("error code: 6");

            if (isTransient) {
                console.warn(`${operationName} failed (Attempt ${i + 1}/${retries}): ${msg}. Retrying...`);
                if (i === retries - 1) throw error;
                await new Promise(r => setTimeout(r, 2000 * (i + 1))); // Exponential backoff
            } else {
                throw error; // Non-retriable error
            }
        }
    }
    throw new Error(`${operationName} failed after ${retries} retries`);
}

async function callWithApiKeyRotation<T>(operation: (client: GoogleGenAI, key: string) => Promise<T>): Promise<T> {
    const keysToTry = apiKeys.length > 0 ? apiKeys : [process.env.API_KEY || ''];
    let lastError: any;
    
    for (const key of keysToTry) {
        if (!key) continue;
        
        // Retry logic loop for the CURRENT key
        const maxRetriesPerKey = 3;
        for (let attempt = 0; attempt < maxRetriesPerKey; attempt++) {
            try {
                const client = new GoogleGenAI({ apiKey: key });
                return await operation(client, key);
            } catch (error: any) {
                const errorMessage = getErrorMessage(error);
                
                const isTransient = errorMessage.includes("Rpc failed") || 
                                   errorMessage.includes("xhr error") || 
                                   errorMessage.includes("fetch failed") ||
                                   errorMessage.includes("500") ||
                                   errorMessage.includes("503") ||
                                   errorMessage.includes("error code: 6");

                if (isTransient) {
                     console.warn(`Transient error on key ${key.substring(0,5)}... (Attempt ${attempt + 1}): ${errorMessage}. Retrying...`);
                     if (attempt < maxRetriesPerKey - 1) {
                         await new Promise(resolve => setTimeout(resolve, 2000 * (attempt + 1)));
                         continue; // Retry same key
                     }
                } else {
                     // If it's not transient (e.g. 400 Bad Request, Quota Exceeded for this key), break inner loop to try next key
                     console.warn("API Call failed with key", key.substring(0, 5) + "...", errorMessage);
                     lastError = error;
                     break; 
                }
                lastError = error;
            }
        }
    }
    
    const finalErrorMessage = getErrorMessage(lastError);
    if (finalErrorMessage.includes("API key not valid") || keysToTry.every(k => !k)) {
        throw new Error("API Key hilang atau tidak valid. Silakan atur di tombol 'Gerigi' di pojok kanan atas.");
    }
    throw new Error(finalErrorMessage || "All API keys failed or none provided.");
}

function cleanJsonText(text: string): string {
    if (!text) return "[]";
    let cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    
    const firstOpen = cleaned.search(/\[|\{/);
    if (firstOpen !== -1) {
        cleaned = cleaned.substring(firstOpen);
        const isArray = cleaned.startsWith('[');
        if (isArray) {
            const lastObjClose = cleaned.lastIndexOf('}');
            if (lastObjClose !== -1) {
                let candidate = cleaned.substring(0, lastObjClose + 1);
                if (!candidate.endsWith(']')) {
                    candidate += ']';
                }
                return candidate;
            } else {
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
        const errorSnippet = text.length > 500 ? text.substring(0, 200) + '... [TRUNCATED]' : text;
        console.error(`JSON Parse Failed. Length: ${text.length}. Snippet: ${errorSnippet}`);
        if (cleaned.startsWith('[')) {
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

export async function generateFullStory(storyText: string, genre: string, gender: Gender, sceneCount: number = 10): Promise<string> {
    return callWithApiKeyRotation(async (client) => {
        const genderContext = gender === 'male' ? 'laki-laki' : gender === 'female' ? 'perempuan' : '';
        
        // Define structure based on requested scene count
        let structure = "";
        if (sceneCount === 5) {
             structure = `
            STRUKTUR 5 BABAK (Short Story):
            1. Pengenalan (Intro)
            2. Insiden Pemicu (Inciting Incident)
            3. Konflik Meningkat (Rising Action)
            4. Klimaks (Climax)
            5. Resolusi (Resolution)`;
        } else if (sceneCount === 15) {
            structure = `
            STRUKTUR 15 BABAK (Extended Epic):
            1. Dunia Biasa
            2. Panggilan Petualangan
            3. Penolakan
            4. Pertemuan Mentor
            5. Menyeberangi Batas
            6. Sekutu & Musuh
            7. Pendekatan Gua Terdalam
            8. Cobaan Berat (Ordeal)
            9. Hadiah (Reward)
            10. Jalan Pulang
            11. Kebangkitan (Resurrection)
            12. Klimaks Puncak
            13. Akibat Klimaks
            14. Resolusi Akhir
            15. Elixir / Pesan Moral`;
        } else {
            // Default 10
            structure = `
            STRUKTUR 10 BABAK (Standard):
            1. Pendahuluan
            2. Kehidupan Normal
            3. Pemicu Masalah
            4. Keraguan & Panggilan
            5. Memulai Perjalanan
            6. Tantangan & Sekutu
            7. Titik Tengah
            8. Krisis Berat
            9. Klimaks Epik
            10. Resolusi`;
        }

        const response = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Tulis cerita lengkap yang menarik dan terstruktur dengan baik berdasarkan plot berikut: "${storyText}". Genre: ${genre}. ${genderContext ? `Karakter utama adalah ${genderContext}.` : ''} 
            
            INSTRUKSI KHUSUS:
            Agar cerita memiliki alur yang pas untuk ${sceneCount} adegan visual, gunakan struktur berikut:
            ${structure}

            Tulis dalam bahasa Indonesia yang deskriptif dan emosional. Pastikan setiap babak jelas perbedaannya.`,
        });
        return (response.text || "").trim();
    });
}

export async function generateStoryScenes(fullStory: string, characterDesc: string = '', sceneCount: number = 10): Promise<{ imagePrompt: string; narration: string }[]> {
    return callWithApiKeyRotation(async (client) => {
        const response = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Analisis cerita berikut dan bagi menjadi TEPAT ${sceneCount} adegan kunci berurutan.
            
            PENTING - OPTIMASI UNTUK VIDEO GENERATOR (VEO 3):
            1. Deskripsi Karakter Basis: "${characterDesc || 'A main character'}".
            2. INSTRUCTION: In EVERY output "imagePrompt", you MUST create a CINEMATIC VIDEO PROMPT optimized for Google Veo 3, but write it in **BAHASA INDONESIA** (Indonesian Language).
               - Include CAMERA MOVEMENT instructions (keep these technical terms in English like "Slow dolly in", "Drone shot", "Pan right", "Tracking shot").
               - Describe ACTION and MOVEMENT of the character/environment vividly in INDONESIAN (e.g. "sedang berjalan percaya diri", "hujan turun deras", "rambut tertiup angin").
               - Style: 8k, Photorealistic, Cinematic Lighting, 35mm film grain.
            
            Untuk setiap adegan (Total ${sceneCount}), berikan JSON:
            1. "imagePrompt": Prompt VIDEO dalam BAHASA INDONESIA yang SANGAT DETIL (Veo 3 Optimized). Gunakan istilah teknis kamera dalam Inggris jika perlu.
            2. "narration": Teks Voice Over bahasa Indonesia (Jelas, Emosional, cocok untuk dibacakan).
            
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
        return json.slice(0, sceneCount); // Ensure exact count
    });
}

export async function generateImage(prompt: string, aspectRatio: AspectRatio, referenceImages: string[] = []): Promise<string> {
    return callWithApiKeyRotation(async (client) => {
        const ratio = aspectRatio === '16:9' ? '16:9' : '9:16'; 
        
        let consistencyPrompt = "";
        if (referenceImages.length > 0) {
             consistencyPrompt = `
             STRICT REFERENCE ADHERENCE:
             - The output image MUST depict the EXACT SAME person/product as in the reference.
             - Maintain consistent face, body, clothes, colors.
             `;
        }

        const enhancedPrompt = `VISUAL PROMPT: ${prompt}
        ${consistencyPrompt}
        STYLE: Professional Commercial Photography, 8k resolution, highly detailed, perfect lighting, cinematic composition.`;

        const parts: any[] = [];
        
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

        const response = await client.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: parts },
            config: { imageConfig: { aspectRatio: ratio } }
        });

        if (response.candidates && response.candidates[0].content.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                    return `data:image/png;base64,${part.inlineData.data}`;
                }
            }
            const textPart = response.candidates[0].content.parts.find((p: any) => p.text);
            if (textPart) {
                 if (textPart.text.toLowerCase().includes("safety") || textPart.text.toLowerCase().includes("unsafe")) {
                     throw new Error("Gambar ditolak oleh filter keamanan (Safety Filter). Coba ubah prompt.");
                 }
                throw new Error(`Model Refused: ${textPart.text}`);
            }
        }
        throw new Error("No image data returned");
    });
}

export async function generateSpeech(text: string, voice: string): Promise<string> {
    return callWithApiKeyRotation(async (client) => {
        const response = await client.models.generateContent({
            model: 'gemini-2.5-flash-preview-tts',
            contents: {
                parts: [{ text: text }]
            },
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: voice }
                    }
                }
            }
        });
        
        const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!audioData) throw new Error("Gagal menghasilkan audio (No data).");
        return audioData;
    });
}

export async function generateUGCScripts(
    prompt: string, 
    language: string, 
    characterDesc: string, 
    productDesc: string, 
    includeProduct: boolean,
    productImage: string | undefined,
    productCategory: ProductCategory,
    shotType: string
): Promise<any[]> {
    return callWithApiKeyRotation(async (client) => {
        let shotInstruction = shotType;
        if (shotType === 'hand_focus') {
             shotInstruction = "EXTREME CLOSE-UP on HANDS ONLY holding/using/touching the product. Do NOT show faces. Focus on skin texture, grip, and the product details. POV style is acceptable.";
        }

        const baseContext = `You are a professional UGC Video Director. 
        Create exactly 6 distinct scenes for a viral short video.
        
        CONTEXT:
        - Character: ${characterDesc || 'A person'}
        - Product: ${includeProduct ? productDesc : 'None'}
        - Product Category: ${productCategory}
        - Shot Type Preference: ${shotInstruction}
        - Overall Theme: ${prompt}

        CRITICAL REQUIREMENTS (8 SECONDS RULE):
        1. DURATION: Each scene must be designed to last exactly 8 SECONDS.
        2. SCRIPT: The Voice Over must be in INDONESIAN (Bahasa Indonesia) and concise (secukupnya) but meaningful. Target approx 15-20 words per scene to fit the 8-second timing comfortably.
        3. VISUALS: Describe a cinematic action that takes time (e.g., "Slow pan", "Walking towards camera", "Rotating product").
        ${shotType === 'hand_focus' ? "4. VISUAL CONSTRAINT: FOCUS ON HANDS. Do not generate scenes with full body or faces." : ""}

        Return a JSON ARRAY of 6 objects. Each object must have:
        1. "visual_prompt": A highly detailed English prompt for video generation (Veo/Runway).
           - Explicitly mention "8 seconds duration" or "slow motion" style.
           - Enforce Shot Type: ${shotInstruction}.
        2. "spoken_script": Indonesian Voice Over text (approx 2 sentences, ~8 seconds spoken duration).
        `;

        const response = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: baseContext,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            visual_prompt: { type: Type.STRING },
                            spoken_script: { type: Type.STRING }
                        },
                        required: ["visual_prompt", "spoken_script"]
                    }
                }
            }
        });

        const json = safeJsonParse(response.text || "[]", []);
        if (!Array.isArray(json) || json.length < 1) throw new Error("Failed to generate scripts");
        return json.slice(0, 6);
    });
}

export async function generateLyrics(urlOrTitle: string): Promise<{lyrics: string, sources: any[]}> {
     return callWithApiKeyRotation(async (client) => {
        const response = await client.models.generateContent({
           model: "gemini-2.5-flash",
           contents: `Find the exact lyrics for this song: "${urlOrTitle}".
           If it's a YouTube URL, identify the song first.
           
           Return the lyrics formatted with structure tags like [Verse 1], [Chorus], [Bridge].
           Do NOT include chords.
           Do NOT include translation yet.
           Just the original lyrics in their original language.`,
           config: {
             tools: [{googleSearch: {}}],
           },
        });

        const lyrics = response.text || "Lyrics not found.";
        const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((c: any) => ({
            title: c.web?.title || 'Source',
            uri: c.web?.uri || '#'
        })) || [];

        return { lyrics, sources };
     });
}

export async function translateLyrics(lyrics: string, targetLanguage: string): Promise<LyricLine[]> {
    return callWithApiKeyRotation(async (client) => {
        const response = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Translate the following song lyrics to ${targetLanguage}.
            Maintain the line-by-line structure exactly.
            
            INPUT LYRICS:
            ${lyrics}
            
            OUTPUT FORMAT:
            Return a JSON ARRAY of objects:
            [
              { "original": "Original line 1", "translated": "Translated line 1" },
              { "original": "[Chorus]", "translated": "[Reff]" },
              ...
            ]
            `,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            original: { type: Type.STRING },
                            translated: { type: Type.STRING }
                        },
                        required: ["original", "translated"]
                    }
                }
            }
        });
        
        return safeJsonParse(response.text || "[]", []);
    });
}

export async function optimizeVideoPrompt(simpleIdea: string): Promise<string> {
    return callWithApiKeyRotation(async (client) => {
        const response = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `You are a professional AI Prompt Engineer for Grok / Flux.
            Convert this simple idea into a highly detailed, photorealistic image or video prompt suitable for Grok's vision capabilities.

            Input Idea: "${simpleIdea}"

            Requirements:
            - Focus on texture, lighting (e.g. volumetric, golden hour), and realistic details (8k, raw photo).
            - Mention specific camera lenses or styles if relevant (e.g. 35mm, f/1.8).
            - Describe the scene vividly.
            - Keep it under 100 words.
            - Output ONLY the prompt text in English.`,
        });
        return response.text || "";
    });
}

// VIDEO GENERATOR (Veo) - IMAGE TO VIDEO
export async function generateVeoImageToVideo(imageBase64: string, prompt: string, apiKey: string): Promise<string> {
    const client = new GoogleGenAI({ apiKey });
    
    // Clean base64 string
    const cleanBase64 = imageBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
    const mimeTypeMatch = imageBase64.match(/^data:(image\/\w+);base64,/);
    const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/jpeg';

    // Retry wrapper for initial call
    let operation = await retryOperation(() => client.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt || "Animate this image naturally",
        image: {
            imageBytes: cleanBase64,
            mimeType: mimeType
        },
        config: {
             // Default config
        }
    }), 3, "Veo Video Initiation");

    // Polling loop with retry wrapper
    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 5000)); // Poll every 5s
        
        operation = await retryOperation(() => 
            client.operations.getVideosOperation({ operation: operation }), 
            3, 
            "Veo Polling"
        );
        
        // Check for internal operation errors
        if (operation.error) {
             throw new Error(`Video Generation Error: ${operation.error.message || JSON.stringify(operation.error)}`);
        }
    }

    const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!videoUri) throw new Error("Video generation completed but no URI returned.");
    
    // Append API Key to fetch result
    return `${videoUri}&key=${apiKey}`;
}
