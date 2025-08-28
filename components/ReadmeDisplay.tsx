import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { LoadingSpinner } from './LoadingSpinner';
import { CopyIcon, CheckIcon, DocumentIcon } from './icons';


interface ReadmeDisplayProps {
    readmeContent: string;
    isLoading: boolean;
    error: string | null;
}

type ActiveTab = 'editor' | 'preview';

export const ReadmeDisplay: React.FC<ReadmeDisplayProps> = ({ readmeContent, isLoading, error }) => {
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<ActiveTab>('editor');
    const [editableContent, setEditableContent] = useState<string>('');

    useEffect(() => {
        setEditableContent(readmeContent);
        // When new content arrives from the API, switch back to the editor view
        if (readmeContent) {
            setActiveTab('editor');
        }
    }, [readmeContent]);

    useEffect(() => {
        if (copied) {
            const timer = setTimeout(() => setCopied(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [copied]);

    const handleCopy = () => {
        if(editableContent){
            navigator.clipboard.writeText(editableContent);
            setCopied(true);
        }
    };

    const renderContent = () => {
        if (isLoading) {
            return <div className="p-6 sm:p-8"><LoadingSpinner /></div>;
        }
        if (error) {
            return null; // Error is displayed in App.tsx
        }
        if (readmeContent) {
            return (
                <>
                    <div className="px-6 sm:px-8 pt-6 sm:pt-8 flex items-end justify-between">
                        <div className="flex border-b border-slate-700">
                            <TabButton
                                label="Editor"
                                isActive={activeTab === 'editor'}
                                onClick={() => setActiveTab('editor')}
                            />
                            <TabButton
                                label="Preview"
                                // FIX: Corrected a typo from `active-tab` to `activeTab` to properly reference the component's state variable.
                                isActive={activeTab === 'preview'}
                                onClick={() => setActiveTab('preview')}
                             />
                        </div>
                         <button
                            onClick={handleCopy}
                            className="flex items-center px-3 py-1.5 bg-slate-700/50 hover:bg-slate-600/50 rounded-md text-sm text-slate-300 transition-colors mb-[-1px]"
                            >
                            {copied ? (
                                <>
                                    <CheckIcon className="w-4 h-4 mr-1.5 text-green-400" />
                                    Copied!
                                </>
                            ) : (
                                <>
                                    <CopyIcon className="w-4 h-4 mr-1.5" />
                                    Copy Markdown
                                </>
                            )}
                        </button>
                    </div>
                    <div className="p-6 sm:p-8">
                        {activeTab === 'editor' ? (
                             <textarea
                                value={editableContent}
                                onChange={(e) => setEditableContent(e.target.value)}
                                className="w-full bg-slate-900 text-slate-300 font-mono resize-y min-h-[50vh] p-4 border border-slate-600 rounded-md focus:ring-2 focus:ring-sky-500 focus:outline-none"
                                spellCheck="false"
                            />
                        ) : (
                            <article className="prose prose-invert max-w-none github-markdown-preview">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {editableContent}
                                </ReactMarkdown>
                            </article>
                        )}
                    </div>
                </>
            );
        }
        return (
             <div className="p-6 sm:p-8">
                <div className="text-center py-20 text-slate-500">
                    <DocumentIcon className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <h3 className="text-xl font-semibold text-slate-400">Your generated README will appear here</h3>
                    <p>Enter a repository URL above to get started.</p>
                </div>
            </div>
        );
    };

    return (
        <div className="mt-8 bg-slate-800/50 border border-slate-700 rounded-lg shadow-lg relative min-h-[20rem] overflow-hidden">
            {renderContent()}
        </div>
    );
};

interface TabButtonProps {
    label: string;
    isActive: boolean;
    onClick: () => void;
}

const TabButton: React.FC<TabButtonProps> = ({ label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 text-sm font-medium transition-colors ${
            isActive
                ? 'bg-slate-700/60 text-white border-b-2 border-sky-500'
                : 'text-slate-400 hover:text-white'
        }`}
    >
        {label}
    </button>
);