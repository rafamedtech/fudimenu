# Agent Instructions

- Do not run `pnpm typecheck` or `pnpm lint` after every change by default. Only run them when explicitly requested, before a commit/PR, or when the change is risky enough that targeted verification is necessary.

## Notion Task Creation

- When the user asks to add/create tasks in Notion, assume they mean the Tasks database at `https://www.notion.so/heltifud/197710fbd0f28176a03ac79fe157486b?v=360710fbd0f280e28667000cf624f758&source=copy_link` unless they explicitly name a different database.
- When the user asks to create or add tasks in Notion, include a `Modelo recomendado` section in each task body.
- Choose the recommended model using this routing:
  - `Kimi K2.6`: bulk coding, large batch generation, broad work that can be parallelized, scaffolding, long autonomous implementation runs, or cheap-at-scale execution.
  - `Claude Opus 4.7`: production-critical code, architecture decisions, sequential debugging, legal/enterprise documents, vision/design precision, or work where a wrong answer has high cost.
  - `GPT-5.5`: math, current/web research, source synthesis, computer use, GUI navigation, or tasks that require finding up-to-date information quickly.
- If the task naturally spans phases, recommend a workflow instead of one model, for example `GPT-5.5 for research -> Claude Opus 4.7 for production implementation` or `Kimi K2.6 for bulk implementation -> Claude Opus 4.7 for review/hardening`.
- Use this body format:

```markdown
## Modelo recomendado
Modelo: <model or model workflow>
Motivo: <one concise sentence tied to the task type>
```

- If the appropriate route is ambiguous, choose conservatively based on risk: high-risk correctness defaults to `Claude Opus 4.7`; current research defaults to `GPT-5.5`; bulk parallel work defaults to `Kimi K2.6`.
