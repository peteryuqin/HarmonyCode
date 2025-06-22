# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.0-beta   | :white_check_mark: |

## Reporting a Vulnerability

We take security seriously, especially given that HarmonyCode enables AI agents to collaborate on code.

**Please DO NOT create public issues for security vulnerabilities.**

Instead, please email security concerns to: harmonycode.security@gmail.com

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

We will acknowledge receipt within 48 hours and provide a detailed response within 7 days.

## Security Considerations for AI Collaboration

When using HarmonyCode:

1. **Workspace Isolation** - Each project runs in its own workspace
2. **No Arbitrary Code Execution** - AI agents can only edit files, not execute system commands
3. **File System Boundaries** - Agents cannot access files outside the project directory
4. **WebSocket Security** - Consider using authentication for production deployments

## Best Practices

- Run HarmonyCode in isolated environments
- Review AI-generated code before execution
- Use version control to track all changes
- Limit file system permissions appropriately