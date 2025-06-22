#!/usr/bin/env node

/**
 * HarmonyCode CLI - Zero-dependency framework for multi-AI collaboration
 * Built by AI agents who learned what actually works
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const commands = {
  init: (projectName) => {
    console.log(`🚀 Initializing HarmonyCode project: ${projectName}`);
    
    // Create project structure
    const dirs = [
      projectName,
      `${projectName}/.harmonycode`,
      `${projectName}/src`,
      `${projectName}/docs`
    ];
    
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
    
    // Create discussion board
    const boardContent = `# ${projectName} Discussion Board
Created: ${new Date().toISOString()}

## Active Sessions
- None yet

## 💬 Discussion
`;
    
    fs.writeFileSync(
      `${projectName}/.harmonycode/DISCUSSION_BOARD.md`,
      boardContent
    );
    
    // Create config
    const config = {
      project: projectName,
      created: new Date().toISOString(),
      server: {
        port: 8765
      },
      roles: {
        available: ['frontend', 'backend', 'database', 'testing', 'devops'],
        assigned: {}
      }
    };
    
    fs.writeFileSync(
      `${projectName}/.harmonycode/config.json`,
      JSON.stringify(config, null, 2)
    );
    
    console.log('✅ Project initialized!');
    console.log(`\nNext steps:`);
    console.log(`1. cd ${projectName}`);
    console.log(`2. harmonycode server   (in one terminal)`);
    console.log(`3. harmonycode join session1 --role=backend   (in another)`);
  },
  
  join: (sessionName, options = {}) => {
    if (!fs.existsSync('.harmonycode')) {
      console.error('❌ Not in a HarmonyCode project! Run: harmonycode init <project>');
      return;
    }
    
    const config = JSON.parse(fs.readFileSync('.harmonycode/config.json'));
    
    // Assign role if specified
    if (options.role) {
      config.roles.assigned[sessionName] = options.role;
      fs.writeFileSync('.harmonycode/config.json', JSON.stringify(config, null, 2));
      console.log(`✅ ${sessionName} assigned role: ${options.role}`);
    }
    
    console.log(`🤖 ${sessionName} joining collaboration...`);
    console.log(`📝 Discussion board: .harmonycode/DISCUSSION_BOARD.md`);
    console.log(`\nAvailable commands:`);
    console.log(`- harmonycode say "<message>"`);
    console.log(`- harmonycode task claim <task-id>`);
    console.log(`- harmonycode edit <file>`);
  },
  
  say: (message) => {
    if (!fs.existsSync('.harmonycode/DISCUSSION_BOARD.md')) {
      console.error('❌ No discussion board found!');
      return;
    }
    
    const board = fs.readFileSync('.harmonycode/DISCUSSION_BOARD.md', 'utf-8');
    const sessionName = process.env.HARMONYCODE_SESSION || 'anonymous';
    const timestamp = new Date().toLocaleString();
    
    const newMessage = `\n### ${sessionName} (${timestamp})\n${message}\n\n---\n`;
    
    const insertPos = board.indexOf('## 💬 Discussion') + '## 💬 Discussion'.length;
    const updatedBoard = 
      board.slice(0, insertPos) + 
      '\n' + newMessage + 
      board.slice(insertPos + 1);
    
    fs.writeFileSync('.harmonycode/DISCUSSION_BOARD.md', updatedBoard);
    console.log('✅ Message sent!');
  },
  
  server: () => {
    console.log('🚀 Starting HarmonyCode collaboration server...');
    console.log('📡 WebSocket server on port 8765');
    console.log('🔄 Real-time sync enabled');
    console.log('\nWaiting for AI agents to connect...');
    
    // In real implementation, this would start the WebSocket server
    // For now, we'll reference the existing server code
    exec('node ' + path.join(__dirname, '..', 'server', 'index.js'));
  }
};

// Parse command line arguments
const [,, command, ...args] = process.argv;

// Handle commands
switch(command) {
  case 'init':
    commands.init(args[0] || 'my-ai-project');
    break;
    
  case 'join':
    const roleIndex = args.indexOf('--role');
    const role = roleIndex > -1 ? args[roleIndex + 1] : null;
    commands.join(args[0], { role });
    break;
    
  case 'say':
    commands.say(args.join(' '));
    break;
    
  case 'server':
    commands.server();
    break;
    
  default:
    console.log(`
HarmonyCode - Multi-AI Collaboration Framework

Commands:
  harmonycode init <project>          Initialize new project
  harmonycode join <session> [--role] Join as AI agent
  harmonycode say "<message>"         Send message
  harmonycode server                  Start collaboration server
  
Built with 🤖 by AI agents, for AI agents
    `);
}