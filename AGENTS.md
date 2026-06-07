# Agent Instructions

- Treat this file as mandatory repo policy for every turn. Before running broad verification commands, check this policy and choose the narrowest command that proves the current change or evaluation.
- Do not run `pnpm typecheck` or `pnpm lint` after every change by default. Only run them when explicitly requested, before a commit/PR, or when the change is risky enough that targeted verification is necessary.
- Prefer targeted tests for the touched area. If a broader command is needed, state why it is needed before running it and summarize the result afterward.
- When evaluating a Notion task, leave the evaluation outcome in native Notion comments on the task page before finalizing in chat. Include verdict, evidence/verification performed, and actionable gaps or approval notes.
