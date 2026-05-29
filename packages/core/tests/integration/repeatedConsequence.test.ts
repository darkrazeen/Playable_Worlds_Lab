import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { applyPlayerChoice } from "../../src/runtime/applyConsequence.js";
import { listAvailableChoices } from "../../src/runtime/resolvePlayerChoice.js";
import { initializeWorldSession } from "../../src/session/initializeWorldSession.js";
import { loadWorld } from "../../src/world/loadWorld.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const contentRoot = join(__dirname, "../../../content");

describe("repeated consequence application", () => {
  it("assigns unique world event ids per turn when the same consequence is applied twice", () => {
    const world = loadWorld("world_stonepass_valley", contentRoot).world!;
    const init = initializeWorldSession(world, { sessionId: "session_repeat_event_ids" });

    const first = applyPlayerChoice(world, init.session!, "fight_ogre");
    expect(first.ok).toBe(true);

    const second = applyPlayerChoice(world, first.session!, "fight_ogre");
    expect(second.ok).toBe(false);

    const eventIds = first.session!.ledger.worldEvents.map((event) => event.id);
    expect(eventIds).toEqual(["event_fight_ogre_t1"]);
    expect(new Set(eventIds).size).toBe(eventIds.length);
  });

  it("does not offer ogre bridge choices after bridge_open", () => {
    const world = loadWorld("world_stonepass_valley", contentRoot).world!;
    const init = initializeWorldSession(world, { sessionId: "session_no_ogre_replay" });

    const applyResult = applyPlayerChoice(world, init.session!, "fight_ogre");
    expect(applyResult.ok).toBe(true);
    expect(applyResult.session?.currentBeatId).toBe("beat_landslide_aftermath");

    const choices = listAvailableChoices(world, applyResult.session!);
    expect(choices.ok).toBe(true);
    expect(choices.beat?.id).toBe("beat_landslide_aftermath");
    expect(choices.choices?.map((choice) => choice.id)).not.toContain("fight_ogre");
  });
});
