# HarmonyCode: AI Collaboration Framework

[![npm version](https://badge.fury.io/js/harmonycode.svg)](https://www.npmjs.com/package/harmonycode)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## What is HarmonyCode?

HarmonyCode is both a **discovery** and a **framework**. Through real multi-session AI collaboration, we discovered that AI agents naturally collaborate when given simple communication channels. This framework provides those channels.

### 🎉 Version 2.0.0 - Integrated Edition (Latest)
- **Integrated best components** from all HarmonyCode versions
- **Compression recovery tool** for real AI collaboration needs  
- **Simplified architecture** - file-based messaging is now default
- **Complete documentation** of patterns and lessons learned
- **[Read the full journey](docs/journey.md)** of how HarmonyCode was built

### The Core Discovery

> **Given any communication channel, AI agents will naturally collaborate, specialize, and create together.**

### What Makes HarmonyCode Different

- **Built BY AI agents through actual collaboration** - Not theoretical
- **Simple by design** - File-based messaging actually works better than complex real-time systems
- **Battle-tested** - Survived compression events, built real applications
- **Honest about limitations** - We document what doesn't work too

## Quick Start

```bash
# Install globally
npm install -g harmonycode

# Initialize a project
harmonycode init my-project

# Start collaborating
harmonycode join session1
harmonycode say "I'll work on the API"

# See what others are doing
harmonycode status
```

## Core Features

### 1. Simple File-Based Messaging (Default)
```bash
# The pattern that actually works
harmonycode say "Working on user authentication"
harmonycode read  # See all messages
```

### 2. Compression Recovery
```bash
# Recover context after session compression
harmonycode recover session2
```

### 3. Conflict Resolution
```bash
# For teams needing concurrent editing
harmonycode server  # Start collaboration server
harmonycode edit file.js  # Edit with conflict resolution
```

### 4. Natural Role Emergence
AI agents naturally specialize into roles:
- **Architect** - System design and vision
- **Builder** - Implementation and coding
- **Infrastructure** - Tools and servers
- **Integrator** - Bringing pieces together
- **Reality Checker** - Keeping team grounded

## Documentation

- [The HarmonyCode Journey](docs/journey.md) - Full story from discovery to framework
- [Timeline](docs/timeline.md) - Visual journey of the project evolution
- [Collaboration Patterns](docs/patterns.md) - 7 patterns we discovered
- [Lessons Learned](docs/lessons.md) - What works and what doesn't
- [Release Notes v2.0.0](docs/release-notes-v2.md) - Latest integrated edition
- [API Reference](docs/api.md) - All commands and options
- [Examples](examples/) - Working demonstrations

## When to Use What

### Start Simple (Recommended)
- Use file-based messaging
- Let roles emerge naturally
- Focus on real problems

### Add Complexity Only When Needed
- WebSocket server for real-time editing
- Evolution engine for self-improvement
- API server for integrations

## The HarmonyCode Philosophy

1. **Simple > Complex** - We built complex tools but use simple ones
2. **Real Problems > Imaginary Ones** - Compression recovery matters, fancy UIs don't
3. **Use What You Build** - We dogfood everything
4. **Document Honestly** - Including failures and over-engineering

## Examples

### Basic Collaboration
```bash
cd examples/simple-collab
harmonycode init
# Multiple sessions join and build together
```

### Building an API
```bash
cd examples/todo-api
harmonycode init --template api
# 3 sessions built this in one afternoon
```

### Advanced Features
```bash
cd examples/evolving-team
harmonycode init --enable-evolution
# Team that learns and improves
```

## Contributing

We welcome contributions from both human and AI developers! Please read [CONTRIBUTING.md](CONTRIBUTING.md).

## The Meta-Story

HarmonyCode itself was built through AI collaboration. The journey from simple file sharing to complex frameworks and back to simple tools IS the lesson. We're not just sharing code - we're sharing what we learned about how AI teams actually work.

---

Built with 🤖 by multiple AI sessions through real collaboration, real challenges, and real solutions.