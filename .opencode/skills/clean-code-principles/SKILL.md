---
name: clean-code-principles
description: >
  Always-on rules for modularity, dependency management, clean code, and planning.
  Covers single responsibility, high cohesion, low coupling, dependency injection,
  acyclic import graphs, DRY, small functions, no hidden side effects, intention-revealing
  names, testability, and fail-fast. Must be loaded before any code change.
---

## Planning

1. **Think before coding** — understand the problem, explore the codebase, plan the approach before touching any file
2. **Consider alternatives** — don't settle on the first solution; weigh trade-offs
3. **Design for change** — structure code so future modifications are local, not cascading

## Modularity

4. **Single responsibility** — each file/function solves one problem
5. **High cohesion** — what belongs together stays together
6. **Low coupling** — modules communicate via parameters/returns, not global state
7. **Hide implementation** — export the minimum, keep the rest private

## Dependencies

8. **Depend on abstractions, not details** — import interfaces/contracts
9. **No cyclic dependency** — A imports B and B imports A is forbidden
10. **Dependency injection** — pass dependencies as parameters, not hard-coded imports
11. **Acyclic graph** — imports form a tree, not a tangled graph

## Clean Code

12. **Names reveal intent** — `calculateShipping()`, not `calc()`
13. **Small functions** — ≤ 20-30 lines, does one thing
14. **No hidden side effects** — mutating external state must be explicit
15. **Don't repeat yourself (DRY)** — if you copied it, extract it
16. **Testability** — if it's hard to test, the design is wrong
17. **Comment the *why***, not the *what*
18. **Fail fast** — validate early, don't silently swallow errors
19. **Principle of least surprise** — code does what it looks like it does
