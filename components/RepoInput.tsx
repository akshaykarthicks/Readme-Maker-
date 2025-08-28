
import React from 'react';
import { SparklesIcon } from './icons';

interface RepoInputProps {
    repoUrl: string;
    setRepoUrl: (url: string) => void;
    onGenerate: () => void;
    isLoading: boolean;
}

export const RepoInput: React.FC<RepoInputProps> = ({ repoUrl, setRepoUrl, onGenerate, isLoading }) => {
    
    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter' && !isLoading) {
            onGenerate();
        }
    };

    return (
        <div className="relative">
            <input
                type="text"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g., https://github.com/facebook/react"
                className="w-full pl-4 pr-40 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all duration-300"
                disabled={isLoading}
            />
            <button
                onClick={onGenerate}
                disabled={isLoading}
                className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center px-4 py-2 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold rounded-md transition-all duration-300 transform active:scale-95 disabled:scale-100"
            >
                {isLoading ? (
                    <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Generating...
                    </>
                ) : (
                    <>
                        <SparklesIcon className="w-5 h-5 mr-2" />
                        Generate
                    </>
                )}
            </button>
        </div>
    );
};
