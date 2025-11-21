import React, { useCallback } from 'react';
import { CharacterImageData } from '../../types';
import { ImageIcon, XIcon } from '../Icons';

interface ImageUploaderProps {
    image: CharacterImageData | null;
    onImageChange: (image: CharacterImageData | null) => void;
    label: string;
    heightClass?: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ image, onImageChange, label, heightClass = 'h-24' }) => {

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                onImageChange({
                    base64: e.target?.result as string,
                    mimeType: file.type,
                    name: file.name
                });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDrop = useCallback((event: React.DragEvent<HTMLLabelElement>) => {
        event.preventDefault();
        event.stopPropagation();
        const file = event.dataTransfer.files?.[0];
        if (file) {
             const reader = new FileReader();
            reader.onload = (e) => {
                onImageChange({
                    base64: e.target?.result as string,
                    mimeType: file.type,
                    name: file.name,
                });
            };
            reader.readAsDataURL(file);
        }
    }, [onImageChange]);

    const handleDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
        event.preventDefault();
        event.stopPropagation();
    };

    return (
        <div>
            {label && <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">{label}</p>}
            {image ? (
                <div className="relative w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700/50 flex items-center transition-colors duration-300">
                    <img src={image.base64} alt="Pratinjau yang diunggah" className="h-12 w-12 object-cover rounded-md" />
                    <p className="ml-4 text-sm text-slate-600 dark:text-slate-300 truncate">{image.name}</p>
                    <button
                        onClick={() => onImageChange(null)}
                        className="ml-auto p-1.5 rounded-full hover:bg-red-100 text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 dark:hover:bg-red-900/50"
                        aria-label="Hapus gambar"
                    >
                        <XIcon className="h-4 w-4"/>
                    </button>
                </div>
            ) : (
                <label 
                    className={`flex justify-center w-full ${heightClass} px-4 transition bg-slate-50 dark:bg-slate-700/50 border-2 border-slate-300 dark:border-slate-600 border-dashed rounded-md appearance-none cursor-pointer hover:border-cyan-400 focus:outline-none`}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                >
                    <span className="flex items-center space-x-2">
                        <ImageIcon className="h-8 w-8 text-slate-400 dark:text-slate-500"/>
                        <span className="font-medium text-slate-500 dark:text-slate-400 text-sm">
                            Letakkan file di sini, atau{' '}
                            <span className="text-cyan-600 dark:text-cyan-400 underline">telusuri</span>
                        </span>
                    </span>
                    <input
                        type="file"
                        name="file_upload"
                        className="hidden"
                        accept="image/png, image/jpeg"
                        onChange={handleFileChange}
                    />
                </label>
            )}
        </div>
    );
};
