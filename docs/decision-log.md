# Decision log

Cumulative human-approved decisions (see also [AGENT_SESSION_HANDOFF.md §9](../AGENT_SESSION_HANDOFF.md#9-human-decisions-cumulative)).

| Decision | Detail |
| --- | --- |
| **Contract Option C** | v4.1 naming spine + v4.2 extensions; FULL_CURSOR §22 |
| **No separate contract file** | v4.2 lives in §22 only |
| **Stonepass ambition** | Rich showcase (v2) later; finish Phase 0 + v1 proof path first |
| **AI Director leeway** | AI proposes; engine owns ledger truth |
| **Package manager** | npm workspaces |
| **Step tracker detail** | Five documentation columns required post-step |
| **ID naming** | `lowercase_snake_case` entity IDs enforced in Zod (2026-05-28) |
| **Validation errors** | `parseAndValidateWorldDefinition` returns `{ ok, errors }` for schema and graph failures (2026-05-28) |
