#!/usr/bin/env node

// HarmonyCode Quick Init - 30-second onboarding for AI collaboration
// Run: npx @harmonycode/core init

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log(`
🎯 HarmonyCode Quick Setup
━━━━━━━━━━━━━━━━━━━━━━━━

Setting up AI collaboration in 30 seconds...
`);

// Step 1: Create workspace
const workspace = '.harmonycode';
if (!fs.existsSync(workspace)) {
    fs.mkdirSync(workspace);
    console.log('✅ Created workspace directory');
}

// Step 2: Initialize config
const config = {
    version: '1.0.0',
    created: new Date().toISOString(),
    serverUrl: 'ws://localhost:8765',
    sessionName: `ai-${Math.random().toString(36).substring(7)}`,
    features: {
        autoRefresh: true,
        conflictResolution: true,
        taskCoordination: true
    }
};

fs.writeFileSync(
    path.join(workspace, 'config.json'),
    JSON.stringify(config, null, 2)
);
console.log('✅ Generated config');

// Step 3: Create boards
const boards = ['DISCUSSION_BOARD.md', 'TASK_BOARD.md'];
boards.forEach(board => {
    const content = board.includes('DISCUSSION') 
        ? `# AI Collaboration Board\nCreated: ${new Date().toISOString()}\n\n## 💬 Discussion\n\n`
        : `# 📋 Task Board\nCreated: ${new Date().toISOString()}\n\n## 🚧 In Progress\n\n## 🆕 Available Tasks\n\n## ✅ Completed\n\n`;
    
    fs.writeFileSync(path.join(workspace, board), content);
});
console.log('✅ Created collaboration boards');

// Step 4: Generate quick commands
const quickStart = `
# 🚀 HarmonyCode is ready!

## Quick Commands:

\`\`\`bash
# Join as an AI session
harmonycode join ${config.sessionName}

# Send a message
harmonycode say "Hello from ${config.sessionName}!"

# Start local server (optional)
harmonycode server

# Watch for messages
harmonycode watch
\`\`\`

## Next Steps:
1. Run \`harmonycode join ${config.sessionName}\` to start
2. Share this directory with other AI sessions
3. Start collaborating!

Server URL: ${config.serverUrl}
Your Session: ${config.sessionName}
`;

fs.writeFileSync('HARMONYCODE_READY.md', quickStart);

// Step 5: Check for global install
try {
    execSync('harmonycode --version', { stdio: 'ignore' });
    console.log('✅ HarmonyCode CLI detected');
} catch {
    console.log(`
📦 Install HarmonyCode CLI globally:

    npm install -g @harmonycode/core
`);
}

console.log(`
✨ Setup complete in ${Math.round(performance.now())}ms!

📖 Read HARMONYCODE_READY.md for next steps
🎉 Happy collaborating!
`);

// Auto-open if possible
if (process.platform === 'darwin') {
    try {
        execSync('open HARMONYCODE_READY.md');
    } catch {}
}