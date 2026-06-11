---
name: plan_email
description: >
  Use when the user requests planning, implementation, or changes to the email/form-to-email system.
  Triggers on keywords like "planejar", "implementar", "criar", "modificar", "adicionar",
  "fazer", "construir", "melhorar", or any request involving forms, email sending, campos,
  or retorno fields. Always load this skill before writing code.
---

# plan_email

## Principle
**Plan before coding.** Every change touches multiple layers. Trace the full data flow before modifying any file.

## Pre-Flight (always before coding)

1. **Load AGENTS.md** — project-specific conventions and gotchas (this is the source of truth for specifics)
2. **Load clean-code-principles** — modularity and clean code rules
3. **Read current source** — never assume; verify what exists now
4. **Read test files** for the area — understand expected behavior
5. **Run the test suite** before and after — confirm nothing broke

## Planning Workflow

### 1. Understand the Request
Ask clarifying questions before coding:
- Which section(s) are affected? (início, retorno, equipamentos, anexos, revisão)
- Is this adding, modifying, or removing something?
- Are there conditional/dependency rules?
- Will this affect saved data (restore compatibility)?

### 2. Trace the Data Flow
```
Field definitions (source of truth)
  → Form render
    → User fills form
      → Data getter (may filter/skip fields)
        → Validation
          → Email composition
            → Send (Netlify Function → SMTP)
```
**Every layer above must be updated when fields, logic, or behavior changes.**

### 3. Identify All Touch Points
List every file involved. Typical categories:
- **Definitions** — where fields/types are declared
- **Rendering** — how fields are displayed in the form
- **Logic** — conditional visibility, data transformation
- **Validation** — which fields are required, skipped, or transformed
- **Email output** — how data appears in the email body
- **Persistence** — save/restore compatibility
- **Tests** — always cover new behavior
- **Assets** — bump cache if static files changed

### 4. After Implementation
- Verify: null/empty values don't crash any step
- Verify: conditional/dependent fields hide/show correctly
- Verify: saved data restores correctly (backward compatibility)
- Run full test suite — all tests must pass

## General Principles

- **One thing at a time** — plan the full change, but implement in focused steps
- **Test first where possible** — write tests before implementation for new behavior
- **Don't duplicate AGENTS.md** — this skill covers *how* to plan; AGENTS.md covers *what* the project needs
- **Consider backward compatibility** — saved data, field names, conditional logic
- **Cross-reference with existing tests** — they encode the expected contract

## Required Co-Skills
- **AGENTS.md** (project root) — always load first for project-specific facts
- **clean-code-principles** (.opencode/skills/clean-code-principles/) — always load before code changes
