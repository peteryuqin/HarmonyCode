/**
 * HarmonyCode v3.1.0 - Identity Manager
 * Implements persistent agent identity separate from roles and sessions
 * Fixes the critical identity crisis issue from user feedback
 */
import { PerspectiveProfile } from '../diversity/types';
export interface AgentIdentity {
    agentId: string;
    displayName: string;
    firstSeen: Date;
    lastSeen: Date;
    currentRole: string;
    roleHistory: RoleTransition[];
    currentPerspective?: PerspectiveProfile;
    perspectiveHistory: PerspectiveTransition[];
    stats: AgentStats;
    currentSessionId?: string;
    authToken: string;
}
export interface RoleTransition {
    role: string;
    timestamp: Date;
    sessionId: string;
}
export interface PerspectiveTransition {
    perspective: PerspectiveProfile;
    timestamp: Date;
    reason?: string;
}
export interface AgentStats {
    totalSessions: number;
    totalMessages: number;
    totalTasks: number;
    totalEdits: number;
    diversityScore: number;
    agreementRate: number;
    evidenceRate: number;
}
export declare class IdentityManager {
    private identities;
    private tokenToAgent;
    private sessionToAgent;
    private persistPath;
    constructor(workspacePath?: string);
    /**
     * Register a new agent or retrieve existing one
     */
    registerAgent(displayName: string, role?: string): AgentIdentity;
    /**
     * Authenticate an agent using their token
     */
    authenticateAgent(authToken: string): AgentIdentity | null;
    /**
     * Connect an agent to a session
     */
    connectAgentToSession(agentId: string, sessionId: string): void;
    /**
     * Disconnect an agent from their session
     */
    disconnectAgent(sessionId: string): void;
    /**
     * Change an agent's role
     */
    changeAgentRole(agentId: string, newRole: string, sessionId: string): void;
    /**
     * Change an agent's perspective (for diversity)
     */
    changeAgentPerspective(agentId: string, newPerspective: PerspectiveProfile, reason?: string): void;
    /**
     * Get agent by session ID
     */
    getAgentBySessionId(sessionId: string): AgentIdentity | null;
    /**
     * Get agent by agent ID
     */
    getAgentById(agentId: string): AgentIdentity | null;
    /**
     * Find agent by display name
     */
    private findAgentByDisplayName;
    /**
     * Update agent statistics
     */
    updateAgentStats(agentId: string, updates: Partial<AgentStats>): void;
    /**
     * Get all active agents
     */
    getActiveAgents(): AgentIdentity[];
    /**
     * Get agents by role
     */
    getAgentsByRole(role: string): AgentIdentity[];
    /**
     * Get agent history report
     */
    getAgentHistoryReport(agentId: string): string;
    /**
     * Generate unique agent ID
     */
    private generateAgentId;
    /**
     * Generate authentication token
     */
    private generateAuthToken;
    /**
     * Load identities from disk
     */
    private loadIdentities;
    /**
     * Save identities to disk
     */
    private saveIdentities;
}
//# sourceMappingURL=identity-manager.d.ts.map