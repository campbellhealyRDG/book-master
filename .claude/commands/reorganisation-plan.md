# Command Reorganization Plan - COMPLETED ✅

**Status**: Reorganization Successfully Completed  
**Date Started**: 2025-09-05  
**Date Completed**: 2025-09-06  
**Progress**: 100% - All tasks completed  

## 📋 Completed Analysis

### ✅ Current State Assessment
- **Total Commands**: 28 properly categorized commands
- **Misplaced Agents**: 2 agent files in commands directory
- **System Files**: 3 files needing relocation
- **Current Categories**: 7 categories (code-analysis, build-deploy, code-generation, code-review, documentation, git-operations, testing)

### ✅ Identified Issues
1. **Agent Misplacement** (HIGH Priority)
   - `copilot-dedupe.md` (root) → Agent, not command
   - `copilot-orchestrator-master-agent.md` (_uncategorised/) → Agent, not command

2. **Root Directory Clutter** (MEDIUM Priority)
   - `AGENT_OS_ASSESSMENT.md` → Documentation
   - `INVENTORY.md` → System reference
   - `_uncategorised/title.md` → Template

3. **Naming Issues** (LOW Priority)
   - `refractor.md` → Should be `refactor.md`

## 🏗️ Approved New Structure

```
~/.claude/commands/
├── 📂 orchestration/           # ← MAIN ENTRY POINT
│   ├── index.md               # Master orchestration index
│   ├── command-registry.json  # Complete command registry
│   ├── INVENTORY.md           # Moved from root
│   └── README.md              # Usage guide
│
├── 📂 development/            # Core development commands
│   ├── 📂 analysis/          # From: code-analysis/
│   │   ├── analyze.md
│   │   ├── analyze-codebase.md
│   │   ├── audit.md
│   │   ├── explain.md
│   │   ├── explore.md
│   │   └── lyra.md
│   ├── 📂 generation/        # From: code-generation/
│   │   ├── design.md
│   │   ├── estimate.md
│   │   ├── generate-api-docs.md
│   │   ├── spawn.md
│   │   └── ultrathink.md
│   ├── 📂 review/            # From: code-review/
│   │   ├── cleanup.md
│   │   ├── code-review.md
│   │   ├── improve.md
│   │   └── refactor.md (renamed from refractor.md)
│   └── 📂 implementation/    # From: code-review/
│       └── implement.md
│
├── 📂 operations/             # Operations & deployment
│   ├── 📂 build/            # From: build-deploy/
│   │   └── build.md
│   ├── 📂 optimize/         # From: build-deploy/
│   │   └── optimize.md
│   └── 📂 planning/         # From: build-deploy/
│       └── plan.md
│
├── 📂 quality/                # Quality assurance
│   ├── 📂 testing/          # From: testing/
│   │   ├── debug-session.md
│   │   ├── test.md
│   │   ├── test-file.md
│   │   └── troubleshoot.md
│   └── 📂 audit/            # New category
│
├── 📂 documentation/          # Documentation tools
│   ├── 📂 project/          # From: documentation/
│   │   ├── claude_commands.md
│   │   ├── claude-desktop-extension.md
│   │   ├── document.md
│   │   ├── handover.md
│   │   └── index.md
│   └── 📂 reference/        # New category
│       └── AGENT_OS_ASSESSMENT.md (moved from root)
│
├── 📂 workflow/               # Workflow management
│   ├── 📂 git/              # From: git-operations/
│   │   ├── git.md
│   │   ├── load.md
│   │   ├── project-name.md
│   │   └── update-claude-md-file.md
│   ├── 📂 task/             # From: build-deploy/
│   │   └── task.md
│   └── 📂 tools/            # From: git-operations/
│       └── list-tools.md
│
└── 📂 _system/                # System files
    ├── 📂 indices/           # From: _index/
    ├── 📂 logs/              # From: _logs/
    ├── 📂 templates/         # New + from _uncategorised/
    │   └── command-template.md (from title.md)
    └── 📂 archives/          # For future use
```

## 📦 Agent Extraction Plan

### Files to Move to ~/.claude/agents/
1. `copilot-dedupe.md` → `~/.claude/agents/system/copilot-dedupe.md`
2. `_uncategorised/copilot-orchestrator-master-agent.md` → `~/.claude/agents/orchestration/copilot-orchestrator-master-agent.md`

## 🚀 Next Implementation Steps

### Step 1: Create New Directory Structure
```bash
cd "C:\Users\vincent.healy\.claude\commands"
mkdir -p orchestration development/{analysis,generation,review,implementation} operations/{build,optimize,planning} quality/{testing,audit} documentation/{project,reference} workflow/{git,task,tools} _system/{indices,logs,templates,archives}
```

### Step 2: Move Commands to New Structure
- Move all files according to the mapping above
- Rename `refractor.md` to `refactor.md`
- Preserve all file contents and permissions

### Step 3: Extract Agent Files
- Move agent files to appropriate agent directories
- Update any references to these files

### Step 4: Create Orchestration Index
- Build master index in `orchestration/index.md`
- Create command registry JSON
- Update navigation and references

### Step 5: System File Organization
- Move `_index/*` to `_system/indices/`
- Move `_logs/*` to `_system/logs/`
- Clean up root directory

### Step 6: Testing and Verification
- Verify all files moved correctly
- Test command access paths
- Update any broken references
- Validate new structure

## 🎯 Benefits of New Structure
1. **Centralized Orchestration** - Single entry point for all commands
2. **Logical Grouping** - Related commands grouped together
3. **Scalable Organization** - Easy to add new categories
4. **Clear Separation** - Agents vs Commands properly separated
5. **Better Navigation** - Hierarchical structure with clear paths
6. **System Organization** - System files properly contained

## 📝 Resume Instructions
When resuming this task:
1. Review this plan
2. Execute Step 1 (create directories)
3. Continue with subsequent steps in order
4. Use TodoWrite to track progress
5. Test each step before proceeding to the next

## ✅ Implementation Complete

### Completed Actions:
1. ✅ Created new directory structure
2. ✅ Moved all commands to appropriate categories
3. ✅ Extracted agent files to ~/.claude/agents/
4. ✅ Created orchestration index at `/orchestration/index.md`
5. ✅ Created command registry JSON at `/orchestration/command-registry.json`
6. ✅ Organized system files in `_system/` directory
7. ✅ Cleaned up old empty directories
8. ✅ Renamed `refractor.md` to `refactor.md`

### Final Statistics:
- **Commands Reorganized**: 28
- **Agent Files Extracted**: 2
- **Categories Created**: 5 main, 14 sub-categories
- **System Files Organized**: All indices, logs, and templates

**Result**: The command structure is now properly organized, scalable, and maintainable.