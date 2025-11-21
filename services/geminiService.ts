
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Gender, AspectRatio } from '../types';

let apiKeys: string[] = [];

export function setApiKeys(keys: string[]) {
    apiKeys = keys;
}

async function callWithApiKeyRotation<T>(operation: (client: GoogleGenAI, key: string) => Promise<T>): Promise<T> {
    const keysToTry = apiKeys.length > 0 ? apiKeys : [process.env.API_KEY || ''];
    let lastError: any;
    
    for (const key of keysToTry) {
        if (!key) continue;
        try {
            const client = new GoogleGenAI({ apiKey: key });
            return await operation(client, key);
        } catch (error) {
            console.warn("API Call failed with key", key.substring(0, 5) + "...", error);
            lastError = error;
        }
    }
    throw lastError || new Error("All API keys failed or none provided.");
}

function cleanJsonText(text: string): string {
    return text.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
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
        const texts: string[] = JSON.parse(cleanJsonText(response.text || "[]"));
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
            
            PENTING - KONSISTENSI KARAKTER & VISUAL:
            1. Gunakan deskripsi karakter ini secara KONSISTEN di setiap awal "imagePrompt": "${characterDesc || 'A main character'}".
            2. Pastikan detail visual seperti warna baju, gaya rambut, dan fitur wajah TETAP SAMA di semua adegan.
            3. Gunakan kata kunci komposisi yang variatif namun tetap sinematik: "Cinematic shot", "Detailed environment", "Action shot", "Wide angle".
            
            Untuk setiap adegan (Total 8), berikan JSON:
            1. "imagePrompt": Prompt bahasa Inggris yang SANGAT DETIL.
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
        const json = JSON.parse(cleanJsonText(response.text || "[]"));
        if (!Array.isArray(json)) throw new Error("Respons AI tidak valid untuk adegan cerita.");
        return json;
    });
}

export async function generateImage(prompt: string, aspectRatio: AspectRatio): Promise<string> {
    return callWithApiKeyRotation(async (client) => {
        const ratio = aspectRatio === '16:9' ? '16:9' : '9:16'; 
        
        // Structured prompt for better instruction following
        const enhancedPrompt = `Create a high-quality image based on this description: ${prompt}
        
        Requirements: Cinematic lighting, photorealistic, 8k resolution, highly detailed, masterpiece.
        Composition: Full body shot or appropriate angle for action, detailed textures, perfect anatomy, symmetrical face.`;

        let attempt = 0;
        const maxAttempts = 5; 

        while (attempt < maxAttempts) {
            try {
                const response = await client.models.generateContent({
                    model: 'gemini-2.5-flash-image',
                    contents: {
                        parts: [{ text: enhancedPrompt }]
                    },
                    config: {
                        imageConfig: {
                            aspectRatio: ratio
                        }
                    }
                });

                if (response.candidates && response.candidates[0].content.parts) {
                    for (const part of response.candidates[0].content.parts) {
                        if (part.inlineData) {
                            return `data:image/png;base64,${part.inlineData.data}`;
                        }
                    }
                }
                throw new Error("No image data returned");
            } catch (err: any) {
                console.warn(`Generate image attempt ${attempt + 1} failed:`, err);
                attempt++;
                if (attempt === maxAttempts) throw err;
                
                // Smart handling for Rate Limits (429)
                const isRateLimit = 
                    err.message?.includes('429') || 
                    err.status === 429 || 
                    err.message?.includes('RESOURCE_EXHAUSTED') ||
                    err.error?.code === 429;
                
                // If rate limited, wait significantly longer (starting at 60s)
                const delay = isRateLimit ? 60000 + (attempt * 5000) : 5000 * Math.pow(2, attempt);
                
                console.log(`Retrying in ${delay}ms...`);
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
            console.error("Response does not contain audio data. It might have been blocked by safety filters.");
            throw new Error("Tidak ada audio yang dihasilkan.");
        }
        return base64Audio;
    });
}

export async function generateLyrics(query: string): Promise<{ lyrics: string, sources: any[] }> {
    return callWithApiKeyRotation(async (client) => {
        const response = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Find the lyrics for: "${query}". If it's a URL, find the song lyrics. Return the full lyrics.`,
            config: {
                tools: [{ googleSearch: {} }]
            }
        });
        
        const lyrics = response.text || "Lirik tidak ditemukan.";
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
        return JSON.parse(cleanJsonText(response.text || "[]"));
    });
}

export async function generateUGCScripts(scenario: string, language: string, characterDesc: string = ''): Promise<{visual_prompt: string, spoken_script: string}[]> {
    return callWithApiKeyRotation(async (client) => {
        const response = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Create a 7-scene UGC video script based on: "${scenario}" in language ${language}.
            Return a JSON ARRAY of objects with keys "visual_prompt" and "spoken_script".
            
            CRITICAL INSTRUCTION FOR VISUAL_PROMPT:
            The visual_prompt must explicitly describe the following character in every scene to ensure consistency: "${characterDesc}".
            Ensure the "visual_prompt" describes a FULL BODY shot of this character in a consistent outfit from head to toe. 
            Use keywords: "Full body shot", "Wide angle", "Showing shoes and full outfit", "High detail 8k".`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            visual_prompt: { type: Type.STRING },
                            spoken_script: { type: Type.STRING }
                        }
                    }
                }
            }
        });
        return JSON.parse(cleanJsonText(response.text || "[]"));
    });
}

export async function generateVeoVideo(prompt: string, model: string, aspectRatio: string, resolution: string, imageBase64?: string): Promise<string> {
    return callWithApiKeyRotation(async (client, key) => {
        // Construct params
        const params: any = {
            model: model,
            prompt: prompt,
            config: {
                numberOfVideos: 1,
                resolution: resolution,
                aspectRatio: aspectRatio
            }
        };

        if (imageBase64) {
            // For image-to-video, we need to pass image
            params.image = {
                imageBytes: imageBase64.split(',')[1], // Remove data:image... prefix if present
                mimeType: 'image/png' // Assuming PNG or handled generally
            };
        }

        let operation = await client.models.generateVideos(params);
        
        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 5000));
            operation = await client.operations.getVideosOperation({operation: operation});
        }
        
        const uri = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!uri) throw new Error("Video generation failed.");
        
        // Return URI with key for direct fetch/playback if needed
        return `${uri}&key=${key}`;
    });
}
