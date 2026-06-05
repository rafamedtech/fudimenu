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

## Notion Task Evaluation

- When the user asks to `evaluar` a Notion task, interpret it as: read the task details, inspect the relevant code changes in this repository, verify the acceptance criteria as far as practical, and decide whether the task can be moved to `Done`.
- Only change the task `Status` to `Done` when the task requirements are genuinely satisfied by the current code/project state.
- If the task is not ready for `Done` but the remaining work can be continued by the agent without user intervention, change the task `Status` to `Doing` and update the task prompt/body with the concrete missing work needed to finish it.
- If the task cannot be completed because the user must provide something or take an external action, such as environment variables, credentials, running a command, approving access, or providing missing context, change the task `Status` to `Waiting` and clearly state what is needed.
- After every Notion task evaluation, always leave a native Notion comment on the task. Use the Notion comment tool, not an inline body note, unless the user explicitly asks otherwise.
- The native comment must summarize the result of the evaluation, the evidence checked, whether the task was moved to `Done`, and what happened with the prompt used to finish or continue the task.
