# Flag lifecycle (WorldLedger)

Contract for `activeFlags`, `resolvedFlags`, and gate fields `requiredFlags` / `blockedByFlags` on beats, choices, and consequences.

## Lists

| Field | Meaning |
| --- | --- |
| `activeFlags` | Flags currently true in the session |
| `resolvedFlags` | Flags settled by `removeFlags` — no longer active |

Rules:

1. No duplicate entries in either list (normalized on write).
2. A flag must not appear in both `activeFlags` and `resolvedFlags`.

## Consequence mutations

Applied in order via `applyFlagChanges()`:

1. **removeFlags** — Remove from `activeFlags` if present; append to `resolvedFlags` (records settlement even when the flag was never active, e.g. implicit world flags).
2. **addFlags** — Append to `activeFlags`; remove from `resolvedFlags` if the flag is reactivated.

## Gates (beats, choices, consequences)

| Gate | Rule |
| --- | --- |
| `requiredFlags` | Every flag must be in `activeFlags`, unless exempt (`system_*`, `external_*`) |
| `blockedByFlags` | No flag may be in `activeFlags` |

Accessibility helpers (`satisfiesFlagRequirements`) and precondition validation share this logic.

## Validation

`WorldLedgerSchema` rejects duplicate or overlapping flag lists. `validateLedgerFlags()` is available for ad-hoc checks.
