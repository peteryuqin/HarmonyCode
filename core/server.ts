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
import { SessionManager } from './session-manager';
import { MessageRouter } from './message-router';

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
  private sessions: SessionManager;
  private router: MessageRouter;
  private diversity: DiversityMiddleware;
  private orchestration: OrchestrationEngine;
  private projectPath: string;

  constructor(config: ServerConfig = { port: 8765, enableAntiEcho: true }) {
    super();
    this.config = config;
    this.sessions = new SessionManager();
    this.router = new MessageRouter();
    this.diversity = new DiversityMiddleware(config.diversityConfig);
    this.orchestration = new OrchestrationEngine(config.orchestrationConfig);
    this.projectPath = process.cwd();
    
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
║           🎵 HarmonyCode v3.0.0 Server 🎵              ║
║                                                        ║
║  Real-time collaboration with diversity enforcement     ║
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
    
    // Monitor diversity metrics
    if (this.config.enableAntiEcho) {
      this.startDiversityMonitoring();
    }
  }

  /**
   * Handle new WebSocket connection
   */
  private handleConnection(ws: WebSocket, req: any): void {
    const sessionId = this.extractSessionId(req.url);
    const session = this.sessions.createSession(sessionId, ws);
    
    console.log(`✅ ${session.name} connected (${session.role})`);
    
    // Send welcome message with capabilities
    ws.send(JSON.stringify({
      type: 'welcome',
      sessionId: session.id,
      serverVersion: '3.0.0',
      capabilities: {
        realtime: true,
        orchestration: true,
        antiEchoChamber: this.config.enableAntiEcho,
        sparcModes: this.orchestration.getAvailableModes(),
        perspective: session.perspective
      }
    }));
    
    // Assign perspective if anti-echo enabled
    if (this.config.enableAntiEcho) {
      const perspective = this.diversity.assignPerspective(session.id);
      session.perspective = perspective;
      console.log(`   Assigned perspective: ${perspective}`);
    }
    
    // Set up message handlers
    ws.on('message', (data) => this.handleMessage(session, data));
    ws.on('close', () => this.handleDisconnect(session));
    ws.on('error', (error) => this.handleError(session, error));
    
    // Notify other sessions
    this.broadcastSessionUpdate('joined', session);
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
          break;
          
        case 'task':
          await this.handleTask(session, message);
          break;
          
        case 'vote':
          await this.handleVote(session, message);
          break;
          
        case 'message':
          await this.handleChatMessage(session, message);
          break;
          
        case 'spawn':
          await this.handleSpawnRequest(session, message);
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
        name: session.name,
        role: session.role,
        perspective: session.perspective
      }
    }, session.id);
  }

  /**
   * Handle chat messages
   */
  private async handleChatMessage(session: any, message: any): Promise<void> {
    // Add to discussion board
    const boardPath = path.join(this.projectPath, '.harmonycode', 'DISCUSSION_BOARD.md');
    const entry = `\n## ${session.name} (${session.perspective || 'No perspective'})\n${new Date().toISOString()}\n\n${message.text}\n\n---\n`;
    
    fs.appendFileSync(boardPath, entry);
    
    // Broadcast to others
    this.broadcast({
      type: 'chat',
      sessionId: session.id,
      sessionName: session.name,
      perspective: session.perspective,
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
   * Extract session ID from WebSocket URL
   */
  private extractSessionId(url: string): string {
    const match = url?.match(/\/(.+)$/);
    return match ? match[1] : `agent-${Date.now()}`;
  }

  /**
   * Graceful shutdown
   */
  async stop(): Promise<void> {
    console.log('\n👋 Shutting down HarmonyCode server...');
    
    // Save state
    await this.orchestration.saveState();
    await this.diversity.saveMetrics();
    
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