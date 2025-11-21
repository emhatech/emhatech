import React from 'react';
import { Spinner } from './Spinner';

interface ImageLoadingSkeletonProps {
    aspectRatio?: 'video' | 'portrait';
}

export const ImageLoadingSkeleton: React.FC<ImageLoadingSkeletonProps> = ({ aspectRatio = 'video' }) => {
    const aspectClass = aspectRatio === 'video' ? 'aspect-video' : 'aspect-[9/16]';
    return (
        <div className={`relative w-full ${aspectClass} bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse flex items-center justify-center transition-colors duration-300`}>
            <Spinner className="h-6 w-6 text-cyan-500" />
        </div>
    );
};
