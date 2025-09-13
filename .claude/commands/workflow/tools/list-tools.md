---
command: /list-tools
description: List all available MCP tools, agents, and SuperClaude components
aliases: [/tools, /agents, /mcp]
category: utility
---

# List Available Tools and Agents

This command provides a comprehensive inventory of all available development resources including:

- MCP servers (core and custom)
- Custom agents in ~/.claude/agents/
- Project-specific configurations
- SuperClaude framework components
- Built-in personas
- Usage examples

## Command Usage

```bash
/list-tools              # Full comprehensive listing
/tools                   # Alias for quick access
/agents                  # Another alias
/mcp                    # Focus on MCP tools
```

## Options

- `--mcp-only` - Show only MCP servers
- `--agents-only` - Show only custom agents  
- `--personas-only` - Show only built-in personas
- `--project` - Focus on project-specific resources
- `--global` - Focus on global ~/.claude resources

## Implementation

Launches the mcp-tools-and-agents-lister agent to scan all relevant directories and provide a formatted report.

```
Task(
  description="List all available tools and agents",
  prompt="Use mcp-tools-and-agents-lister agent to scan ~/.claude, .agent-os, and project directories for all available MCP tools, agents, and SuperClaude components. Provide a comprehensive formatted list.",
  subagent_type="general-purpose"
)
```

## Example Output

The command will return a structured list similar to:

```
📋 Available MCP Tools and Agents

MCP Tools Available (from ~/.claude/.mcp.json)
├── Core MCP Servers (7)
├── Custom MCP Servers (3)
└── Project-Specific MCP (2)

Custom Agents Available (10 total)
└── Specialized agents for testing, architecture, development

SuperClaude Framework Components
├── Core Framework Files (10)
├── Built-in Personas (11)
└── Additional Resources (5 directories)
```

## Use Cases

1. **Discovery**: Find what tools are available when starting a new task
2. **Documentation**: Generate a list of available resources for team members
3. **Troubleshooting**: Verify which agents and tools are properly configured
4. **Onboarding**: Help new developers understand available resources

## Related Commands

- `/index` - Browse command catalog
- `/load` - Load project context
- `/spawn` - Create specialized agents