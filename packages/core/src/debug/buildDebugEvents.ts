import type { DebugEvent } from "../schemas/debugEvent.js";
import type { WorldLedger } from "../schemas/worldLedger.js";

export type ChoiceSelectedDebugInput = {
  turnNumber: number;
  choiceId: string;
  choiceLabel?: string;
  beatId?: string;
};

export type ConsequenceAppliedDebugInput = {
  turnNumber: number;
  consequenceId: string;
  choiceId?: string;
  visibleChanges?: string[];
};

export type FlagsChangedDebugInput = {
  turnNumber: number;
  consequenceId: string;
  before: Pick<WorldLedger, "activeFlags" | "resolvedFlags">;
  after: Pick<WorldLedger, "activeFlags" | "resolvedFlags">;
};

export type GoalUnlockedDebugInput = {
  turnNumber: number;
  goalId: string;
  consequenceId: string;
};

export type ValidationFailedDebugInput = {
  turnNumber: number;
  errors: string[];
  metadata?: Record<string, unknown>;
  /** Disambiguates multiple validation failures on the same turn. */
  sequence?: number;
};

export type SessionLoadedDebugInput = {
  sessionId: string;
  turnNumber: number;
  startingBeatId: string;
  worldVersionId: string;
};

export function buildChoiceSelectedEvent(input: ChoiceSelectedDebugInput): DebugEvent {
  return {
    id: `debug_choice_${input.choiceId}`,
    turnNumber: input.turnNumber,
    type: "choice_selected",
    summary: input.choiceLabel
      ? `Player chose ${input.choiceLabel}.`
      : `Player chose ${input.choiceId}.`,
    metadata: {
      choiceId: input.choiceId,
      ...(input.beatId ? { beatId: input.beatId } : {}),
    },
  };
}

export function buildConsequenceAppliedEvent(
  input: ConsequenceAppliedDebugInput,
): DebugEvent {
  return {
    id: `debug_consequence_${input.consequenceId.replace(/^consequence_/, "")}`,
    turnNumber: input.turnNumber,
    type: "consequence_applied",
    summary: `Applied ${input.consequenceId}.`,
    metadata: {
      consequenceId: input.consequenceId,
      ...(input.choiceId ? { choiceId: input.choiceId } : {}),
      ...(input.visibleChanges && input.visibleChanges.length > 0
        ? { visibleChanges: input.visibleChanges }
        : {}),
    },
  };
}

/** Returns undefined when the consequence did not change any flags. */
export function buildFlagsChangedEvent(
  input: FlagsChangedDebugInput,
): DebugEvent | undefined {
  const addedActiveFlags = input.after.activeFlags.filter(
    (flag) => !input.before.activeFlags.includes(flag),
  );
  const removedActiveFlags = input.before.activeFlags.filter(
    (flag) => !input.after.activeFlags.includes(flag),
  );
  const addedResolvedFlags = input.after.resolvedFlags.filter(
    (flag) => !input.before.resolvedFlags.includes(flag),
  );

  if (
    addedActiveFlags.length === 0 &&
    removedActiveFlags.length === 0 &&
    addedResolvedFlags.length === 0
  ) {
    return undefined;
  }

  return {
    id: `debug_flags_${input.consequenceId.replace(/^consequence_/, "")}`,
    turnNumber: input.turnNumber,
    type: "flags_changed",
    summary: `Flags updated by ${input.consequenceId}.`,
    metadata: {
      consequenceId: input.consequenceId,
      addedActiveFlags,
      removedActiveFlags,
      addedResolvedFlags,
    },
  };
}

export function buildGoalUnlockedEvent(input: GoalUnlockedDebugInput): DebugEvent {
  return {
    id: `debug_goal_${input.goalId}`,
    turnNumber: input.turnNumber,
    type: "goal_unlocked",
    summary: `Unlocked goal ${input.goalId}.`,
    metadata: { goalId: input.goalId, consequenceId: input.consequenceId },
  };
}

export function buildValidationFailedEvent(input: ValidationFailedDebugInput): DebugEvent {
  const sequence = input.sequence ?? 0;
  return {
    id: `debug_validation_failed_${input.turnNumber}_${sequence}`,
    turnNumber: input.turnNumber,
    type: "validation_failed",
    summary:
      input.errors.length === 1
        ? input.errors[0]!
        : `Validation failed (${input.errors.length} issues).`,
    metadata: {
      errors: input.errors,
      ...input.metadata,
    },
  };
}

export function buildSessionLoadedEvent(input: SessionLoadedDebugInput): DebugEvent {
  return {
    id: `debug_session_loaded_${input.sessionId}`,
    turnNumber: input.turnNumber,
    type: "session_loaded",
    summary: `World session started at ${input.startingBeatId}.`,
    metadata: {
      worldVersionId: input.worldVersionId,
      startingBeatId: input.startingBeatId,
    },
  };
}
