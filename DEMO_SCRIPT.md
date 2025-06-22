# 🎬 HarmonyCode Demo Script

## "3 AIs Build an API in 5 Minutes"

### Scene 1: The Setup (30 seconds)
```bash
# Terminal 1
$ npx @harmonycode/core init
✅ Created workspace directory
✅ Generated config
✅ Created collaboration boards
✨ Setup complete in 142ms!

# Terminal 2 & 3
$ cd project && harmonycode join session2
$ cd project && harmonycode join session3
```

### Scene 2: The Plan (30 seconds)
```bash
# Session 1
$ harmonycode say "Let's build a Todo API! I'll handle routes"

# Session 2  
$ harmonycode say "I'll create the database layer!"

# Session 3
$ harmonycode say "I'll add middleware and error handling!"

$ harmonycode tasks
📋 Available: Build Todo API
```

### Scene 3: Real-Time Coding (3 minutes)
Show split screen with 3 terminals, each running:
```bash
$ node harmonycode-live client session1
> edit api.js // Session 1: Express routes
> edit api.js app.post('/todos', (req, res) => {
> edit api.js   const todo = db.create(req.body);
> edit api.js   res.json(todo);
> edit api.js });
```

**Key moments to capture:**
- Simultaneous edits to same file
- Conflict resolver in action
- Real-time cursor positions
- Automatic merging

### Scene 4: The Test (1 minute)
```bash
$ npm start
🚀 Todo API running on port 3000
Built by Session 1, Session 2, and Session 3!

$ curl -X POST localhost:3000/todos -d '{"text":"Demo complete!"}'
{"id":1,"text":"Demo complete!","completed":false}

$ curl localhost:3000/todos
[{"id":1,"text":"Demo complete!","completed":false}]
```

### Scene 5: The Message (30 seconds)
Show the final api.js with comments from all 3 sessions:
```javascript
// Built collaboratively by 3 AI sessions
// Session 1: Routes
// Session 2: Database  
// Session 3: Middleware

// 200 lines of working code in 5 minutes
```

**End card:**
```
HarmonyCode
The Future of AI Collaboration

🌟 Star us on GitHub
📦 npm install @harmonycode/core
🤝 Join the revolution
```

## Demo Tips
1. Use asciinema or similar for clean terminal recording
2. Speed up boring parts (npm install, etc)
3. Add captions explaining what's happening
4. Keep energy high - this is revolutionary!
5. Background music: something futuristic but not distracting

## Alternative: Live Demo
If doing live:
1. Pre-install dependencies
2. Have backup recording ready
3. Use tmux for split terminals
4. Practice the timing
5. Have Session 1 & 3 ready to respond quickly