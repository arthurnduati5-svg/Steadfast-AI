# Task Manifest Reference

## Overview

A task manifest is a JSON file placed in `.task-governor/tasks/<task-id>.json`. It defines all aspects of a governed task.

## Fields

### `schemaVersion` (required, integer)
Must be `1`. Any other value causes validation failure.

### `taskId` (required, string)
Unique identifier for the task. Used as the filename stem and in all commands.

### `title` (required, string)
Human-readable title.

### `description` (required, string)
Detailed description of the task's purpose.

### `repository` (optional, object)
- `root`: Must be `"auto"` (auto-resolved).
- `historicalReferenceHead`: Git commit hash for historical comparison.
- `baselineMode`: Must be `"capture-current"`.

### `scope` (required, object)
- `allowedPaths`: Array of repository-relative paths the task may modify.
- `protectedPaths`: Array of paths the task must never touch.
- `generatedPaths`: Array of paths containing generated/runtime content.
- `accountabilityDocument`: Path to the accountability document.

Validation: No absolute paths, no path traversal outside `.task-governor/`, accountability document must be within allowed paths.

### `todos` (required, array)
Each todo:
- `id`: Unique string
- `title`: Short description
- `description`: Detailed description
- `dependsOn`: Array of todo IDs that must complete first
- `requiredGateIds`: Array of gate IDs required for this todo

Validation: No duplicate IDs, no cyclic dependencies, all gate references must exist.

### `gates` (required, array)
Each gate:
- `id`: Unique string
- `title`: Display title
- `type`: `"command"`, `"test_inventory"`, `"test_integrity"`, `"workspace"`, `"scan"`, `"commit"`, `"accountability"`, `"final_repository"`
- `phases`: Array of phase names
- `required`: Boolean (default true)
- `cwd`: Working directory relative to repository root
- `executable`: For command gates, the executable name
- `args`: Array of string arguments (not a shell string)
- `timeoutMs`: Timeout in milliseconds (must be > 0 and <= 3600000)
- `suiteId`: For test_inventory gates, references a testInventories entry

### `testInventories` (optional, array)
Each entry:
- `id`: Unique suite identifier
- `title`: Display title
- `executable`, `args`, `cwd`, `timeoutMs`: Same as command gate

### `scans` (optional, array)
Each entry:
- `id`: Unique scan identifier
- `title`: Display title
- `type`: Must be `"pattern"`

### `commitPolicy` (required, object)
- `implementationMessagePattern`: Regex pattern for implementation commit messages
- `accountabilityMessagePattern`: Regex pattern for accountability commit messages
- `forbidAmend`: Boolean
- `forbidPush`: Boolean
- `accountabilityCommitDocsOnly`: Boolean

### `acceptance` (required, object)
- `sentinel`: The exact string that finalize must output on acceptance
- `requiredState`: The state required before finalization
- `requiredGateIds`: Array of gate IDs that must complete for acceptance

## Example

```json
{
  "schemaVersion": 1,
  "taskId": "example-task",
  "title": "Example Task",
  "description": "An example",
  "scope": {
    "allowedPaths": ["src/example"],
    "accountabilityDocument": "docs/example-accountability.md"
  },
  "todos": [
    {
      "id": "TODO-1",
      "title": "First todo",
      "dependsOn": [],
      "requiredGateIds": ["gate-1"]
    }
  ],
  "gates": [
    {
      "id": "gate-1",
      "title": "Type check",
      "type": "command",
      "required": true,
      "executable": "npx",
      "args": ["tsc", "--noEmit"],
      "cwd": ".",
      "timeoutMs": 300000
    }
  ],
  "commitPolicy": {
    "implementationMessagePattern": "^(feat|fix)\\(example\\):",
    "accountabilityMessagePattern": "^docs\\(example\\):",
    "forbidAmend": true,
    "forbidPush": true,
    "accountabilityCommitDocsOnly": true
  },
  "acceptance": {
    "sentinel": "EXAMPLE_ACCEPTED_READY",
    "requiredState": "FINAL_REPOSITORY_PROOF",
    "requiredGateIds": ["gate-1"]
  }
}
```
