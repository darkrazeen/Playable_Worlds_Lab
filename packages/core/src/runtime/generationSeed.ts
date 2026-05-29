/** Minimal session fields needed to derive per-call AI seeds. */
export type GenerationSeedSessionContext = {
  generationSeed?: string;
  id: string;
  worldId: string;
  turnNumber: number;
};

export type ResolveSessionGenerationSeedInput = {
  sessionId: string;
  worldId: string;
  worldGenerationSeed?: string;
  explicitSeed?: string;
};

/**
 * Resolve the root generation seed for a new WorldSession.
 * Priority: explicit input → world.generationSeed → deterministic default.
 */
export function resolveSessionGenerationSeed(input: ResolveSessionGenerationSeedInput): string {
  if (input.explicitSeed) {
    return input.explicitSeed;
  }
  if (input.worldGenerationSeed) {
    return input.worldGenerationSeed;
  }
  return `${input.worldId}_${input.sessionId}`;
}

/**
 * Derive a per-call AI generationSeed from session root + turn + task.
 * Used by runtime callers and the AI Gateway when a request omits generationSeed.
 */
export function deriveAiGenerationSeed(
  session: GenerationSeedSessionContext,
  task: string,
): string {
  const root =
    session.generationSeed ??
    resolveSessionGenerationSeed({ sessionId: session.id, worldId: session.worldId });
  return `${root}_t${session.turnNumber}_${task}`;
}
