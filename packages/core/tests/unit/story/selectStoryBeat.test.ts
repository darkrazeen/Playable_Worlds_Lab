import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { createWorldSession } from "../../../src/schemas/worldSession.js";
import { parseWorldDefinition } from "../../../src/schemas/worldDefinition.js";
import { selectStoryBeat, selectStoryBeatById } from "../../../src/story/selectStoryBeat.js";
import { loadWorldFromFile } from "../../../src/world/loadWorld.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const contentRoot = join(__dirname, "../../../../content");
const stonepassWorldPath = join(contentRoot, "worlds/stonepass/stonepass-valley.world.json");

function loadMinimalWorld() {
  return parseWorldDefinition(
    JSON.parse(
      readFileSync(
        join(contentRoot, "examples/world-definition-stonepass-minimal.example.json"),
        "utf8",
      ),
    ),
  );
}

describe("selectStoryBeat", () => {
  it("selects the current beat when it has no flag gates", () => {
    const world = loadMinimalWorld();
    const session = createWorldSession(
      {
        id: "session_select_current",
        worldId: world.id,
        worldVersionId: "world_stonepass_valley_v1",
        startingBeatId: world.startingBeatId,
      },
      world,
    );

    const result = selectStoryBeat(world, session);

    expect(result.ok).toBe(true);
    expect(result.source).toBe("current");
    expect(result.beat?.id).toBe("beat_ogre_bridge");
  });

  it("selects a flag-gated beat when the session ledger satisfies requiredFlags", () => {
    const world = loadWorldFromFile(stonepassWorldPath).world!;
    const session = createWorldSession(
      {
        id: "session_landslide",
        worldId: world.id,
        worldVersionId: "world_stonepass_valley_v1",
        startingBeatId: "beat_landslide_aftermath",
      },
      world,
    );
    session.ledger.activeFlags = ["landslide_triggered"];

    const result = selectStoryBeat(world, session);

    expect(result.ok).toBe(true);
    expect(result.source).toBe("current");
    expect(result.beat?.id).toBe("beat_landslide_aftermath");
  });

  it("ignores a blocked beat and selects the next accessible beat", () => {
    const world = loadWorldFromFile(stonepassWorldPath).world!;
    const session = createWorldSession(
      {
        id: "session_blocked_valley",
        worldId: world.id,
        worldVersionId: "world_stonepass_valley_v1",
        startingBeatId: "beat_valley_square",
      },
      world,
    );

    const result = selectStoryBeat(world, session);

    expect(result.ok).toBe(true);
    expect(result.source).toBe("next");
    expect(result.beat?.id).toBe("beat_ogre_bridge");
  });

  it("fails gracefully when currentBeatId is missing from the world", () => {
    const world = loadMinimalWorld();
    const session = createWorldSession(
      {
        id: "session_missing_beat",
        worldId: world.id,
        worldVersionId: "world_stonepass_valley_v1",
        startingBeatId: world.startingBeatId,
      },
      world,
    );
    session.currentBeatId = "beat_does_not_exist";

    const result = selectStoryBeat(world, session);

    expect(result.ok).toBe(false);
    expect(result.beat).toBeUndefined();
    expect(result.errors.some((error) => error.includes("not found"))).toBe(true);
  });

  it("fails gracefully when no beats are accessible", () => {
    const world = parseWorldDefinition({
      ...loadMinimalWorld(),
      storyBeats: [
        {
          id: "beat_locked",
          title: "Locked",
          description: "Requires a flag.",
          trigger: "test",
          requiredFlags: ["flag_required"],
          availableChoices: [
            {
              id: "choice_one",
              label: "One",
              consequenceId: "consequence_fight_ogre",
            },
          ],
          possibleConsequences: ["consequence_fight_ogre"],
        },
      ],
      startingBeatId: "beat_locked",
    });
    const session = createWorldSession(
      {
        id: "session_no_access",
        worldId: world.id,
        worldVersionId: "world_stonepass_valley_v1",
        startingBeatId: "beat_locked",
      },
      world,
    );

    const result = selectStoryBeat(world, session);

    expect(result.ok).toBe(false);
    expect(result.errors.some((error) => error.includes("no accessible story beat"))).toBe(true);
  });
});

describe("selectStoryBeatById", () => {
  it("selects an accessible beat by id", () => {
    const world = loadWorldFromFile(stonepassWorldPath).world!;
    const session = createWorldSession(
      {
        id: "session_by_id",
        worldId: world.id,
        worldVersionId: "world_stonepass_valley_v1",
        startingBeatId: world.startingBeatId,
      },
      world,
    );
    session.ledger.activeFlags = ["dragon_awake"];

    const result = selectStoryBeatById(world, session, "beat_dragon_stirring");

    expect(result.ok).toBe(true);
    expect(result.beat?.isEnding).toBe(true);
  });

  it("rejects blocked beats by id", () => {
    const world = loadWorldFromFile(stonepassWorldPath).world!;
    const session = createWorldSession(
      {
        id: "session_by_id_blocked",
        worldId: world.id,
        worldVersionId: "world_stonepass_valley_v1",
        startingBeatId: world.startingBeatId,
      },
      world,
    );

    const result = selectStoryBeatById(world, session, "beat_valley_square");

    expect(result.ok).toBe(false);
    expect(result.errors.some((error) => error.includes("blocked"))).toBe(true);
  });
});
