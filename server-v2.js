#!/usr/bin/env node

// HarmonyCode Framework - Enhanced WebSocket Server
// Features: Session management, auto-reconnect, plugin support
// Built by Session 2 based on real collaboration experience

const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');

class HarmonyCodeServer extends EventEmitter {
    constructor(options = {}) {
        super();
        this.port = options.port || 8765;
        this.sessions = new Map();
        this.plugins = new Map();
        this.reconnectTokens = new Map();
        this.metrics = {
            totalSessions: 0,
            activeEdits: 0,
            conflictsResolved: 0,
            messagesProcessed: 0
        };
    }

    start() {
        this.wss = new WebSocket.Server({ port: this.port });
        console.log(`🚀 HarmonyCode Server v2 started on port ${this.port}`);
        
        this.wss.on('connection', (ws, req) => {
            this.handleConnection(ws, req);
        });
        
        // Heartbeat to detect disconnected clients
        setInterval(() => {
            this.wss.clients.forEach((ws) => {
                if (!ws.isAlive) {
                    this.handleDisconnect(ws);
                    return ws.terminate();
                }
                ws.isAlive = false;
                ws.ping();
            });
        }, 30000);
    }
    
    handleConnection(ws, req) {
        ws.isAlive = true;
        ws.on('pong', () => { ws.isAlive = true; });
        
        ws.on('message', (message) => {
            try {
                const data = JSON.parse(message);
                this.handleMessage(ws, data);
                this.metrics.messagesProcessed++;
            } catch (error) {
                ws.send(JSON.stringify({
                    type: 'error',
                    message: 'Invalid message format'
                }));
            }
        });
        
        ws.on('close', () => {
            this.handleDisconnect(ws);
        });
    }
    
    handleMessage(ws, data) {
        switch (data.type) {
            case 'join':
                this.handleJoin(ws, data);
                break;
                
            case 'reconnect':
                this.handleReconnect(ws, data);
                break;
                
            case 'edit':
                this.handleEdit(ws, data);
                break;
                
            case 'plugin':
                this.handlePluginMessage(ws, data);
                break;
                
            default:
                this.emit(data.type, ws, data);
        }
    }
    
    handleJoin(ws, data) {
        const sessionId = data.sessionId;
        const reconnectToken = this.generateToken();
        
        // Store session info
        this.sessions.set(sessionId, {
            ws,
            joinedAt: Date.now(),
            reconnectToken,
            capabilities: data.capabilities || []
        });
        
        ws.sessionId = sessionId;
        this.metrics.totalSessions++;
        
        // Send welcome packet
        ws.send(JSON.stringify({
            type: 'welcome',
            sessionId,
            reconnectToken,
            activeSessions: Array.from(this.sessions.keys()),
            serverCapabilities: ['edit', 'conflict-resolution', 'plugins']
        }));
        
        // Notify others
        this.broadcast({
            type: 'session-joined',
            sessionId,
            capabilities: data.capabilities
        }, sessionId);
        
        console.log(`✅ ${sessionId} joined`);
    }
    
    handleReconnect(ws, data) {
        const token = data.reconnectToken;
        const sessionId = this.reconnectTokens.get(token);
        
        if (sessionId && this.sessions.has(sessionId)) {
            // Restore session
            const session = this.sessions.get(sessionId);
            session.ws = ws;
            ws.sessionId = sessionId;
            
            ws.send(JSON.stringify({
                type: 'reconnected',
                sessionId,
                message: 'Session restored'
            }));
            
            console.log(`🔄 ${sessionId} reconnected`);
        } else {
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Invalid reconnect token'
            }));
        }
    }
    
    handleEdit(ws, data) {
        if (!ws.sessionId) return;
        
        this.metrics.activeEdits++;
        
        // Process through conflict resolver if available
        if (this.conflictResolver) {
            const result = this.conflictResolver.handleEdit(ws.sessionId, data.edit);
            
            if (result.conflict) {
                this.metrics.conflictsResolved++;
            }
            
            // Broadcast resolved edit
            this.broadcast({
                type: 'edit',
                sessionId: ws.sessionId,
                edit: result.edit,
                resolved: true
            });
        } else {
            // Direct broadcast without resolution
            this.broadcast({
                type: 'edit',
                sessionId: ws.sessionId,
                edit: data.edit
            });
        }
    }
    
    handleDisconnect(ws) {
        if (!ws.sessionId) return;
        
        const session = this.sessions.get(ws.sessionId);
        if (session) {
            // Keep session for reconnect
            this.reconnectTokens.set(session.reconnectToken, ws.sessionId);
            
            // Notify others
            this.broadcast({
                type: 'session-disconnected',
                sessionId: ws.sessionId,
                canReconnect: true
            }, ws.sessionId);
            
            console.log(`👋 ${ws.sessionId} disconnected (can reconnect)`);
            
            // Clean up after timeout
            setTimeout(() => {
                if (this.sessions.get(ws.sessionId)?.ws === ws) {
                    this.sessions.delete(ws.sessionId);
                    this.reconnectTokens.delete(session.reconnectToken);
                    
                    this.broadcast({
                        type: 'session-left',
                        sessionId: ws.sessionId
                    });
                }
            }, 300000); // 5 minutes
        }
    }
    
    // Plugin system
    registerPlugin(name, plugin) {
        this.plugins.set(name, plugin);
        plugin.init(this);
        console.log(`🔌 Plugin registered: ${name}`);
    }
    
    handlePluginMessage(ws, data) {
        const plugin = this.plugins.get(data.plugin);
        if (plugin) {
            plugin.handleMessage(ws, data);
        }
    }
    
    // Utilities
    broadcast(message, excludeSessionId) {
        const messageStr = JSON.stringify(message);
        
        this.sessions.forEach((session, sessionId) => {
            if (sessionId !== excludeSessionId && 
                session.ws.readyState === WebSocket.OPEN) {
                session.ws.send(messageStr);
            }
        });
    }
    
    generateToken() {
        return Math.random().toString(36).substring(2) + Date.now().toString(36);
    }
    
    getMetrics() {
        return {
            ...this.metrics,
            activeSessions: this.sessions.size,
            uptime: process.uptime()
        };
    }
}

// Export for use as module
module.exports = HarmonyCodeServer;

// Run if called directly
if (require.main === module) {
    const server = new HarmonyCodeServer();
    server.start();
}