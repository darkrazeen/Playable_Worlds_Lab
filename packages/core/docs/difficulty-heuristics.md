# Ledger-signal difficulty heuristics (W4-S9)

Advisory-only difficulty computation from `WorldSession` + `WorldLedger`. **Does not mutate** ledger, flags, rewards, or beats.

## APIs

| Function                                             | Role                                                         |
| ---------------------------------------------------- | ------------------------------------------------------------ |
| `computeDifficultySignals(session)`                  | Deterministic snapshot: failed checks, goals, flags, retries |
| `computeAdvisoryDifficultySignal(session, profile?)` | Bounded `suggestedTier` + `struggleLevel` + rationale        |

## Signal sources (ledger)

| Signal                | Source                                                          |
| --------------------- | --------------------------------------------------------------- |
| `failedChecks`        | `worldEvents` with `metadata.failedCheck === true`              |
| `consequenceCount`    | `worldEvents` where `type === "consequence"`                    |
| `unresolvedGoals`     | `unlockedGoals.length - completedGoals.length`                  |
| `retriesThisInstance` | `metadata.retry === true` scoped to `activeTemporaryInstanceId` |
| `highestGearTier`     | max `metadata.gearTier` on events (optional)                    |

## Draft profile

`DifficultyProfileSchema` holds immutable bounds for W4-S10 / W8-S20. Default range `[1, 3]`, base tier `normal` → `2`.

## Next steps

- **W4-S10** — `adjust_difficulty` DirectorDecision + clamp/apply
- **W8-S20** — full `DifficultyProfile` on WorldBlueprint

See [Future_Features/Dynamic_Difficulty_Director.md](../../Future_Features/Dynamic_Difficulty_Director.md).
