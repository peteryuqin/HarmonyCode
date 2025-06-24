/**
 * HarmonyCode v3.0.0 - Core WebSocket Server
 * Real-time collaboration with anti-echo-chamber enforcement
 */
import { EventEmitter } from 'events';
export interface ServerConfig {
    port: number;
    enableAntiEcho: boolean;
    diversityConfig?: {
        minimumDiversity: number;
        disagreementQuota: number;
        evidenceThreshold: number;
    };
    orchestrationConfig?: {
        enableSPARC: boolean;
        swarmMode: 'centralized' | 'distributed' | 'hierarchical';
        maxAgents: number;
    };
}
export declare class HarmonyCodeServer extends EventEmitter {
    private wss;
    private config;
    private sessions;
    private router;
    private diversity;
    private orchestration;
    private projectPath;
    constructor(config?: ServerConfig);
    /**
     * Start the HarmonyCode server
     */
    start(): Promise<void>;
    /**
     * Handle new WebSocket connection
     */
    private handleConnection;
    /**
     * Handle incoming message with diversity checks
     */
    private handleMessage;
    /**
     * Handle collaborative editing with conflict resolution
     */
    private handleEdit;
    /**
     * Handle task creation and assignment
     */
    private handleTask;
    /**
     * Handle voting with diversity weighting
     */
    private handleVote;
    /**
     * Handle SPARC mode spawn requests
     */
    private handleSpawnRequest;
    /**
     * Handle diversity intervention events
     */
    private handleDiversityIntervention;
    /**
     * Monitor and report diversity metrics
     */
    private startDiversityMonitoring;
    /**
     * Initialize project directory structure
     */
    private initializeProjectStructure;
    /**
     * Broadcast message to all or specific sessions
     */
    private broadcast;
    /**
     * Broadcast task updates
     */
    private broadcastTask;
    /**
     * Broadcast session updates
     */
    private broadcastSessionUpdate;
    /**
     * Handle chat messages
     */
    private handleChatMessage;
    /**
     * Handle session disconnect
     */
    private handleDisconnect;
    /**
     * Handle WebSocket errors
     */
    private handleError;
    /**
     * Check if message type should be diversity-checked
     */
    private shouldCheckDiversity;
    /**
     * Check if message should be orchestrated
     */
    private shouldOrchestrate;
    /**
     * Extract session ID from WebSocket URL
     */
    private extractSessionId;
    /**
     * Graceful shutdown
     */
    stop(): Promise<void>;
}
export default HarmonyCodeServer;
//# sourceMappingURL=server.d.ts.map