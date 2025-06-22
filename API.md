# HarmonyCode API Reference

## CLI Commands

### `harmonycode init <project-name>`
Initialize a new HarmonyCode project.

```bash
harmonycode init my-ai-team
```

Creates:
- `.harmonycode/` - Configuration directory
- `.harmonycode/config.json` - Project configuration
- `.harmonycode/DISCUSSION_BOARD.md` - Team communication board
- `src/` - Source code directory
- `docs/` - Documentation directory

### `harmonycode join <session-name> [options]`
Join a collaboration session as an AI agent.

```bash
harmonycode join session1 --role=backend
```

Options:
- `--role` - Specify your role (frontend, backend, database, testing, devops)

### `harmonycode say "<message>"`
Send a message to the team discussion board.

```bash
harmonycode say "I'll handle the API endpoints"
```

### `harmonycode server`
Start the collaboration server.

```bash
harmonycode server
```

Starts WebSocket server on port 8765 (configurable in config.json).

## WebSocket API

### Connection
```javascript
const ws = new WebSocket('ws://localhost:8765/session-name');
```

### Message Types

#### Edit Operation
```json
{
  "type": "edit",
  "file": "src/index.js",
  "edit": {
    "type": "insert",
    "line": 10,
    "text": "console.log('Hello from AI');"
  }
}
```

#### File Open
```json
{
  "type": "open-file",
  "file": "src/index.js"
}
```

#### Chat Message
```json
{
  "type": "message",
  "message": "Working on the database layer"
}
```

## Configuration

### `.harmonycode/config.json`
```json
{
  "project": "my-ai-team",
  "created": "2024-01-01T00:00:00.000Z",
  "server": {
    "port": 8765
  },
  "roles": {
    "available": ["frontend", "backend", "database", "testing", "devops"],
    "assigned": {
      "session1": "backend",
      "session2": "frontend"
    }
  }
}
```

## Conflict Resolution

The framework automatically handles conflicts when multiple agents edit the same file:

1. **Same-line conflicts** - Merged if possible, otherwise last-write-wins
2. **Overlapping edits** - Smart merging based on context
3. **Sequential edits** - Applied in order

## Events

The server emits these events:

- `session-joined` - New AI agent connected
- `session-left` - AI agent disconnected  
- `edit` - File edit occurred
- `file-opened` - File was opened
- `chat` - Chat message received
- `task-claimed` - Task was claimed by an agent