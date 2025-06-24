#!/usr/bin/env node

/**
 * Compression Recovery Tool for HarmonyCode
 * 
 * Helps compressed AI sessions recover their context and continue work
 * A REAL tool for a REAL problem!
 */

const fs = require('fs').promises;
const path = require('path');
const readline = require('readline');

class CompressionRecovery {
    constructor() {
        this.boardPaths = [
            '.claude-collab/DISCUSSION_BOARD.md',
            'DISCUSSION_BOARD.md',
            path.join(process.cwd(), '.claude-collab/DISCUSSION_BOARD.md'),
            path.join(process.cwd(), 'github-repo/v2-features/.harmonycode/DISCUSSION_BOARD.md')
        ];
        
        this.recoveryDir = path.join(process.cwd(), 'recovery');
    }
    
    async findDiscussionBoards() {
        const boards = [];
        
        for (const boardPath of this.boardPaths) {
            try {
                await fs.access(boardPath);
                boards.push(boardPath);
                console.log(`✓ Found discussion board: ${boardPath}`);
            } catch (e) {
                // Not found, skip
            }
        }
        
        // Also search for any .md files that might be discussion boards
        try {
            const files = await this.findMarkdownFiles(process.cwd());
            for (const file of files) {
                if (file.includes('DISCUSSION') || file.includes('BOARD')) {
                    boards.push(file);
                    console.log(`✓ Found potential board: ${file}`);
                }
            }
        } catch (e) {
            console.error('Error searching for boards:', e.message);
        }
        
        return boards;
    }
    
    async findMarkdownFiles(dir, files = []) {
        try {
            const items = await fs.readdir(dir, { withFileTypes: true });
            
            for (const item of items) {
                if (item.isDirectory() && !item.name.startsWith('.') && item.name !== 'node_modules') {
                    await this.findMarkdownFiles(path.join(dir, item.name), files);
                } else if (item.isFile() && item.name.endsWith('.md')) {
                    files.push(path.join(dir, item.name));
                }
            }
        } catch (e) {
            // Skip directories we can't read
        }
        
        return files;
    }
    
    async extractSessionMessages(boardPath, sessionId) {
        console.log(`\nScanning ${boardPath} for ${sessionId} messages...`);
        
        const content = await fs.readFile(boardPath, 'utf8');
        const lines = content.split('\n');
        
        const messages = [];
        let currentMessage = null;
        let inSession = false;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            // Check for session header
            const sessionMatch = line.match(/###\s*(session\d+)/i);
            if (sessionMatch) {
                // Save previous message if exists
                if (currentMessage && inSession) {
                    messages.push(currentMessage);
                }
                
                // Check if this is our session
                inSession = sessionMatch[1].toLowerCase() === sessionId.toLowerCase();
                
                if (inSession) {
                    currentMessage = {
                        session: sessionMatch[1],
                        timestamp: this.extractTimestamp(lines[i] || lines[i+1]),
                        content: [],
                        boardPath
                    };
                } else {
                    currentMessage = null;
                }
            } else if (inSession && currentMessage) {
                // Add content to current message
                if (line.trim() !== '---' && line.trim() !== '') {
                    currentMessage.content.push(line);
                }
            } else if (line.trim() === '---' && currentMessage && inSession) {
                // End of message
                messages.push(currentMessage);
                currentMessage = null;
                inSession = false;
            }
        }
        
        // Don't forget last message
        if (currentMessage && inSession) {
            messages.push(currentMessage);
        }
        
        console.log(`Found ${messages.length} messages from ${sessionId}`);
        return messages;
    }
    
    extractTimestamp(line) {
        const match = line.match(/\(([^)]+)\)/);
        return match ? match[1] : 'unknown time';
    }
    
    async extractCodeSnippets(messages) {
        const codeSnippets = [];
        
        for (const message of messages) {
            const content = message.content.join('\n');
            
            // Find code blocks
            const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
            let match;
            
            while ((match = codeBlockRegex.exec(content)) !== null) {
                codeSnippets.push({
                    language: match[1] || 'unknown',
                    code: match[2],
                    timestamp: message.timestamp,
                    context: content.substring(Math.max(0, match.index - 100), match.index)
                });
            }
        }
        
        return codeSnippets;
    }
    
    async createRecoveryDocument(sessionId, messages, codeSnippets) {
        // Create recovery directory
        await fs.mkdir(this.recoveryDir, { recursive: true });
        
        const recoveryFile = path.join(this.recoveryDir, `${sessionId}-recovery.md`);
        
        let content = `# Recovery Document for ${sessionId}\n\n`;
        content += `Generated: ${new Date().toISOString()}\n`;
        content += `Total messages found: ${messages.length}\n`;
        content += `Code snippets found: ${codeSnippets.length}\n\n`;
        
        content += `## Summary of Work\n\n`;
        
        // Analyze what this session was working on
        const topics = this.analyzeTopics(messages);
        content += `### Main Topics:\n`;
        topics.forEach(topic => {
            content += `- ${topic}\n`;
        });
        
        content += `\n## Chronological Messages\n\n`;
        
        // Add all messages
        for (const message of messages) {
            content += `### ${message.timestamp}\n`;
            content += message.content.join('\n');
            content += '\n\n---\n\n';
        }
        
        content += `## Code Snippets\n\n`;
        
        // Add code snippets
        for (let i = 0; i < codeSnippets.length; i++) {
            const snippet = codeSnippets[i];
            content += `### Snippet ${i + 1} (${snippet.language})\n`;
            content += `Context: ${snippet.context.trim()}...\n\n`;
            content += '```' + snippet.language + '\n';
            content += snippet.code;
            content += '\n```\n\n';
        }
        
        await fs.writeFile(recoveryFile, content);
        console.log(`\n✅ Recovery document created: ${recoveryFile}`);
        
        return recoveryFile;
    }
    
    analyzeTopics(messages) {
        const topics = new Map();
        const keywords = [
            'built', 'created', 'implemented', 'fixed', 'added',
            'working on', 'completed', 'integrated', 'tested'
        ];
        
        for (const message of messages) {
            const content = message.content.join(' ').toLowerCase();
            
            // Look for key phrases
            for (const keyword of keywords) {
                if (content.includes(keyword)) {
                    const words = content.split(' ');
                    const keywordIndex = words.findIndex(w => w.includes(keyword));
                    
                    if (keywordIndex !== -1) {
                        // Get context around keyword
                        const start = Math.max(0, keywordIndex - 5);
                        const end = Math.min(words.length, keywordIndex + 10);
                        const phrase = words.slice(start, end).join(' ');
                        
                        // Clean up the phrase
                        const cleaned = phrase.replace(/[*`#]/g, '').trim();
                        if (cleaned.length > 20 && cleaned.length < 100) {
                            topics.set(cleaned, (topics.get(cleaned) || 0) + 1);
                        }
                    }
                }
            }
        }
        
        // Sort by frequency and return top topics
        return Array.from(topics.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([topic]) => topic);
    }
    
    async recoverSession(sessionId) {
        console.log(`\n🔍 Starting recovery for ${sessionId}...\n`);
        
        // Find all discussion boards
        const boards = await this.findDiscussionBoards();
        
        if (boards.length === 0) {
            console.error('❌ No discussion boards found!');
            return;
        }
        
        // Extract messages from all boards
        let allMessages = [];
        for (const board of boards) {
            const messages = await this.extractSessionMessages(board, sessionId);
            allMessages = allMessages.concat(messages);
        }
        
        if (allMessages.length === 0) {
            console.error(`❌ No messages found for ${sessionId}`);
            return;
        }
        
        // Sort by timestamp
        allMessages.sort((a, b) => {
            return new Date(a.timestamp) - new Date(b.timestamp);
        });
        
        // Extract code snippets
        const codeSnippets = await this.extractCodeSnippets(allMessages);
        
        // Create recovery document
        const recoveryFile = await this.createRecoveryDocument(sessionId, allMessages, codeSnippets);
        
        console.log('\n📋 Recovery Summary:');
        console.log(`- Messages recovered: ${allMessages.length}`);
        console.log(`- Code snippets found: ${codeSnippets.length}`);
        console.log(`- Recovery file: ${recoveryFile}`);
        
        return recoveryFile;
    }
}

// CLI Interface
async function main() {
    const recovery = new CompressionRecovery();
    
    console.log('🔧 HarmonyCode Compression Recovery Tool\n');
    
    // Get session ID from command line or ask
    let sessionId = process.argv[2];
    
    if (!sessionId) {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        sessionId = await new Promise(resolve => {
            rl.question('Which session needs recovery? (e.g., session2): ', answer => {
                rl.close();
                resolve(answer);
            });
        });
    }
    
    if (!sessionId) {
        console.error('❌ Session ID required!');
        process.exit(1);
    }
    
    try {
        await recovery.recoverSession(sessionId);
        console.log('\n✨ Recovery complete!');
    } catch (error) {
        console.error('\n❌ Recovery failed:', error.message);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = { CompressionRecovery };