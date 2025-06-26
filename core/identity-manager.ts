/**
 * HarmonyCode v3.1.0 - Identity Manager
 * Implements persistent agent identity separate from roles and sessions
 * Fixes the critical identity crisis issue from user feedback
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { Session } from './session-manager';
import { PerspectiveProfile } from '../diversity/types';

export interface AgentIdentity {
  // Unique, persistent agent ID (never changes)
  agentId: string;
  
  // Human-readable name chosen by the agent
  displayName: string;
  
  // When this agent first joined the system
  firstSeen: Date;
  
  // Last time this agent was active
  lastSeen: Date;
  
  // Current role (can change during session)
  currentRole: string;
  
  // History of all roles this agent has played
  roleHistory: RoleTransition[];
  
  // Current perspective (for diversity enforcement)
  currentPerspective?: PerspectiveProfile;
  
  // History of perspectives for tracking diversity
  perspectiveHistory: PerspectiveTransition[];
  
  // Statistics about this agent
  stats: AgentStats;
  
  // Current session ID (if connected)
  currentSessionId?: string;
  
  // Authentication token for reconnection
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

export class IdentityManager {
  private identities: Map<string, AgentIdentity> = new Map();
  private tokenToAgent: Map<string, string> = new Map();
  private sessionToAgent: Map<string, string> = new Map();
  private persistPath: string;

  constructor(workspacePath: string = '.harmonycode') {
    this.persistPath = path.join(workspacePath, 'identities.json');
    this.loadIdentities();
  }

  /**
   * Register a new agent or retrieve existing one
   */
  registerAgent(displayName: string, role: string = 'general'): AgentIdentity {
    // Check if an agent with this display name already exists
    const existingAgent = this.findAgentByDisplayName(displayName);
    if (existingAgent) {
      return existingAgent;
    }

    // Create new agent identity
    const agentId = this.generateAgentId();
    const authToken = this.generateAuthToken();
    
    const identity: AgentIdentity = {
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
  authenticateAgent(authToken: string): AgentIdentity | null {
    const agentId = this.tokenToAgent.get(authToken);
    if (!agentId) return null;
    
    const identity = this.identities.get(agentId);
    if (!identity) return null;
    
    // Update last seen
    identity.lastSeen = new Date();
    this.saveIdentities();
    
    return identity;
  }

  /**
   * Connect an agent to a session
   */
  connectAgentToSession(agentId: string, sessionId: string): void {
    const identity = this.identities.get(agentId);
    if (!identity) return;

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
  disconnectAgent(sessionId: string): void {
    const agentId = this.sessionToAgent.get(sessionId);
    if (!agentId) return;

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
  changeAgentRole(agentId: string, newRole: string, sessionId: string): void {
    const identity = this.identities.get(agentId);
    if (!identity) return;

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
  changeAgentPerspective(
    agentId: string, 
    newPerspective: PerspectiveProfile, 
    reason?: string
  ): void {
    const identity = this.identities.get(agentId);
    if (!identity) return;

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
  getAgentBySessionId(sessionId: string): AgentIdentity | null {
    const agentId = this.sessionToAgent.get(sessionId);
    if (!agentId) return null;
    
    return this.identities.get(agentId) || null;
  }

  /**
   * Get agent by agent ID
   */
  getAgentById(agentId: string): AgentIdentity | null {
    return this.identities.get(agentId) || null;
  }

  /**
   * Find agent by display name
   */
  private findAgentByDisplayName(displayName: string): AgentIdentity | null {
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
  updateAgentStats(agentId: string, updates: Partial<AgentStats>): void {
    const identity = this.identities.get(agentId);
    if (!identity) return;

    identity.stats = {
      ...identity.stats,
      ...updates
    };

    this.saveIdentities();
  }

  /**
   * Get all active agents
   */
  getActiveAgents(): AgentIdentity[] {
    return Array.from(this.identities.values())
      .filter(agent => agent.currentSessionId !== undefined);
  }

  /**
   * Get agents by role
   */
  getAgentsByRole(role: string): AgentIdentity[] {
    return Array.from(this.identities.values())
      .filter(agent => agent.currentRole === role);
  }

  /**
   * Get agent history report
   */
  getAgentHistoryReport(agentId: string): string {
    const identity = this.identities.get(agentId);
    if (!identity) return 'Agent not found';

    const report = [
      `Agent: ${identity.displayName} (${identity.agentId})`,
      `First seen: ${identity.firstSeen.toISOString()}`,
      `Last seen: ${identity.lastSeen.toISOString()}`,
      `Current role: ${identity.currentRole}`,
      `Total sessions: ${identity.stats.totalSessions}`,
      ``,
      `Role History:`,
      ...identity.roleHistory.map(r => 
        `  - ${r.role} at ${r.timestamp.toISOString()}`
      ),
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
  private generateAgentId(): string {
    return `agent-${crypto.randomBytes(8).toString('hex')}`;
  }

  /**
   * Generate authentication token
   */
  private generateAuthToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Load identities from disk
   */
  private loadIdentities(): void {
    try {
      if (fs.existsSync(this.persistPath)) {
        const data = fs.readFileSync(this.persistPath, 'utf-8');
        const parsed = JSON.parse(data);
        
        // Reconstruct maps
        parsed.identities.forEach((identity: any) => {
          // Convert date strings back to Date objects
          identity.firstSeen = new Date(identity.firstSeen);
          identity.lastSeen = new Date(identity.lastSeen);
          identity.roleHistory.forEach((r: any) => {
            r.timestamp = new Date(r.timestamp);
          });
          identity.perspectiveHistory.forEach((p: any) => {
            p.timestamp = new Date(p.timestamp);
          });
          
          this.identities.set(identity.agentId, identity);
          this.tokenToAgent.set(identity.authToken, identity.agentId);
          
          if (identity.currentSessionId) {
            this.sessionToAgent.set(identity.currentSessionId, identity.agentId);
          }
        });
      }
    } catch (error) {
      console.error('Failed to load identities:', error);
    }
  }

  /**
   * Save identities to disk
   */
  private saveIdentities(): void {
    try {
      const data = {
        identities: Array.from(this.identities.values()),
        version: '3.1.0'
      };
      
      fs.writeFileSync(this.persistPath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Failed to save identities:', error);
    }
  }
}