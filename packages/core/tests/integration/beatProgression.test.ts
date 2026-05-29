import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { applyPlayerChoice } from "../../src/runtime/applyConsequence.js";
import { listAvailableChoices } from "../../src/runtime/resolvePlayerChoice.js";
import { initializeWorldSession } from "../../src/session/initializeWorldSession.js";
import { loadWorld } from "../../src/world/loadWorld.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const contentRoot = join(__dirname, "../../../content");

describe("beat progression after ogre bridge", () => {
  it("advances to landslide aftermath after fight_ogre", () => {
    const world = loadWorld("world_stonepass_valley", contentRoot).world!;
    const init = initializeWorldSession(world, { sessionId: "session_beat_fight" });

    const result = applyPlayerChoice(world, init.session!, "fight_ogre");
    expect(result.ok).toBe(true);
    expect(result.session?.currentBeatId).toBe("beat_landslide_aftermath");

    const view = listAvailableChoices(world, result.session!);
    expect(view.beat?.title).toBe("After the Landslide");
    expect(view.choices?.map((c) => c.id)).toEqual(["enter_hidden_cave", "survey_landslide"]);
  });

  it("advances to valley square after a peaceful ogre crossing", () => {
    const world = loadWorld("world_stonepass_valley", contentRoot).world!;
    const init = initializeWorldSession(world, { sessionId: "session_beat_trick" });

    const result = applyPlayerChoice(world, init.session!, "trick_ogre");
    expect(result.ok).toBe(true);
    expect(result.session?.currentBeatId).toBe("beat_valley_square");

    const view = listAvailableChoices(world, result.session!);
    expect(view.beat?.title).toBe("Spire Antechamber");
  });
});
