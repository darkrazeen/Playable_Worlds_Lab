import { appendDebugEvent } from "../debug/appendDebugEvent.js";
import { buildSessionLoadedEvent } from "../debug/buildDebugEvents.js";
import { resolveSessionGenerationSeed } from "../runtime/generationSeed.js";
import type { WorldDefinition } from "../schemas/worldDefinition.js";
import {
  createWorldSession,
  safeParseWorldSession,
  type WorldSession,
} from "../schemas/worldSession.js";
import { ZodError } from "zod";

export type InitializeWorldSessionInput = {
  sessionId: string;
  worldVersionId?: string;
  /** Override world.generationSeed for this run. */
  generationSeed?: string;
};

export type InitializeWorldSessionResult = {
  ok: boolean;
  errors: string[];
  session?: WorldSession;
};

/** Create a play-ready session from a validated world at its startingBeatId. */
export function initializeWorldSession(
  world: WorldDefinition,
  input: InitializeWorldSessionInput,
): InitializeWorldSessionResult {
  if (!world.storyBeats.some((beat) => beat.id === world.startingBeatId)) {
    return {
      ok: false,
      errors: [
        `session: startingBeatId "${world.startingBeatId}" not found in world "${world.id}"`,
      ],
    };
  }

  const worldVersionId = input.worldVersionId ?? `${world.id}_v1`;
  const generationSeed = resolveSessionGenerationSeed({
    sessionId: input.sessionId,
    worldId: world.id,
    worldGenerationSeed: world.generationSeed,
    explicitSeed: input.generationSeed,
  });

  let session: WorldSession;
  try {
    session = createWorldSession(
      {
        id: input.sessionId,
        worldId: world.id,
        worldVersionId,
        startingBeatId: world.startingBeatId,
        generationSeed,
      },
      world,
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        ok: false,
        errors: error.issues.map(
          (issue) => `session: ${issue.path.join(".") || "<root>"}: ${issue.message}`,
        ),
      };
    }
    throw error;
  }

  const validation = safeParseWorldSession(session);
  if (!validation.success) {
    return {
      ok: false,
      errors: validation.error.issues.map(
        (issue) => `session: ${issue.path.join(".") || "<root>"}: ${issue.message}`,
      ),
    };
  }

  const sessionWithTrace = appendDebugEvent(
    validation.data,
    buildSessionLoadedEvent({
      sessionId: input.sessionId,
      turnNumber: 0,
      startingBeatId: world.startingBeatId,
      worldVersionId,
      generationSeed,
    }),
  );

  return { ok: true, errors: [], session: sessionWithTrace };
}
