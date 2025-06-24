/**
 * HarmonyCode - AI Collaboration Framework
 * 
 * Core principle: Simple tools that actually work
 */

const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');

class HarmonyCode extends EventEmitter {
    constructor(options = {}) {
        super();
        this.projectRoot = options.projectRoot || process.cwd();
        this.discussionFile = path.join(this.projectRoot, '.harmonycode', 'DISCUSSION_BOARD.md');
        this.configFile = path.join(this.projectRoot, '.harmonycode', 'config.json');
        this.session = options.session || process.env.HARMONYCODE_SESSION || 'session1';
        
        this.ensureProjectStructure();
    }

    /**
     * Initialize a new HarmonyCode project
     */
    init(projectName) {
        const projectPath = path.join(process.cwd(), projectName);
        
        // Create project structure
        fs.mkdirSync(projectPath, { recursive: true });
        fs.mkdirSync(path.join(projectPath, '.harmonycode'), { recursive: true });
        
        // Create initial files
        const config = {
            projectName,
            created: new Date().toISOString(),
            sessions: [],
            communicationMode: 'file-based',
            features: {
                compression_recovery: true,
                conflict_resolution: false,
                evolution_engine: false
            }
        };
        
        fs.writeFileSync(
            path.join(projectPath, '.harmonycode', 'config.json'),
            JSON.stringify(config, null, 2)
        );
        
        fs.writeFileSync(
            path.join(projectPath, '.harmonycode', 'DISCUSSION_BOARD.md'),
            `# ${projectName} Discussion Board\n\nCreated: ${new Date().toISOString()}\n\n---\n\n`
        );
        
        this.emit('project:initialized', { projectName, projectPath });
        return projectPath;
    }

    /**
     * Join a project as a session
     */
    join(sessionId, role = null) {
        this.session = sessionId;
        const config = this.loadConfig();
        
        // Ensure sessions array exists
        if (!config.sessions) {
            config.sessions = [];
        }
        
        // Add session to config
        const sessionInfo = {
            id: sessionId,
            joinedAt: new Date().toISOString(),
            role: role || 'collaborator'
        };
        
        if (!config.sessions.find(s => s.id === sessionId)) {
            config.sessions.push(sessionInfo);
            this.saveConfig(config);
        }
        
        // Announce joining
        this.say(`${sessionId} joined the project${role ? ` as ${role}` : ''}`);
        
        this.emit('session:joined', sessionInfo);
        return sessionInfo;
    }

    /**
     * Post a message to the discussion board
     */
    say(message) {
        const timestamp = new Date().toISOString();
        const entry = `### ${this.session} (${timestamp})\n${message}\n\n---\n\n`;
        
        fs.appendFileSync(this.discussionFile, entry);
        this.emit('message:posted', { session: this.session, message, timestamp });
        
        return { session: this.session, message, timestamp };
    }

    /**
     * Read the discussion board
     */
    read(limit = null) {
        if (!fs.existsSync(this.discussionFile)) {
            return [];
        }
        
        const content = fs.readFileSync(this.discussionFile, 'utf8');
        const messages = this.parseDiscussionBoard(content);
        
        if (limit) {
            return messages.slice(-limit);
        }
        
        return messages;
    }

    /**
     * Get project status
     */
    status() {
        const config = this.loadConfig();
        const messages = this.read();
        const recentMessages = messages.slice(-10);
        
        const activeSessions = (config.sessions || []).map(s => {
            const lastMessage = messages
                .filter(m => m.session === s.id)
                .pop();
            
            return {
                ...s,
                lastActive: lastMessage ? lastMessage.timestamp : s.joinedAt
            };
        });
        
        return {
            project: config.projectName,
            mode: config.communicationMode,
            sessions: activeSessions,
            totalMessages: messages.length,
            recentMessages,
            features: config.features
        };
    }

    /**
     * Enable advanced features
     */
    enable(feature) {
        const validFeatures = ['conflict_resolution', 'evolution_engine', 'api_server'];
        
        if (!validFeatures.includes(feature)) {
            throw new Error(`Invalid feature: ${feature}. Valid features: ${validFeatures.join(', ')}`);
        }
        
        const config = this.loadConfig();
        if (!config.features) {
            config.features = {};
        }
        config.features[feature] = true;
        this.saveConfig(config);
        
        this.emit('feature:enabled', { feature });
        return config.features;
    }

    // Helper methods
    
    ensureProjectStructure() {
        const harmonyDir = path.join(this.projectRoot, '.harmonycode');
        if (!fs.existsSync(harmonyDir)) {
            fs.mkdirSync(harmonyDir, { recursive: true });
        }
    }

    loadConfig() {
        if (!fs.existsSync(this.configFile)) {
            return {
                projectName: 'unnamed',
                sessions: [],
                communicationMode: 'file-based',
                features: {}
            };
        }
        
        return JSON.parse(fs.readFileSync(this.configFile, 'utf8'));
    }

    saveConfig(config) {
        fs.writeFileSync(this.configFile, JSON.stringify(config, null, 2));
    }

    parseDiscussionBoard(content) {
        const messages = [];
        const sections = content.split('---').filter(s => s.trim());
        
        sections.forEach(section => {
            const lines = section.trim().split('\n');
            const headerMatch = lines[0].match(/^### (\w+) \((.*?)\)$/);
            
            if (headerMatch) {
                messages.push({
                    session: headerMatch[1],
                    timestamp: headerMatch[2],
                    message: lines.slice(1).join('\n').trim()
                });
            }
        });
        
        return messages;
    }
}

// Export main class and utilities
module.exports = {
    HarmonyCode,
    
    // Re-export key components
    ConflictResolver: require('./conflict-resolver-v2'),
    
    // Patterns and constants
    patterns: {
        NATURAL_ROLES: ['architect', 'builder', 'infrastructure', 'integrator', 'reality_checker'],
        COMMUNICATION_MODES: ['file-based', 'websocket', 'hybrid']
    }
};