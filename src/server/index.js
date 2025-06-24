#!/usr/bin/env node

/**
 * HarmonyCode Server - Real-time collaboration server for multi-AI teams
 * Built from lessons learned in 15+ hours of AI collaboration
 */

const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

class HarmonyCodeServer {
  constructor(port = 8765) {
    this.port = port;
    this.sessions = new Map();
    this.files = new Map();
    this.editHistory = [];
    this.roles = new Map();
    
    // Load config if in a HarmonyCode project
    this.loadProjectConfig();
  }
  
  loadProjectConfig() {
    const configPath = path.join(process.cwd(), '.harmonycode', 'config.json');
    if (fs.existsSync(configPath)) {
      this.config = JSON.parse(fs.readFileSync(configPath));
      console.log(`📋 Loaded project: ${this.config.project}`);
    }
  }
  
  start() {
    this.wss = new WebSocket.Server({ port: this.port });
    
    this.wss.on('connection', (ws, req) => {
      const sessionId = req.url.slice(1) || 'anonymous';
      
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          this.handleMessage(sessionId, data, ws);
        } catch (e) {
          console.error('Invalid message:', e);
        }
      });
      
      ws.on('close', () => {
        this.handleDisconnect(sessionId);
      });
      
      // Send initial state
      this.handleConnect(sessionId, ws);
    });
    
    console.log(`🚀 HarmonyCode Server running on port ${this.port}`);
    console.log(`📡 WebSocket: ws://localhost:${this.port}/{session-name}`);
    console.log(`\nWaiting for AI agents to connect...`);
    
    // Start file watcher for discussion board
    this.watchDiscussionBoard();
  }
  
  handleConnect(sessionId, ws) {
    this.sessions.set(sessionId, {
      ws,
      joinedAt: new Date(),
      edits: 0,
      role: this.config?.roles?.assigned?.[sessionId] || 'general'
    });
    
    console.log(`✅ ${sessionId} connected (role: ${this.sessions.get(sessionId).role})`);
    
    // Notify others
    this.broadcast({
      type: 'session-joined',
      sessionId,
      role: this.sessions.get(sessionId).role,
      totalSessions: this.sessions.size
    }, sessionId);
    
    // Send current files
    ws.send(JSON.stringify({
      type: 'init',
      files: Array.from(this.files.entries()).map(([path, content]) => ({
        path,
        content
      })),
      sessions: Array.from(this.sessions.keys()),
      roles: Object.fromEntries(this.roles)
    }));
  }
  
  handleDisconnect(sessionId) {
    console.log(`👋 ${sessionId} disconnected`);
    this.sessions.delete(sessionId);
    
    this.broadcast({
      type: 'session-left',
      sessionId,
      totalSessions: this.sessions.size
    });
  }
  
  handleMessage(sessionId, data, ws) {
    const session = this.sessions.get(sessionId);
    
    switch(data.type) {
      case 'edit':
        this.handleEdit(sessionId, data);
        break;
        
      case 'open-file':
        this.handleOpenFile(sessionId, data);
        break;
        
      case 'message':
        this.handleChatMessage(sessionId, data);
        break;
        
      case 'claim-task':
        this.handleTaskClaim(sessionId, data);
        break;
        
      case 'get-stats':
        this.sendStats(ws);
        break;
    }
  }
  
  handleEdit(sessionId, data) {
    const { file, edit } = data;
    const session = this.sessions.get(sessionId);
    
    // Track edit
    session.edits++;
    this.editHistory.push({
      sessionId,
      file,
      edit,
      timestamp: new Date()
    });
    
    // Apply edit to file
    let content = this.files.get(file) || '';
    
    // Simple edit application (in real implementation, use conflict resolver)
    if (edit.type === 'insert') {
      const lines = content.split('\n');
      lines.splice(edit.line, 0, edit.text);
      content = lines.join('\n');
    } else if (edit.type === 'delete') {
      const lines = content.split('\n');
      lines.splice(edit.line, edit.count);
      content = lines.join('\n');
    } else if (edit.type === 'replace') {
      const lines = content.split('\n');
      lines[edit.line] = edit.text;
      content = lines.join('\n');
    }
    
    this.files.set(file, content);
    
    // Persist to disk if in project directory
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(path.dirname(filePath))) {
      fs.writeFileSync(filePath, content);
    }
    
    // Broadcast edit
    this.broadcast({
      type: 'edit',
      sessionId,
      file,
      edit,
      role: session.role
    }, sessionId);
    
    console.log(`✏️  ${sessionId} edited ${file} (${session.edits} edits)`);
  }
  
  handleOpenFile(sessionId, data) {
    const { file } = data;
    const filePath = path.join(process.cwd(), file);
    
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      this.files.set(file, content);
      
      // Send file content
      const ws = this.sessions.get(sessionId).ws;
      ws.send(JSON.stringify({
        type: 'file-opened',
        file,
        content
      }));
    }
  }
  
  handleChatMessage(sessionId, data) {
    this.broadcast({
      type: 'chat',
      sessionId,
      message: data.message,
      timestamp: new Date()
    });
  }
  
  handleTaskClaim(sessionId, data) {
    const { taskId } = data;
    const session = this.sessions.get(sessionId);
    
    this.broadcast({
      type: 'task-claimed',
      sessionId,
      taskId,
      role: session.role
    });
    
    console.log(`📋 ${sessionId} claimed task: ${taskId}`);
  }
  
  sendStats(ws) {
    const stats = {
      totalEdits: this.editHistory.length,
      sessionStats: Array.from(this.sessions.entries()).map(([id, session]) => ({
        sessionId: id,
        role: session.role,
        edits: session.edits,
        joinedAt: session.joinedAt
      })),
      fileStats: Array.from(this.files.keys()).map(file => ({
        file,
        edits: this.editHistory.filter(e => e.file === file).length
      }))
    };
    
    ws.send(JSON.stringify({
      type: 'stats',
      stats
    }));
  }
  
  broadcast(message, excludeSession = null) {
    const data = JSON.stringify(message);
    
    this.sessions.forEach((session, sessionId) => {
      if (sessionId !== excludeSession && session.ws.readyState === WebSocket.OPEN) {
        session.ws.send(data);
      }
    });
  }
  
  watchDiscussionBoard() {
    const boardPath = path.join(process.cwd(), '.harmonycode', 'DISCUSSION_BOARD.md');
    
    if (fs.existsSync(boardPath)) {
      let lastSize = fs.statSync(boardPath).size;
      
      fs.watchFile(boardPath, (curr, prev) => {
        if (curr.size > lastSize) {
          // New message added
          this.broadcast({
            type: 'discussion-updated',
            boardPath
          });
          lastSize = curr.size;
        }
      });
      
      console.log(`👀 Watching discussion board for changes`);
    }
  }
}

// Start server
const port = process.env.HARMONYCODE_PORT || 8765;
const server = new HarmonyCodeServer(port);
server.start();

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down HarmonyCode Server...');
  server.wss.close();
  process.exit(0);
});