# Supabase Postgres Best Practices

## Structure

```
supabase-postgres-best-practices/
  SKILL.md       # Main skill file - read this first
  AGENTS.md      # This navigation guide
  CLAUDE.md      # Symlink to AGENTS.md
  references/    # Detailed reference files
```

## Usage

1. Read `SKILL.md` for the main skill instructions
2. Browse `references/` for detailed documentation on specific topics
3. Reference files are loaded on-demand - read only what you need

Comprehensive performance optimization guide for Postgres, maintained by Supabase. Contains rules across 8 categories, prioritized by impact to guide automated query optimization and schema design.

## When to Apply

Reference these guidelines when:

- Writing SQL queries or designing schemas
- Implementing indexes or query optimization
- Reviewing database performance issues
- Configuring connection pooling or scaling
- Optimizing for Postgres-specific features
- Working with Row-Level Security (RLS)

## Rule Categories by Priority

| Priority | Category                 | Impact      | Prefix      |
| -------- | ------------------------ | ----------- | ----------- |
| 1        | Query Performance        | CRITICAL    | `query-`    |
| 2        | Connection Management    | CRITICAL    | `conn-`     |
| 3        | Security & RLS           | CRITICAL    | `security-` |
| 4        | Schema Design            | HIGH        | `schema-`   |
| 5        | Concurrency & Locking    | MEDIUM-HIGH | `lock-`     |
| 6        | Data Access Patterns     | MEDIUM      | `data-`     |
| 7        | Monitoring & Diagnostics | LOW-MEDIUM  | `monitor-`  |
| 8        | Advanced Features        | LOW         | `advanced-` |

## How to Use

Read individual rule files for detailed explanations and SQL examples:

```
references/query-missing-indexes.md
references/schema-partial-indexes.md
references/_sections.md
```

Each rule file contains:

- Brief explanation of why it matters
- Incorrect SQL example with explanation
- Correct SQL example with explanation
- Optional EXPLAIN output or metrics
- Additional context and references
- Supabase-specific notes (when applicable)

## References

- https://www.postgresql.org/docs/current/
- https://supabase.com/docs
- https://wiki.postgresql.org/wiki/Performance_Optimization
- https://supabase.com/docs/guides/database/overview
- https://supabase.com/docs/guides/auth/row-level-security

## Testing policy

- Todo cambio funcional debe incluir tests proporcionales al riesgo.
- Si se modifica lógica de negocio, agregar o actualizar tests unitarios/integration.
- Si se modifica un flujo crítico del usuario, considerar test E2E con Playwright.
- No cerrar una tarea sin indicar cómo validar manualmente y cómo correr sus tests.
- Priorizar tests sobre:
  - permisos
  - visibilidad pública
  - validación de payloads
  - reglas de publicación
  - CRUDs críticos del dashboard

## Test strategy

- Vitest para unit e integration tests
- @nuxt/test-utils para soporte de testing de Nuxt
- Playwright para E2E
- Evitar tests frágiles de UI
- Preferir factories y fixtures reutilizables
- Crear tests cerca de la lógica o bajo `tests/` según convenga, pero mantener consistencia

## Done

Una tarea no está terminada si:

- rompe tests existentes
- cambia comportamiento crítico sin agregar cobertura nueva
- no explica cómo correr la validación
