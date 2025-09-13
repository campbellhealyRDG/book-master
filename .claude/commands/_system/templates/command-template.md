# # <title>

<title>

## Purpose
<purpose>

## Inputs
- <name>: <type> — <why needed>

## Outputs
- <artifact|state change> — <how verified>

## Steps (Deterministic)
1. ...
2. ...

## Tools
- <tool or MCP> — <usage|flags>

## Success Criteria
- <measurable checks>

## Notes & Risks
- ...

## Report Back
When run, emit a JSON line to STDOUT:
{"task_id":"<task-id>","status":"ok|fail","artifacts":["<paths>"],"notes":"<short text>"}
```

### 4) Build Index + Task Graph
- Write/merge `ROOT/_index/index.json` schema:

```json
{
  "version": 1,
  "generated_at": "2025-08-07T20:45:43+00:00",
  "tasks": [
    {
      "id": "string",
      "category": "string",
      "title": "string",
      "path": "relative/path/to/task.md",
      "version": "semver",
      "inputs": ["..."],
      "outputs": ["..."],
      "tools": ["..."]
    }
  ]
}
```

- Build `ROOT/_index/task-graph.json` with `nodes=[task_id]` and `edges=[{"from":task_id,"to":task_id,"type":"depends_on"}]`.  
  - Derive dependencies from explicit “Prereqs/Inputs” and referenced artifacts.

### 5) Dedupe (≥0.95 Confidence)
Detect overlap across **title**, **purpose**, **inputs/outputs**, and **step tokens**.
- Compute a composite score:
  - Title/purpose cosine or token overlap
  - Jaccard of normalized inputs/outputs
  - Step bigram overlap
- If `score ≥ 0.95`, consider duplicates. Pick a **canonical** winner using tie-breakers:
  1) More complete `success_criteria` and tests
  2) More specific scope (narrow > broad)
  3) Newer file **if** it doesn’t regress scope
  4) If still tied, prefer the one referenced by more edges in the task graph
- **Removal policy:** don’t hard-delete. Move losers to `ROOT/__archive/<category>/<task-id>.<ext>` and add an `ARCHIVE.json` describing:
  - `replaced_by`, reasons, confidence score, before/after metadata
- Update `index.json` and `task-graph.json` accordingly.

### 6) Idempotency / Safety
- Re-runs are safe. Only touch files inside `ROOT`, and only the managed areas.  
- Do **not** modify arbitrary user files outside `ROOT`.  
- Keep a log line for each action in `ROOT/_logs/cycles.ndjson`.

### 7) Reporting Back to Claude
Return two blocks:
1) **JSON** summary (single code fence) containing:
   - counts: `{discovered, tasks_created, tasks_updated, archived, duplicates_resolved}`
   - arrays: `created_paths`, `updated_paths`, `archived_paths`
   - warnings/errors
2) **Human summary**: bullet list of notable merges, potential risky removals, and next actions.

---

## Execution Controls

**Modes**
- `PLAN_ONLY=true` → do not write files; output intended changes.
- `STRICT=false` → allow best-effort parsing when structure is messy.
- `CONFIDENCE=0.95` → dedupe threshold (don’t go lower without explicit instruction).

**Inputs (optional)**
- `INCLUDE_CATEGORIES=["testing","devops"]` (default: all)
- `EXCLUDE=["**/__archive/**","**/_index/**","**/_logs/**",".git/**","node_modules/**"]`

If a category has existing sub-agents, **merge** rather than re-create; bump `version` when content meaningfully changes.

---

## Acceptance Criteria
- Every multi-intent file is split into atomic sub-agents.
- Master index + DAG exist and reflect reality.
- Overlaps above threshold are resolved; non-winners are archived with traceability.
- Report is concise and machine-readable; no excessive context dumps.

---

### Minimal Kickoff Command (example)
> “Copilot, run in `PLAN_ONLY=false`, `STRICT=true`. Include all categories. Dedupe at 0.95. Start from `~/.claude/commands`.”
