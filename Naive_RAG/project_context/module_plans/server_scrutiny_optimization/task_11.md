# Task 11: Preserve Repository Hygiene

## Goal

Keep generated and runtime files from confusing backend reviews or leaking secrets.

## Scope

- Confirm `server/.env`, `server/dist`, and `server/node_modules` remain ignored.
- Avoid committing generated output unless explicitly required.
- Document clean verification commands.

## Implementation Details

- Do not delete user-local runtime files unless explicitly requested.
- Verify tracking state with git.

## Completion Criteria

- Runtime/generated files are not tracked.
- The module completion summary records final verification and hygiene checks.

## Test Cases

- `git ls-files` does not include `server/.env`, `server/dist`, or `server/node_modules`.
- `git status` clearly separates intentional source/doc changes from local generated/runtime files.

## Review Gate

Stop after this task and complete the module summary.
