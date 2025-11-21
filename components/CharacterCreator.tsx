import React, { useState } from 'react';
import { CharacterImageData, Gender } from '../types';
import { ImageUploader } from './common/ImageUploader';
import { TabButton } from './common/TabButton';
import { ToggleButton } from './common/ToggleButton';

interface CharacterCreatorProps {
    characterImage: CharacterImageData | null;
    onCharacterImageChange: (imageData: CharacterImageData | null) => void;
    characterText: string;
    onCharacterTextChange: (text: string) => void;
    gender: Gender;
    onGenderChange: (gender: Gender) => void;
}

type Method = 'upload' | 'describe';

export const CharacterCreator: React.FC<CharacterCreatorProps> = ({ 
    characterImage, 
    onCharacterImageChange,
    characterText,
    onCharacterTextChange,
    gender,
    onGenderChange
}) => {
    const [method, setMethod] = useState<Method>(characterImage ? 'upload' : 'describe');

    const handleMethodChange = (newMethod: Method) => {
        setMethod(newMethod);
        // Hapus data yang tidak relevan saat beralih metode untuk menghindari kebingungan
        if (newMethod === 'upload') {
            onCharacterTextChange('');
        } else {
            onCharacterImageChange(null);
        }
    };
    
    return (
        <div>
            <div className="flex border-b border-slate-300 dark:border-slate-600 mb-4">
                <TabButton name="Deskripsikan" active={method === 'describe'} onClick={() => handleMethodChange('describe')} variant="sub" />
                <TabButton name="Unggah Gambar" active={method === 'upload'} onClick={() => handleMethodChange('upload')} variant="sub" />
            </div>
            
            <div className="mb-4">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Pilih Jenis Kelamin Karakter</p>
                <div className="flex flex-wrap gap-2">
                    <ToggleButton name="Tidak Ditentukan" active={gender === 'unspecified'} onClick={() => onGenderChange('unspecified')} shape="box"/>
                    <ToggleButton name="Laki-laki" active={gender === 'male'} onClick={() => onGenderChange('male')} shape="box" />
                    <ToggleButton name="Perempuan" active={gender === 'female'} onClick={() => onGenderChange('female')} shape="box" />
                </div>
            </div>

            {method === 'describe' && (
                <div className="animate-fade-in">
                    <input
                        type="text"
                        value={characterText}
                        onChange={e => onCharacterTextChange(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-lg p-3 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 placeholder-slate-400 dark:placeholder-slate-500 transition-colors duration-300"
                        placeholder="Contoh: seorang gadis dengan rambut merah kepang & mata hijau..."
                    />
                </div>
            )}

            {method === 'upload' && (
                <div className="animate-fade-in">
                    <ImageUploader
                        image={characterImage}
                        onImageChange={onCharacterImageChange}
                        label=""
                        heightClass="h-32"
                    />
                </div>
            )}
        </div>
    );
};