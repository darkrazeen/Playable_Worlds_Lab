import type { WorldDefinition, WorldSession } from "@playable-worlds/core/schemas";

import {
  createAIGateway,
  createDirectorAgent,
  FakeProvider,
  STONEPASS_DIRECTOR_SEED_CATALOG,
  type AIGateway,
} from "@playable-worlds/ai";

import { buildDirectorReasoningEntry } from "./buildDirectorReasoningEntry.js";
import type { DirectorReasoningEntry } from "./directorReasoningTypes.js";

export type FetchDirectorReasoningOptions = {
  /** Injectable gateway for tests; defaults to Stonepass FakeProvider catalog. */
  gateway?: AIGateway;
};

/**
 * Request a read-only Director beat suggestion for inspection (does not mutate play session).
 * Uses FakeProvider catalog on the client so `/play` works without server env vars.
 */
export async function fetchDirectorReasoning(
  session: WorldSession,
  world: WorldDefinition,
  options: FetchDirectorReasoningOptions = {},
): Promise<DirectorReasoningEntry> {
  const gateway =
    options.gateway ??
    createAIGateway(
      new FakeProvider({
        scenarioCatalog: STONEPASS_DIRECTOR_SEED_CATALOG,
      }),
    );

  const agent = createDirectorAgent(gateway);
  const { result } = await agent.suggestNextBeat({ session, world });

  return buildDirectorReasoningEntry(result, {
    task: "director_select_next_beat",
    turnNumber: session.turnNumber,
  });
}
