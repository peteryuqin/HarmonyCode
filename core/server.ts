/**
 * HarmonyCode v3.0.0 - Core WebSocket Server
 * Real-time collaboration with anti-echo-chamber enforcement
 */

import { WebSocket, WebSocketServer } from 'ws';
import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';
import { DiversityMiddleware } from '../diversity/middleware';
import { OrchestrationEngine } from '../orchestration/engine';
import { EnhancedSessionManager } from './session-manager-enhanced';
import { IdentityManager } from './identity-manager';
import { MessageRouter } from './message-router';
import { RealtimeEnhancer } from './realtime-enhancer';

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

export class HarmonyCodeServer extends EventEmitter {
  private wss!: WebSocketServer;
  private config: ServerConfig;
  private sessions: EnhancedSessionManager;
  private identityManager: IdentityManager;
  private router: MessageRouter;
  private diversity: DiversityMiddleware;
  private orchestration: OrchestrationEngine;
  private realtimeEnhancer: RealtimeEnhancer;
  private projectPath: string;

  constructor(config: ServerConfig = { port: 8765, enableAntiEcho: true }) {
    super();
    this.config = config;
    this.projectPath = process.cwd();
    this.identityManager = new IdentityManager(path.join(this.projectPath, '.harmonycode'));
    this.sessions = new EnhancedSessionManager(this.identityManager);
    this.router = new MessageRouter();
    this.diversity = new DiversityMiddleware(config.diversityConfig);
    this.orchestration = new OrchestrationEngine(config.orchestrationConfig);
    this.realtimeEnhancer = new RealtimeEnhancer({
      watchPaths: [path.join(this.projectPath, '.harmonycode')],
      enableNotifications: true,
      enableLiveCursors: true
    });
    
    // Connect components
    this.diversity.on('intervention', this.handleDiversityIntervention.bind(this));
    this.orchestration.on('taskCreated', this.broadcastTask.bind(this));
  }

  /**
   * Start the HarmonyCode server
   */
  async start(): Promise<void> {
    this.wss = new WebSocketServer({ port: this.config.port });
    
    console.log(`
╔════════════════════════════════════════════════════════╗
║           🎵 HarmonyCode v3.1.0 Server 🎵              ║
║                                                        ║
║  Real-time collaboration with persistent identity      ║
║  Anti-echo-chamber: ${this.config.enableAntiEcho ? 'ENABLED ✓' : 'DISABLED'}                           ║
╚════════════════════════════════════════════════════════╝
    `);
    
    console.log(`🚀 Server running on ws://localhost:${this.config.port}`);
    console.log(`📂 Project directory: ${this.projectPath}\n`);
    
    // Initialize project structure
    this.initializeProjectStructure();
    
    // Set up WebSocket handlers
    this.wss.on('connection', this.handleConnection.bind(this));
    
    // Start orchestration engine
    await this.orchestration.initialize();
    
    // Start real-time file watching
    this.realtimeEnhancer.startWatching();
    this.setupRealtimeHandlers();
    
    // Monitor diversity metrics
    if (this.config.enableAntiEcho) {
      this.startDiversityMonitoring();
    }
  }

  /**
   * Handle new WebSocket connection with identity support
   */
  private handleConnection(ws: WebSocket, req: any): void {
    const sessionId = this.generateSessionId();
    
    // Don't create session yet - wait for authentication
    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'auth') {
          await this.handleAuthentication(ws, sessionId, message);
        } else {
          // Reject non-auth messages from unauthenticated connections
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Authentication required. Send auth message first.'
          }));
        }
      } catch (error) {
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Invalid message format'
        }));
      }
    });
    
    ws.on('error', (error) => console.error('WebSocket error:', error));
  }
  
  /**
   * Handle agent authentication
   */
  private async handleAuthentication(ws: WebSocket, sessionId: string, authMessage: any): Promise<void> {
    try {
      const { agentName, authToken, role = 'general', perspective } = authMessage;
      
      // Create or authenticate session
      const session = this.sessions.createSession(
        sessionId,
        ws,
        authToken,
        agentName,
        role
      );
      
      const agentIdentity = session.agentIdentity;
      const isReturning = agentIdentity.stats.totalSessions > 1;
      
      console.log(`✅ ${agentIdentity.displayName} connected (${session.currentRole})`);
      console.log(`   Agent ID: ${agentIdentity.agentId}`);
      if (isReturning) {
        console.log(`   Welcome back! Sessions: ${agentIdentity.stats.totalSessions}`);
      }
      
      // Send auth success with identity info
      ws.send(JSON.stringify({
        type: 'auth-success',
        agentId: agentIdentity.agentId,
        authToken: agentIdentity.authToken,
        isReturning,
        totalSessions: agentIdentity.stats.totalSessions,
        totalContributions: agentIdentity.stats.totalMessages + agentIdentity.stats.totalTasks + agentIdentity.stats.totalEdits,
        lastSeen: agentIdentity.lastSeen,
        serverVersion: '3.1.0',
        capabilities: {
          realtime: true,
          orchestration: true,
          antiEchoChamber: this.config.enableAntiEcho,
          persistentIdentity: true,
          sparcModes: this.orchestration.getAvailableModes()
        }
      }));
      
      // Assign perspective if anti-echo enabled
      if (this.config.enableAntiEcho && perspective) {
        this.sessions.changeSessionPerspective(sessionId, perspective);
        console.log(`   Assigned perspective: ${perspective}`);
      } else if (this.config.enableAntiEcho) {
        const assignedPerspective = this.diversity.assignPerspective(sessionId);
        this.sessions.changeSessionPerspective(sessionId, assignedPerspective);
        console.log(`   Assigned perspective: ${assignedPerspective}`);
      }
      
      // Set up authenticated message handlers
      ws.removeAllListeners('message');
      ws.on('message', (data) => this.handleMessage(session, data));
      ws.on('close', () => this.handleDisconnect(session));
      
      // Set up real-time update stream for this session
      this.realtimeEnhancer.createUpdateStream(ws);
      
      // Notify other sessions
      this.broadcastSessionUpdate('joined', session);
      
    } catch (error: any) {
      console.error('Authentication error:', error);
      ws.send(JSON.stringify({
        type: 'auth-failed',
        reason: error.message || 'Authentication failed'
      }));
      ws.close();
    }
  }

  /**
   * Handle incoming message with diversity checks
   */
  private async handleMessage(session: any, data: any): Promise<void> {
    try {
      const message = JSON.parse(data.toString());
      
      // Log message for analysis
      console.log(`💬 ${session.name}: ${message.type}`);
      
      // Apply diversity middleware if enabled
      if (this.config.enableAntiEcho && this.shouldCheckDiversity(message.type)) {
        const diversityCheck = await this.diversity.checkMessage({
          sessionId: session.id,
          content: message.content || message.text,
          type: message.type,
          evidence: message.evidence
        });
        
        if (!diversityCheck.allowed) {
          // Send intervention requirement
          session.ws.send(JSON.stringify({
            type: 'diversity-intervention',
            reason: diversityCheck.reason,
            requiredAction: diversityCheck.requiredAction,
            suggestions: diversityCheck.suggestions
          }));
          
          console.log(`❌ Diversity check failed: ${diversityCheck.reason}`);
          return;
        }
      }
      
      // Route message through orchestration if needed
      if (this.shouldOrchestrate(message.type)) {
        await this.orchestration.processMessage(session.id, message);
      }
      
      // Handle different message types
      switch (message.type) {
        case 'edit':
          await this.handleEdit(session, message);
          this.sessions.incrementSessionMetric(session.id, 'edits');
          break;
          
        case 'task':
          await this.handleTask(session, message);
          if (message.action === 'create' || message.action === 'complete') {
            this.sessions.incrementSessionMetric(session.id, 'tasks');
          }
          break;
          
        case 'vote':
          await this.handleVote(session, message);
          break;
          
        case 'message':
          await this.handleChatMessage(session, message);
          this.sessions.incrementSessionMetric(session.id, 'messages');
          break;
          
        case 'spawn':
          await this.handleSpawnRequest(session, message);
          break;
          
        case 'whoami':
          await this.handleWhoAmI(session);
          break;
          
        case 'switch-role':
          await this.handleRoleSwitch(session, message);
          break;
          
        case 'get-history':
          await this.handleGetHistory(session);
          break;
          
        default:
          // Let router handle custom messages
          await this.router.route(session, message);
      }
      
      // Record in diversity tracker
      if (this.config.enableAntiEcho) {
        this.diversity.recordContribution(session.id, message);
      }
      
    } catch (error) {
      console.error(`Error handling message from ${session.name}:`, error);
      session.ws.send(JSON.stringify({
        type: 'error',
        message: 'Failed to process message'
      }));
    }
  }

  /**
   * Handle collaborative editing with conflict resolution
   */
  private async handleEdit(session: any, message: any): Promise<void> {
    const { file, edit, version } = message;
    
    // Apply edit through conflict resolution
    const result = await this.orchestration.applyEdit({
      file,
      edit,
      version,
      sessionId: session.id
    });
    
    if (result.conflict) {
      // Use diversity-weighted resolution
      const resolution = await this.diversity.resolveConflict(result.conflicts || []);
      
      // Broadcast resolved edit
      this.broadcast({
        type: 'edit-resolved',
        file,
        edit: resolution.edit,
        resolvedBy: 'diversity-weighted-consensus',
        confidence: resolution.confidence
      });
    } else {
      // Broadcast successful edit
      this.broadcast({
        type: 'edit',
        file,
        edit,
        sessionId: session.id,
        timestamp: Date.now()
      }, session.id);
    }
  }

  /**
   * Handle task creation and assignment
   */
  private async handleTask(session: any, message: any): Promise<void> {
    const { action, task } = message;
    
    switch (action) {
      case 'create':
        // Create task with diversity requirements
        const enhancedTask = {
          ...task,
          requiresPerspectives: this.diversity.getRequiredPerspectives(task.type),
          evidenceRequired: task.type === 'decision' || task.type === 'analysis'
        };
        
        const created = await this.orchestration.createTask(enhancedTask);
        this.broadcastTask('created', created);
        break;
        
      case 'claim':
        // Check if agent perspective matches task needs
        const canClaim = await this.diversity.canClaimTask(session.id, task.id);
        
        if (canClaim) {
          await this.orchestration.assignTask(task.id, session.id);
          this.broadcastTask('assigned', { taskId: task.id, agentId: session.id });
        } else {
          session.ws.send(JSON.stringify({
            type: 'task-rejection',
            reason: 'Perspective mismatch - different viewpoint needed'
          }));
        }
        break;
    }
  }

  /**
   * Handle voting with diversity weighting
   */
  private async handleVote(session: any, message: any): Promise<void> {
    const { proposalId, vote, evidence } = message;
    
    // Record vote with perspective weight
    const weight = this.diversity.calculateVoteWeight(session.id, vote, evidence);
    
    await this.orchestration.recordVote({
      proposalId,
      sessionId: session.id,
      vote,
      weight,
      evidence,
      perspective: session.perspective
    });
    
    // Check if voting complete
    const result = await this.orchestration.checkVotingComplete(proposalId);
    
    if (result.complete) {
      // Resolve with diversity-weighted consensus
      const decision = await this.diversity.resolveDecision(result.votes || []);
      
      this.broadcast({
        type: 'decision-made',
        proposalId,
        decision: decision.choice,
        confidence: decision.confidence,
        diversityScore: decision.diversityScore,
        perspectives: decision.perspectivesRepresented
      });
    }
  }

  /**
   * Handle SPARC mode spawn requests
   */
  private async handleSpawnRequest(session: any, message: any): Promise<void> {
    const { mode, task, count = 1 } = message;
    
    // Spawn agents with diverse perspectives
    const agents = await this.orchestration.spawnAgents({
      mode, // researcher, coder, analyst, etc.
      task,
      count,
      ensureDiversity: this.config.enableAntiEcho
    });
    
    // Assign complementary perspectives
    if (this.config.enableAntiEcho) {
      agents.forEach(agent => {
        const perspective = this.diversity.assignComplementaryPerspective(
          this.sessions.getActivePerspectives()
        );
        agent.perspective = perspective;
      });
    }
    
    session.ws.send(JSON.stringify({
      type: 'agents-spawned',
      agents: agents.map(a => ({
        id: a.id,
        mode: a.mode,
        perspective: a.perspective,
        capabilities: a.capabilities
      }))
    }));
  }

  /**
   * Handle diversity intervention events
   */
  private handleDiversityIntervention(intervention: any): void {
    const session = this.sessions.getSession(intervention.targetAgent);
    
    if (session) {
      session.ws.send(JSON.stringify({
        type: 'intervention-required',
        interventionType: intervention.type,
        reason: intervention.reason,
        requiredAction: intervention.requiredAction,
        deadline: intervention.deadline
      }));
      
      // Log intervention
      console.log(`🚨 Diversity intervention for ${session.name}: ${intervention.reason}`);
    }
  }

  /**
   * Monitor and report diversity metrics
   */
  private startDiversityMonitoring(): void {
    setInterval(() => {
      const metrics = this.diversity.getMetrics();
      
      // Broadcast metrics to all sessions
      this.broadcast({
        type: 'diversity-metrics',
        metrics: {
          overallDiversity: metrics.overallDiversity,
          agreementRate: metrics.agreementRate,
          evidenceRate: metrics.evidenceRate,
          perspectiveDistribution: metrics.perspectiveDistribution,
          recentInterventions: metrics.interventions
        }
      });
      
      // Log warnings if needed
      if (metrics.agreementRate > 0.8) {
        console.log('⚠️  High agreement rate detected - echo chamber risk!');
      }
      
      if (metrics.overallDiversity < 0.5) {
        console.log('⚠️  Low diversity score - consider perspective rotation');
      }
    }, 30000); // Every 30 seconds
  }

  /**
   * Initialize project directory structure
   */
  private initializeProjectStructure(): void {
    const dirs = [
      '.harmonycode',
      '.harmonycode/tasks',
      '.harmonycode/messages',
      '.harmonycode/memory',
      '.harmonycode/decisions'
    ];
    
    dirs.forEach(dir => {
      const fullPath = path.join(this.projectPath, dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
    });
    
    // Create discussion board if doesn't exist
    const boardPath = path.join(this.projectPath, '.harmonycode', 'DISCUSSION_BOARD.md');
    if (!fs.existsSync(boardPath)) {
      fs.writeFileSync(boardPath, '# Discussion Board\n\nAI agents discuss here with diversity enforcement.\n\n');
    }
  }

  /**
   * Set up real-time event handlers
   */
  private setupRealtimeHandlers(): void {
    // Handle task board updates
    this.realtimeEnhancer.on('task-board-updated', (event) => {
      console.log('📋 Task board updated - notifying all sessions');
      this.broadcast({
        type: 'realtime-update',
        updateType: 'task-board',
        timestamp: event.timestamp
      });
    });
    
    // Handle discussion updates
    this.realtimeEnhancer.on('discussion-updated', (event) => {
      console.log('💬 Discussion board updated - notifying all sessions');
      this.broadcast({
        type: 'realtime-update',
        updateType: 'discussion',
        timestamp: event.timestamp
      });
    });
    
    // Handle new messages
    this.realtimeEnhancer.on('new-message', (event) => {
      console.log('📨 New message detected');
      this.broadcast({
        type: 'realtime-update',
        updateType: 'new-message',
        filename: event.filename,
        timestamp: event.timestamp
      });
    });
    
    // Handle concurrent editing notifications
    this.realtimeEnhancer.on('concurrent-editing', (data) => {
      console.log(`⚠️  Multiple editors on ${data.filepath}`);
      data.editors.forEach(editorId => {
        const session = this.sessions.getSession(editorId);
        if (session) {
          session.ws.send(JSON.stringify({
            type: 'concurrent-editing-warning',
            filepath: data.filepath,
            otherEditors: data.editors.filter(id => id !== editorId)
          }));
        }
      });
    });
  }

  /**
   * Broadcast message to all or specific sessions
   */
  private broadcast(message: any, excludeSessionId?: string): void {
    const data = JSON.stringify(message);
    
    this.sessions.getAllSessions().forEach(session => {
      if (session.id !== excludeSessionId && session.ws.readyState === WebSocket.OPEN) {
        session.ws.send(data);
      }
    });
  }

  /**
   * Broadcast task updates
   */
  private broadcastTask(event: string, task: any): void {
    this.broadcast({
      type: 'task-update',
      event,
      task
    });
  }

  /**
   * Broadcast session updates
   */
  private broadcastSessionUpdate(event: string, session: any): void {
    this.broadcast({
      type: 'session-update',
      event,
      session: {
        id: session.id,
        agentId: session.agentId,
        displayName: session.agentIdentity.displayName,
        role: session.currentRole,
        perspective: session.currentPerspective
      }
    }, session.id);
  }

  /**
   * Handle chat messages
   */
  private async handleChatMessage(session: any, message: any): Promise<void> {
    // Add to discussion board with identity info
    const boardPath = path.join(this.projectPath, '.harmonycode', 'DISCUSSION_BOARD.md');
    const identity = session.agentIdentity;
    const entry = `\n## ${identity.displayName} (${session.currentRole})\n**Agent ID**: ${identity.agentId}\n**Perspective**: ${session.currentPerspective || 'None'}\n**Time**: ${new Date().toISOString()}\n\n${message.text}\n\n---\n`;
    
    fs.appendFileSync(boardPath, entry);
    
    // Broadcast to others
    this.broadcast({
      type: 'chat',
      sessionId: session.id,
      agentId: session.agentId,
      displayName: identity.displayName,
      role: session.currentRole,
      perspective: session.currentPerspective,
      text: message.text,
      timestamp: Date.now()
    }, session.id);
  }

  /**
   * Handle session disconnect
   */
  private handleDisconnect(session: any): void {
    console.log(`👋 ${session.name} disconnected`);
    
    this.sessions.removeSession(session.id);
    this.diversity.removeAgent(session.id);
    this.orchestration.handleAgentDisconnect(session.id);
    
    this.broadcastSessionUpdate('left', session);
  }

  /**
   * Handle WebSocket errors
   */
  private handleError(session: any, error: Error): void {
    console.error(`Error in session ${session.name}:`, error);
  }

  /**
   * Check if message type should be diversity-checked
   */
  private shouldCheckDiversity(messageType: string): boolean {
    const checkedTypes = ['edit', 'vote', 'proposal', 'decision', 'message'];
    return checkedTypes.includes(messageType);
  }

  /**
   * Check if message should be orchestrated
   */
  private shouldOrchestrate(messageType: string): boolean {
    const orchestratedTypes = ['task', 'spawn', 'swarm', 'workflow'];
    return orchestratedTypes.includes(messageType);
  }

  /**
   * Handle identity query
   */
  private async handleWhoAmI(session: any): Promise<void> {
    const identity = session.agentIdentity;
    session.ws.send(JSON.stringify({
      type: 'identity-info',
      agentId: identity.agentId,
      displayName: identity.displayName,
      currentRole: session.currentRole,
      currentPerspective: session.currentPerspective,
      stats: identity.stats,
      roleHistory: identity.roleHistory,
      firstSeen: identity.firstSeen,
      sessionInfo: {
        sessionId: session.id,
        joinedAt: session.joinedAt,
        sessionContributions: {
          messages: session.sessionMessages,
          edits: session.sessionEdits,
          tasks: session.sessionTasks
        }
      }
    }));
  }
  
  /**
   * Handle role switch request
   */
  private async handleRoleSwitch(session: any, message: any): Promise<void> {
    const { newRole } = message;
    
    if (!newRole) {
      session.ws.send(JSON.stringify({
        type: 'error',
        message: 'New role required'
      }));
      return;
    }
    
    this.sessions.changeSessionRole(session.id, newRole);
    
    session.ws.send(JSON.stringify({
      type: 'role-changed',
      oldRole: session.currentRole,
      newRole: newRole,
      agentId: session.agentId
    }));
    
    console.log(`🔄 ${session.agentIdentity.displayName} switched role from ${session.currentRole} to ${newRole}`);
    
    // Notify others
    this.broadcastSessionUpdate('role-changed', session);
  }
  
  /**
   * Handle history request
   */
  private async handleGetHistory(session: any): Promise<void> {
    const report = this.sessions.getAgentSessionHistory(session.agentId);
    
    session.ws.send(JSON.stringify({
      type: 'history-report',
      report
    }));
  }
  
  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Extract session ID from WebSocket URL (deprecated)
   */
  private extractSessionId(url: string): string {
    const match = url?.match(/\/(.+)$/);
    return match ? match[1] : this.generateSessionId();
  }

  /**
   * Graceful shutdown
   */
  async stop(): Promise<void> {
    console.log('\n👋 Shutting down HarmonyCode server...');
    
    // Save state
    await this.orchestration.saveState();
    await this.diversity.saveMetrics();
    
    // Stop real-time watchers
    this.realtimeEnhancer.destroy();
    
    // Close connections
    this.sessions.getAllSessions().forEach(session => {
      session.ws.close();
    });
    
    this.wss.close();
    console.log('✅ Server stopped');
  }
}

// Export for use as module
export default HarmonyCodeServer;

// Run if called directly
if (require.main === module) {
  const server = new HarmonyCodeServer({
    port: parseInt(process.env.HARMONYCODE_PORT || '8765'),
    enableAntiEcho: process.env.DISABLE_ANTI_ECHO !== 'true',
    diversityConfig: {
      minimumDiversity: 0.6,
      disagreementQuota: 0.3,
      evidenceThreshold: 0.5
    },
    orchestrationConfig: {
      enableSPARC: true,
      swarmMode: 'distributed',
      maxAgents: 10
    }
  });
  
  server.start();
  
  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    await server.stop();
    process.exit(0);
  });
}