import type { DirectorDecision } from "@playable-worlds/core/schemas";

/** Read-only view model for the Director reasoning panel (no session mutation). */
export type DirectorReasoningEntry = {
  decision?: DirectorDecision;
  fallbackUsed: boolean;
  ok: boolean;
  provider: string;
  validationErrors?: string[];
  generationSeed?: string;
  task?: string;
  turnNumber?: number;
};
