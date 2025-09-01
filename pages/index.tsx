import React, { useState, useCallback } from 'react';
import { Header } from '../components/Header';
import { RepoInput } from '../components/RepoInput';
import { ReadmeDisplay } from '../components/ReadmeDisplay';

const Home = () => {
    const [repoUrl, setRepoUrl] = useState<string>('');
    const [generatedReadme, setGeneratedReadme] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = useCallback(async () => {
        if (!repoUrl || !repoUrl.startsWith('https://github.com/')) {
            setError('Please enter a valid GitHub repository URL.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setGeneratedReadme('');

        try {
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ repoUrl }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'An unexpected error occurred.');
            }

            const data = await response.json();
            setGeneratedReadme(data.readme);
        } catch (err) {
            console.error(err);
            const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred.';
            setError(`Failed to generate README: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    }, [repoUrl]);

    return (
        <div className="min-h-screen bg-slate-900 text-slate-200 font-sans">
            <Header />
            <main className="container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto">
                    <p className="text-center text-slate-400 mb-8">
                        Enter a public GitHub repository link and our AI will craft a professional README.md file, analyzing your project to create documentation that is both comprehensive and user-friendly.
                    </p>
                    
                    <RepoInput
                        repoUrl={repoUrl}
                        setRepoUrl={setRepoUrl}
                        onGenerate={handleGenerate}
                        isLoading={isLoading}
                    />
                    
                    {error && (
                        <div className="mt-6 bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-md text-center">
                            {error}
                        </div>
                    )}
                    
                    <ReadmeDisplay
                        readmeContent={generatedReadme}
                        isLoading={isLoading}
                        error={error}
                    />
                </div>
            </main>
             <footer className="text-center py-6 text-slate-500 text-sm">
                <p>Powered by Gemini API & GitHub API</p>
            </footer>
        </div>
    );
};

export default Home;
