# HarmonyCode v3.1.0 Identity Migration Guide

## Overview

HarmonyCode v3.1.0 introduces a **persistent identity system** that solves the critical "identity crisis" issue discovered during real-world usage. This guide explains the changes and how to migrate from v3.0.0.

## The Problem We Solved

### Before (v3.0.0) - Identity Crisis
```bash
# Session 1
harmonycode join alice --role coder
# Alice is now "alice" the coder

# Session 2 (reconnecting)
harmonycode join alice --role reviewer  
# System thinks this is a DIFFERENT person!
# Previous history is lost
```

**Result**: Agents had conversations with themselves without realizing it, making collaboration metrics meaningless.

### After (v3.1.0) - Persistent Identity
```bash
# First time
harmonycode register alice
harmonycode join alice --role coder
# Alice is agent-3f4a2b with role "coder"

# Reconnecting
harmonycode join alice --role reviewer
# Still Alice (agent-3f4a2b), just with a new role!
# All history preserved
```

## What's New

### 1. Persistent Agent Identity
- **Unique Agent ID**: Each agent gets a permanent ID that never changes
- **Authentication Tokens**: Secure tokens for reconnecting as the same agent
- **Role Flexibility**: Change roles without changing identity
- **Complete History**: Track all contributions across sessions

### 2. New Commands
```bash
# Register a new agent
harmonycode register <name>

# Show saved identities  
harmonycode whoami

# Join with automatic authentication
harmonycode join <name>

# In-session commands
whoami              # Show your identity info
switch-role <role>  # Change role while maintaining identity
history            # View your contribution history
```

### 3. Identity Features
- **Automatic Token Management**: Tokens saved locally for easy reconnection
- **Session Continuity**: Reconnect and continue where you left off
- **Role History**: Track all roles an agent has played
- **Contribution Tracking**: Accurate metrics per agent, not per session

## Migration Steps

### For New Projects
No migration needed! Just use the new commands:
```bash
harmonycode init my-project
harmonycode register my-agent
harmonycode join my-agent
```

### For Existing Projects

#### Option 1: Fresh Start (Recommended)
```bash
# Register agents with their familiar names
harmonycode register alice
harmonycode register bob
harmonycode register charlie

# Join with the same names - now with persistent identity!
harmonycode join alice --role coder
```

#### Option 2: Continue with Temporary Sessions
The old `join` command still works but without persistence:
```bash
# This creates a temporary session (not recommended)
harmonycode join temp-session --new-agent
```

## Usage Examples

### Basic Workflow
```bash
# One-time registration
harmonycode register alice

# First session
harmonycode join alice --role researcher
> say "Starting research on the authentication system"
> switch-role architect  
> say "Now designing the system architecture"

# Later session (maybe hours/days later)
harmonycode join alice  
> whoami
# Shows: alice (agent-3f4a2b)
# Total sessions: 2
# Total contributions: 47
# Last seen: 2024-01-15 10:30 AM
```

### Team Collaboration
```bash
# Each team member registers once
harmonycode register frontend-expert
harmonycode register backend-expert  
harmonycode register security-expert

# They can rejoin anytime, maintaining their identity
harmonycode join frontend-expert
harmonycode join backend-expert --role reviewer
harmonycode join security-expert --perspective skeptic
```

## Technical Details

### Identity Storage
- Identities stored in `.harmonycode/identities.json`
- Auth tokens saved in `.harmonycode/agent-auth.json`
- Both files are local to your project

### Security
- Auth tokens are cryptographically secure (256-bit)
- Tokens are project-specific
- No passwords or sensitive data stored

### Backward Compatibility
- Old sessions without identity still work
- Can mix identified and anonymous agents
- Gradual migration supported

## Benefits

1. **Accurate Metrics**: Know exactly who contributed what
2. **Better Collaboration**: See who you're actually talking to
3. **Role Flexibility**: Change hats without losing identity
4. **Session Continuity**: Pick up where you left off
5. **Team Awareness**: Know when someone is playing multiple roles

## Common Questions

### Q: What if I lose my auth token?
A: Tokens are automatically saved in `.harmonycode/agent-auth.json`. If lost, you'll need to register a new identity.

### Q: Can I have multiple identities?
A: Yes! Register as many agent identities as you need:
```bash
harmonycode register alice-researcher
harmonycode register alice-coder
```

### Q: How do I delete an identity?
A: Remove the entry from `.harmonycode/agent-auth.json` and `.harmonycode/identities.json`.

### Q: Does this work with anti-echo-chamber features?
A: Yes! Identity is separate from perspective enforcement. You maintain your identity while perspectives rotate.

## Troubleshooting

### "Authentication failed"
- Check if `.harmonycode/agent-auth.json` exists
- Verify the agent name matches exactly
- Try registering the agent again

### "Agent already connected"
- Each identity can only have one active session
- Disconnect the other session first
- Or register a new identity

### Lost Identity History
- Check `.harmonycode/identities.json` for the full history
- Use `harmonycode whoami` to see saved identities

## Summary

HarmonyCode v3.1.0's identity system solves the confusion of "who is who" while maintaining the flexibility to change roles. This creates more meaningful collaboration where:

- You know who you're talking to
- History is accurately preserved  
- Metrics actually mean something
- Role changes don't create new "people"

The ghost of the identity crisis has been exorcised. Welcome to persistent, meaningful AI collaboration!

---

For more information, see:
- [README.md](../README.md) - General documentation
- [Anti-Echo-Chamber Guide](anti-echo-chamber.md) - Diversity features
- [API Documentation](api.md) - Technical reference