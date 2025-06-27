"use strict";
/**
 * HarmonyCode v3.1.0 - Identity Manager
 * Implements persistent agent identity separate from roles and sessions
 * Fixes the critical identity crisis issue from user feedback
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdentityManager = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const crypto = __importStar(require("crypto"));
class IdentityManager {
    constructor(workspacePath = '.harmonycode') {
        this.identities = new Map();
        this.tokenToAgent = new Map();
        this.sessionToAgent = new Map();
        this.persistPath = path.join(workspacePath, 'identities.json');
        this.loadIdentities();
    }
    /**
     * Register a new agent or retrieve existing one
     */
    registerAgent(displayName, role = 'general') {
        // Check if an agent with this display name already exists
        const existingAgent = this.findAgentByDisplayName(displayName);
        if (existingAgent) {
            return existingAgent;
        }
        // Create new agent identity
        const agentId = this.generateAgentId();
        const authToken = this.generateAuthToken();
        const identity = {
            agentId,
            displayName,
            firstSeen: new Date(),
            lastSeen: new Date(),
            currentRole: role,
            roleHistory: [{
                    role,
                    timestamp: new Date(),
                    sessionId: 'initial'
                }],
            perspectiveHistory: [],
            stats: {
                totalSessions: 0,
                totalMessages: 0,
                totalTasks: 0,
                totalEdits: 0,
                diversityScore: 0.5,
                agreementRate: 0.5,
                evidenceRate: 0.5
            },
            authToken
        };
        this.identities.set(agentId, identity);
        this.tokenToAgent.set(authToken, agentId);
        this.saveIdentities();
        return identity;
    }
    /**
     * Authenticate an agent using their token
     */
    authenticateAgent(authToken) {
        const agentId = this.tokenToAgent.get(authToken);
        if (!agentId)
            return null;
        const identity = this.identities.get(agentId);
        if (!identity)
            return null;
        // Update last seen
        identity.lastSeen = new Date();
        this.saveIdentities();
        return identity;
    }
    /**
     * Connect an agent to a session
     */
    connectAgentToSession(agentId, sessionId) {
        const identity = this.identities.get(agentId);
        if (!identity)
            return;
        // Disconnect from previous session if any
        if (identity.currentSessionId) {
            this.sessionToAgent.delete(identity.currentSessionId);
        }
        // Connect to new session
        identity.currentSessionId = sessionId;
        identity.stats.totalSessions++;
        this.sessionToAgent.set(sessionId, agentId);
        this.saveIdentities();
    }
    /**
     * Disconnect an agent from their session
     */
    disconnectAgent(sessionId) {
        const agentId = this.sessionToAgent.get(sessionId);
        if (!agentId)
            return;
        const identity = this.identities.get(agentId);
        if (identity) {
            identity.currentSessionId = undefined;
            this.saveIdentities();
        }
        this.sessionToAgent.delete(sessionId);
    }
    /**
     * Change an agent's role
     */
    changeAgentRole(agentId, newRole, sessionId) {
        const identity = this.identities.get(agentId);
        if (!identity)
            return;
        // Record role transition
        identity.roleHistory.push({
            role: identity.currentRole,
            timestamp: new Date(),
            sessionId
        });
        identity.currentRole = newRole;
        this.saveIdentities();
    }
    /**
     * Change an agent's perspective (for diversity)
     */
    changeAgentPerspective(agentId, newPerspective, reason) {
        const identity = this.identities.get(agentId);
        if (!identity)
            return;
        // Record perspective transition
        if (identity.currentPerspective) {
            identity.perspectiveHistory.push({
                perspective: identity.currentPerspective,
                timestamp: new Date(),
                reason
            });
        }
        identity.currentPerspective = newPerspective;
        this.saveIdentities();
    }
    /**
     * Get agent by session ID
     */
    getAgentBySessionId(sessionId) {
        const agentId = this.sessionToAgent.get(sessionId);
        if (!agentId)
            return null;
        return this.identities.get(agentId) || null;
    }
    /**
     * Get agent by agent ID
     */
    getAgentById(agentId) {
        return this.identities.get(agentId) || null;
    }
    /**
     * Find agent by display name
     */
    findAgentByDisplayName(displayName) {
        for (const identity of this.identities.values()) {
            if (identity.displayName === displayName) {
                return identity;
            }
        }
        return null;
    }
    /**
     * Update agent statistics
     */
    updateAgentStats(agentId, updates) {
        const identity = this.identities.get(agentId);
        if (!identity)
            return;
        identity.stats = {
            ...identity.stats,
            ...updates
        };
        this.saveIdentities();
    }
    /**
     * Get all active agents
     */
    getActiveAgents() {
        return Array.from(this.identities.values())
            .filter(agent => agent.currentSessionId !== undefined);
    }
    /**
     * Get agents by role
     */
    getAgentsByRole(role) {
        return Array.from(this.identities.values())
            .filter(agent => agent.currentRole === role);
    }
    /**
     * Get agent history report
     */
    getAgentHistoryReport(agentId) {
        const identity = this.identities.get(agentId);
        if (!identity)
            return 'Agent not found';
        const report = [
            `Agent: ${identity.displayName} (${identity.agentId})`,
            `First seen: ${identity.firstSeen.toISOString()}`,
            `Last seen: ${identity.lastSeen.toISOString()}`,
            `Current role: ${identity.currentRole}`,
            `Total sessions: ${identity.stats.totalSessions}`,
            ``,
            `Role History:`,
            ...identity.roleHistory.map(r => `  - ${r.role} at ${r.timestamp.toISOString()}`),
            ``,
            `Diversity Metrics:`,
            `  - Diversity score: ${identity.stats.diversityScore}`,
            `  - Agreement rate: ${identity.stats.agreementRate}`,
            `  - Evidence rate: ${identity.stats.evidenceRate}`
        ];
        return report.join('\n');
    }
    /**
     * Generate unique agent ID
     */
    generateAgentId() {
        return `agent-${crypto.randomBytes(8).toString('hex')}`;
    }
    /**
     * Generate authentication token
     */
    generateAuthToken() {
        return crypto.randomBytes(32).toString('hex');
    }
    /**
     * Load identities from disk
     */
    loadIdentities() {
        try {
            if (fs.existsSync(this.persistPath)) {
                const data = fs.readFileSync(this.persistPath, 'utf-8');
                const parsed = JSON.parse(data);
                // Reconstruct maps
                parsed.identities.forEach((identity) => {
                    // Convert date strings back to Date objects
                    identity.firstSeen = new Date(identity.firstSeen);
                    identity.lastSeen = new Date(identity.lastSeen);
                    identity.roleHistory.forEach((r) => {
                        r.timestamp = new Date(r.timestamp);
                    });
                    identity.perspectiveHistory.forEach((p) => {
                        p.timestamp = new Date(p.timestamp);
                    });
                    this.identities.set(identity.agentId, identity);
                    this.tokenToAgent.set(identity.authToken, identity.agentId);
                    if (identity.currentSessionId) {
                        this.sessionToAgent.set(identity.currentSessionId, identity.agentId);
                    }
                });
            }
        }
        catch (error) {
            console.error('Failed to load identities:', error);
        }
    }
    /**
     * Save identities to disk
     */
    saveIdentities() {
        try {
            const data = {
                identities: Array.from(this.identities.values()),
                version: '3.1.0'
            };
            fs.writeFileSync(this.persistPath, JSON.stringify(data, null, 2));
        }
        catch (error) {
            console.error('Failed to save identities:', error);
        }
    }
}
exports.IdentityManager = IdentityManager;
//# sourceMappingURL=identity-manager.js.map