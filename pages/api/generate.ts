import { GoogleGenAI } from "@google/genai";
import type { NextApiRequest, NextApiResponse } from 'next';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

interface RepoData {
    name: string;
    description: string | null;
    language: string | null;
    topics: string[];
    license: string | null;
    fileTree: string[];
}

const fetchRepoData = async (owner: string, repo: string): Promise<RepoData> => {
    try {
        const repoUrl = `https://api.github.com/repos/${owner}/${repo}`;
        // Attempt to get the default branch first to build the tree URL
        const repoRes = await fetch(repoUrl);

        if (!repoRes.ok) {
            if (repoRes.status === 404) throw new Error("Repository not found. It might be private or spelled incorrectly.");
            if (repoRes.status === 403) throw new Error("GitHub API rate limit exceeded. Please wait a moment and try again.");
            throw new Error(`Failed to fetch repository data (Status: ${repoRes.status}).`);
        }
        const repoData = await repoRes.json();
        const defaultBranch = repoData.default_branch || 'main';

        const treeRes = await fetch(`${repoUrl}/git/trees/${defaultBranch}?recursive=1`);

        let fileTree: string[] = [];
        if (treeRes.ok) {
            const treeData = await treeRes.json();
            if (treeData.tree) {
                fileTree = treeData.tree
                    .map((file: { path: string; type: string }) => file.path)
                    .slice(0, 30); // Limit to 30 files to keep prompt reasonable
            }
        }
        
        return {
            name: repoData.name,
            description: repoData.description,
            language: repoData.language,
            topics: repoData.topics || [],
            license: repoData.license ? repoData.license.name : null,
            fileTree,
        };
    } catch (error) {
        console.error("GitHub API Error:", error);
        if (error instanceof Error) throw error;
        throw new Error("An unknown error occurred while fetching repository data.");
    }
};

const createPrompt = (repoUrl: string, repoData: RepoData): string => {
    return `
You are a GitHub README Generator, an AI expert at creating professional READMEs by analyzing repository data.

**Task:** Generate a comprehensive, markdown-formatted README file for the repository at ${repoUrl}.

**Repository Context (from GitHub API):**
*   **Project Name:** ${repoData.name}
*   **Description:** ${repoData.description || "No description provided."}
*   **Primary Language:** ${repoData.language || "Not specified."}
*   **Topics:** ${repoData.topics.length > 0 ? repoData.topics.join(', ') : "No topics listed."}
*   **License:** ${repoData.license || "No license specified."}
*   **File Structure (sample):** 
    ${repoData.fileTree.length > 0 ? repoData.fileTree.map(f => `- ${f}`).join('\n    ') : "Could not retrieve file structure."}

**README Composition Guidelines:**
*   Use the context above to make the content specific and accurate.
*   **Title:** Use the project name: '# ${repoData.name}'.
*   **Badges:** Include relevant badges (license, language, issues, stars). Use placeholder links like 'https://img.shields.io/...' but populate data from context where possible (e.g., license).
*   **About The Project:** Expand on the provided description. Use the file structure and language to infer the project's purpose if the description is minimal.
*   **Key Features:** Deduce 3-5 key features from the repository context.
*   **Installation:** Provide accurate installation steps. If you see 'package.json', suggest 'npm install'. If 'requirements.txt', suggest 'pip install -r requirements.txt'. If 'pom.xml', suggest Maven.
*   **Usage:** Give a clear usage example in a code block. If it's a library, show how to import and use a function. If it's an app, show how to run it.
*   **Workflow Documentation:** If files like '.github/workflows/main.yml' are present, describe the CI/CD pipeline. Otherwise, describe a typical development workflow based on the language. Use mermaid syntax inside a \`\`\`mermaid block for diagrams if it helps clarify the process. When creating mermaid diagrams, any node text containing special characters (like parentheses) must be enclosed in double quotes. For example: A["Node with (parentheses)"].
*   **Contributing:** A welcoming, generic contribution section is fine.
*   **License:** State the license from the context. If none, say it's unlicensed or suggest adding one.

**Critical Constraints:**
*   Your output MUST be based on the provided context. Do not invent features or instructions that cannot be inferred from the data.
*   The tone must be professional and technical.
*   Output only the raw markdown, starting directly with the title. Do not include any preamble or explanation.
    `;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { repoUrl } = req.body;

    if (!repoUrl) {
        return res.status(400).json({ error: 'repoUrl is required' });
    }

    try {
        // 1. Parse URL robustly
        let owner: string;
        let repo: string;
        try {
            const url = new URL(repoUrl);
            // Split pathname and filter out empty strings from leading/trailing slashes
            const pathParts = url.pathname.split('/').filter(Boolean);
            if (url.hostname !== 'github.com' || pathParts.length < 2) {
                 throw new Error("URL must be a valid GitHub repository link.");
            }
            owner = pathParts[0];
            // Strip .git suffix from repo name if present
            repo = pathParts[1].replace(/\.git$/, '');
        } catch (e) {
             throw new Error("Invalid GitHub URL format. Expected 'https://github.com/owner/repo'.");
        }

        // 2. Fetch data from GitHub API
        const repoData = await fetchRepoData(owner, repo);

        // 3. Create a detailed prompt
        const prompt = createPrompt(repoUrl, repoData);

        // 4. Call Gemini API
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                temperature: 0.3,
                topP: 0.95,
            }
        });

        const readmeText = response.text;
        if (!readmeText) {
            throw new Error("Received an empty response from the AI model.");
        }

        const readme = readmeText.replace(/^```markdown\n/, '').replace(/\n```$/, '');
        res.status(200).json({ readme });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
        res.status(500).json({ error: errorMessage });
    }
}
