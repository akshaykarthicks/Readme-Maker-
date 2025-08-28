
import React from 'react';
import { GithubIcon } from './icons';

export const Header: React.FC = () => {
    return (
        <header className="bg-slate-900/60 backdrop-blur-sm border-b border-slate-700/50 sticky top-0 z-10">
            <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                <div className="flex items-center space-x-3">
                     <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                        <GithubIcon className="w-6 h-6 text-slate-300" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
                        AI README Generator
                    </h1>
                </div>
            </div>
        </header>
    );
};
