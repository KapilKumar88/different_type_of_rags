# Authentication Module Plan

## Purpose

This file is the lookup and status tracker for the authentication module. Detailed task instructions live in the task files in this folder.

Module scope is limited to:

- Login flow
- Registration flow
- Auth guard for protected app routes

## Status Legend

- `Pending`: Not started.
- `In Progress`: Implementation has started but is not ready for review.
- `Review`: Task is complete and waiting for user review.
- `Approved`: User reviewed and approved the task.

## Task Status

| Task | File | Status | Notes |
| --- | --- | --- | --- |
| Task 01: Planning and Task Files | [task_01.md](task_01.md) | Approved | User approved the plan/task-file structure. |
| Task 02: Server Foundation | [task_02.md](task_02.md) | Approved | User approved the server foundation. |
| Task 03: Server Auth API | [task_03.md](task_03.md) | Approved | User approved the server auth API. |
| Task 04: Server Auth Guard | [task_04.md](task_04.md) | Approved | User approved the server auth guard. |
| Task 05: Client Auth Infrastructure | [task_05.md](task_05.md) | Approved | User approved the client auth infrastructure. |
| Task 06: Login Flow | [task_06.md](task_06.md) | Approved | User approved the login flow. |
| Task 07: Registration Flow | [task_07.md](task_07.md) | Review | Replaced mock registration with validated authService.register mutation, auth store update, success navigation, error toast, field validation messages including password mismatch, and pending button state. Build passed; lint has only pre-existing warnings. |
| Task 08: Client Auth Guard | [task_08.md](task_08.md) | Pending | Start only after Task 07 approval. |

## Key Decisions

- Use real Postgres persistence with Drizzle ORM.
- Use HttpOnly cookie-based JWT sessions.
- Use standardized API responses shaped as `{ success, message, data }`.
- Follow the server controller/service/repository structure.
- Follow the client service/store/validation structure.
- Do not expand scope beyond login, registration, and auth guard behavior.

## Strict Workflow

- Always read this lookup file before starting or resuming auth module work.
- Always read the current task file before implementing that task.
- Complete tasks in numeric order.
- After completing a task, update this lookup file with the task status and notes.
- Stop after each task and ask the user for review.
- Continue to the next task only after explicit approval.
- Do not implement future tasks early.

## Completion Summary

- Task 01 is approved.
- Task 02 is approved.
- Task 03 is approved.
- Task 04 is approved.
- Task 05 is approved.
- Task 06 is approved.
- Task 07 is ready for review.
