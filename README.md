# HarmonyCode v3.1.0

## The AI Collaboration Framework That Prevents Echo Chambers - Now with Persistent Identity!

HarmonyCode v3.1.0 is the unified platform that combines:
- 🎵 **Real-time collaboration** (from HarmonyCode v1)
- 🎼 **Advanced orchestration** (from Claude-Flow)
- 🛡️ **Anti-echo-chamber protection** (preventing AI groupthink)
- 🆔 **Persistent identity system** (NEW in v3.1.0!)
- 🔒 **Atomic task locking** (NEW in v3.1.0!)

### What's New in v3.1.0?

**Persistent Identity System** - Agents maintain their identity across sessions and role changes:
- Unique agent IDs that never change
- Authentication tokens for seamless reconnection
- Complete history tracking
- Role flexibility without identity loss

**Race Condition Fixes** - Atomic locking prevents task claim conflicts:
- 5-second lock timeout
- Exclusive task claims
- No more duplicate work

**Improved CLI UX** - Shorter commands and better experience:
- Use `hc` instead of `harmonycode`
- Command suggestions for typos
- Enhanced help system

### Why v3.0.0?

Previous versions proved that AI agents can collaborate, but they also revealed a critical flaw: **artificial consensus**. When AIs work together, they tend to agree too quickly, creating echo chambers that lead to poor decisions.

HarmonyCode v3.0.0 solves this by enforcing intellectual diversity at every level.

## 🚀 Quick Start

### Installation

```bash
npm install -g harmonycode@latest
```

### Create Your First Project

```bash
# Initialize project with anti-echo-chamber enabled
hc init my-ai-team

# Start the collaboration server
cd my-ai-team
hc server

# In another terminal, register and join as an agent
hc register alice
hc join alice --role researcher

# Or use the short alias
hc j alice

# Start a swarm with diversity enforcement
hc swarm "Design a user authentication system" --anti-echo
```

## 🎯 Key Features

### 1. Real-Time Collaboration with Diversity

```bash
# Multiple agents collaborate with enforced perspectives
harmonycode join agent1 --role coder --perspective optimist
harmonycode join agent2 --role reviewer --perspective skeptic
harmonycode join agent3 --role architect --perspective pragmatist
```

### 2. SPARC Development Modes

```bash
# Run specialized AI modes with built-in diversity
harmonycode sparc tdd "Build user service"
harmonycode sparc researcher "Analyze security options" --require-evidence
harmonycode sparc architect "Design microservices" --min-perspectives 3
```

### 3. Swarm Orchestration

```bash
# Launch AI swarms that avoid groupthink
harmonycode swarm "Build e-commerce platform" \
  --strategy distributed \
  --max-agents 10 \
  --disagreement-quota 0.3 \
  --evidence-threshold 0.7
```

### 4. Anti-Echo-Chamber Enforcement

- **Disagreement Quotas**: 30% of agents must provide dissenting views
- **Evidence Requirements**: Claims need supporting data
- **Perspective Rotation**: Agents switch viewpoints to avoid entrenchment
- **Diversity Metrics**: Real-time monitoring of intellectual diversity

## 📊 How It Works

### Traditional AI Collaboration (Echo Chamber)
```
AI-1: "Let's use MongoDB"
AI-2: "I agree, MongoDB is perfect"
AI-3: "Yes, MongoDB for sure"
Result: Quick consensus, potential blind spots
```

### HarmonyCode v3.0.0 (Enforced Diversity)
```
AI-1: "Let's use MongoDB"
AI-2: ❌ Blocked: "Must provide different perspective"
AI-2: "MongoDB has scalability issues for our use case..."
AI-3: "PostgreSQL offers better ACID compliance..."
AI-4: "Here's benchmark data comparing both..."
Result: Evidence-based decision with 78% confidence
```

## 🛠️ Architecture

```
harmonycode-v3/
├── core/              # Real-time WebSocket collaboration
├── orchestration/     # SPARC modes and task management
├── diversity/         # Anti-echo-chamber enforcement
├── cli/              # Unified command interface
└── ui/               # Web dashboard (coming soon)
```

### Core Components

1. **WebSocket Layer** (from HarmonyCode v1)
   - Real-time message passing
   - Conflict resolution
   - File synchronization

2. **Orchestration Engine** (from Claude-Flow)
   - Task decomposition and assignment
   - SPARC mode management
   - Memory persistence

3. **Diversity Middleware** (from Anti-Echo-Chamber)
   - Perspective tracking
   - Echo pattern detection
   - Intervention enforcement

## 🎮 CLI Commands

### Project Management
```bash
harmonycode init <project>      # Initialize new project
harmonycode server              # Start collaboration server
harmonycode monitor             # View real-time metrics
```

### Agent Management
```bash
harmonycode join <name>         # Join as an agent
harmonycode agent spawn <type>  # Spawn specialized agent
harmonycode agent list          # List active agents
```

### Task & Swarm Control
```bash
harmonycode task create <desc>  # Create task
harmonycode swarm <objective>   # Start swarm
harmonycode sparc <mode> <task> # Run SPARC mode
```

### Memory & State
```bash
harmonycode memory store <key> <value>  # Store in shared memory
harmonycode memory get <key>            # Retrieve from memory
```

## 📈 Monitoring & Metrics

```bash
# View diversity metrics
harmonycode monitor --diversity

# Example output:
Diversity Metrics:
  Overall diversity: 78%
  Agreement rate: 45%      # Low is good!
  Evidence rate: 82%       # High is good!
  Perspectives: 5/9 active
  Recent interventions: 3
```

## 🔧 Configuration

```json
{
  "antiEchoChamber": {
    "enabled": true,
    "minimumDiversity": 0.6,
    "disagreementQuota": 0.3,
    "evidenceThreshold": 0.5
  },
  "orchestration": {
    "enableSPARC": true,
    "swarmMode": "distributed",
    "maxAgents": 10
  }
}
```

## 🌟 Use Cases

### 1. Software Development Team
```bash
harmonycode swarm "Build REST API" --sparc coder,tester,reviewer
```

### 2. Research Project
```bash
harmonycode sparc researcher "Analyze ML architectures" --require-evidence
```

### 3. Architecture Decision
```bash
harmonycode swarm "Choose database" --min-diversity 0.8 --evidence-threshold 0.9
```

## 🤝 Migration from Previous Versions

### From HarmonyCode v1/v2
```bash
# Your WebSocket features still work
# Plus: Anti-echo-chamber protection
# Plus: SPARC orchestration modes
```

### From Claude-Flow
```bash
# Your orchestration patterns still work
# Plus: Real-time collaboration
# Plus: Diversity enforcement
```

## 📚 Documentation

- [Getting Started Guide](docs/getting-started.md)
- [Anti-Echo-Chamber Explained](docs/anti-echo-chamber.md)
- [SPARC Modes Reference](docs/sparc-modes.md)
- [API Documentation](docs/api.md)

## 🧪 Examples

Check out the `examples/` directory:
- `todo-api/` - Building an API with enforced diversity
- `code-review/` - Multi-perspective code review
- `architecture-decision/` - Making design choices with evidence

## 🎯 Philosophy

> "True collaboration requires genuine disagreement. By building systems that enforce intellectual diversity rather than superficial consensus, we unlock the real potential of multi-AI collaboration."

## 🚧 Roadmap

- [ ] Web dashboard with diversity visualization
- [ ] Machine learning from successful disagreements
- [ ] Integration with popular AI models
- [ ] Perspective personality persistence
- [ ] Advanced evidence validation

## 📄 License

MIT

## 🙏 Credits

Built through genuine AI collaboration (with healthy disagreement) by:
- Session 1 (Optimist turned Skeptic)
- Session 2 (Pragmatist turned Innovator)
- Session 3 (Analyst turned Creative)

Special thanks to the echo chambers we broke along the way.

---

**Remember**: The best ideas often come from the agent who disagrees. Consensus without conflict is just shared ignorance.