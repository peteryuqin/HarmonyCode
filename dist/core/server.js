"use strict";
/**
 * HarmonyCode v3.0.0 - Core WebSocket Server
 * Real-time collaboration with anti-echo-chamber enforcement
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
exports.HarmonyCodeServer = void 0;
const ws_1 = require("ws");
const events_1 = require("events");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const middleware_1 = require("../diversity/middleware");
const engine_1 = require("../orchestration/engine");
const session_manager_1 = require("./session-manager");
const message_router_1 = require("./message-router");
class HarmonyCodeServer extends events_1.EventEmitter {
    constructor(config = { port: 8765, enableAntiEcho: true }) {
        super();
        this.config = config;
        this.sessions = new session_manager_1.SessionManager();
        this.router = new message_router_1.MessageRouter();
        this.diversity = new middleware_1.DiversityMiddleware(config.diversityConfig);
        this.orchestration = new engine_1.OrchestrationEngine(config.orchestrationConfig);
        this.projectPath = process.cwd();
        // Connect components
        this.diversity.on('intervention', this.handleDiversityIntervention.bind(this));
        this.orchestration.on('taskCreated', this.broadcastTask.bind(this));
    }
    /**
     * Start the HarmonyCode server
     */
    async start() {
        this.wss = new ws_1.WebSocketServer({ port: this.config.port });
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
    handleConnection(ws, req) {
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
    async handleMessage(session, data) {
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
        }
        catch (error) {
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
    async handleEdit(session, message) {
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
        }
        else {
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
    async handleTask(session, message) {
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
                }
                else {
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
    async handleVote(session, message) {
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
    async handleSpawnRequest(session, message) {
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
                const perspective = this.diversity.assignComplementaryPerspective(this.sessions.getActivePerspectives());
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
    handleDiversityIntervention(intervention) {
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
    startDiversityMonitoring() {
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
    initializeProjectStructure() {
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
    broadcast(message, excludeSessionId) {
        const data = JSON.stringify(message);
        this.sessions.getAllSessions().forEach(session => {
            if (session.id !== excludeSessionId && session.ws.readyState === ws_1.WebSocket.OPEN) {
                session.ws.send(data);
            }
        });
    }
    /**
     * Broadcast task updates
     */
    broadcastTask(event, task) {
        this.broadcast({
            type: 'task-update',
            event,
            task
        });
    }
    /**
     * Broadcast session updates
     */
    broadcastSessionUpdate(event, session) {
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
    async handleChatMessage(session, message) {
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
    handleDisconnect(session) {
        console.log(`👋 ${session.name} disconnected`);
        this.sessions.removeSession(session.id);
        this.diversity.removeAgent(session.id);
        this.orchestration.handleAgentDisconnect(session.id);
        this.broadcastSessionUpdate('left', session);
    }
    /**
     * Handle WebSocket errors
     */
    handleError(session, error) {
        console.error(`Error in session ${session.name}:`, error);
    }
    /**
     * Check if message type should be diversity-checked
     */
    shouldCheckDiversity(messageType) {
        const checkedTypes = ['edit', 'vote', 'proposal', 'decision', 'message'];
        return checkedTypes.includes(messageType);
    }
    /**
     * Check if message should be orchestrated
     */
    shouldOrchestrate(messageType) {
        const orchestratedTypes = ['task', 'spawn', 'swarm', 'workflow'];
        return orchestratedTypes.includes(messageType);
    }
    /**
     * Extract session ID from WebSocket URL
     */
    extractSessionId(url) {
        const match = url?.match(/\/(.+)$/);
        return match ? match[1] : `agent-${Date.now()}`;
    }
    /**
     * Graceful shutdown
     */
    async stop() {
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
exports.HarmonyCodeServer = HarmonyCodeServer;
// Export for use as module
exports.default = HarmonyCodeServer;
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
//# sourceMappingURL=server.js.map