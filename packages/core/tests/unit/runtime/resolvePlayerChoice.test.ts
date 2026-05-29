import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { createWorldSession } from "../../../src/schemas/worldSession.js";
import { parseWorldDefinition } from "../../../src/schemas/worldDefinition.js";
import {
  listAvailableChoices,
  resolvePlayerChoice,
} from "../../../src/runtime/resolvePlayerChoice.js";
import { loadWorldFromFile } from "../../../src/world/loadWorld.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const contentRoot = join(__dirname, "../../../../content");
const stonepassWorldPath = join(contentRoot, "worlds/stonepass/stonepass-valley.world.json");

const ogreChoices = ["fight_ogre", "trick_ogre", "feed_ogre", "talk_ogre", "sneak_ogre"] as const;

describe("resolvePlayerChoice", () => {
  it("resolves all five ogre bridge choices on Stonepass", () => {
    const world = loadWorldFromFile(stonepassWorldPath).world!;
    const session = createWorldSession(
      {
        id: "session_resolve_ogre",
        worldId: world.id,
        worldVersionId: "world_stonepass_valley_v1",
        startingBeatId: world.startingBeatId,
      },
      world,
    );

    for (const choiceId of ogreChoices) {
      const result = resolvePlayerChoice(world, session, choiceId);

      expect(result.ok).toBe(true);
      expect(result.beat?.id).toBe("beat_ogre_bridge");
      expect(result.choice?.id).toBe(choiceId);
      expect(result.consequenceId).toBe(`consequence_${choiceId}`);
    }
  });

  it("rejects a fake choice id", () => {
    const world = loadWorldFromFile(stonepassWorldPath).world!;
    const session = createWorldSession(
      {
        id: "session_fake_choice",
        worldId: world.id,
        worldVersionId: "world_stonepass_valley_v1",
        startingBeatId: world.startingBeatId,
      },
      world,
    );

    const result = resolvePlayerChoice(world, session, "choice_does_not_exist");

    expect(result.ok).toBe(false);
    expect(result.choice).toBeUndefined();
    expect(result.errors.some((error) => error.includes("not found on beat"))).toBe(true);
  });

  it("rejects a choice blocked by unmet requiredFlags", () => {
    const world = parseWorldDefinition({
      ...loadWorldFromFile(stonepassWorldPath).world!,
      storyBeats: [
        {
          id: "beat_gated",
          title: "Gated",
          description: "A gated beat.",
          trigger: "test",
          availableChoices: [
            {
              id: "locked_choice",
              label: "Locked",
              requiredFlags: ["flag_required"],
              consequenceId: "consequence_fight_ogre",
            },
            {
              id: "open_choice",
              label: "Open",
              consequenceId: "consequence_trick_ogre",
            },
          ],
          possibleConsequences: ["consequence_fight_ogre", "consequence_trick_ogre"],
        },
      ],
      startingBeatId: "beat_gated",
    });
    const session = createWorldSession(
      {
        id: "session_blocked_choice",
        worldId: world.id,
        worldVersionId: "world_stonepass_valley_v1",
        startingBeatId: "beat_gated",
      },
      world,
    );

    const blocked = resolvePlayerChoice(world, session, "locked_choice");
    const open = resolvePlayerChoice(world, session, "open_choice");

    expect(blocked.ok).toBe(false);
    expect(blocked.errors.some((error) => error.includes("blocked by session flags"))).toBe(true);
    expect(open.ok).toBe(true);
  });

  it("rejects a choice blocked by active blockedByFlags", () => {
    const world = parseWorldDefinition({
      ...loadWorldFromFile(stonepassWorldPath).world!,
      storyBeats: [
        {
          id: "beat_blocked",
          title: "Blocked",
          description: "A blocked beat.",
          trigger: "test",
          availableChoices: [
            {
              id: "blocked_choice",
              label: "Blocked",
              blockedByFlags: ["flag_blocks_choice"],
              consequenceId: "consequence_fight_ogre",
            },
          ],
          possibleConsequences: ["consequence_fight_ogre"],
        },
      ],
      startingBeatId: "beat_blocked",
    });
    const session = createWorldSession(
      {
        id: "session_blocked_by_flag",
        worldId: world.id,
        worldVersionId: "world_stonepass_valley_v1",
        startingBeatId: "beat_blocked",
      },
      world,
    );
    session.ledger.activeFlags = ["flag_blocks_choice"];

    const result = resolvePlayerChoice(world, session, "blocked_choice");

    expect(result.ok).toBe(false);
    expect(result.errors.some((error) => error.includes("blocked by session flags"))).toBe(true);
  });
});

describe("listAvailableChoices", () => {
  it("lists only flag-accessible choices on the selected beat", () => {
    const world = parseWorldDefinition({
      ...loadWorldFromFile(stonepassWorldPath).world!,
      storyBeats: [
        {
          id: "beat_mixed",
          title: "Mixed",
          description: "Mixed choices.",
          trigger: "test",
          availableChoices: [
            {
              id: "locked_choice",
              label: "Locked",
              requiredFlags: ["flag_required"],
              consequenceId: "consequence_fight_ogre",
            },
            {
              id: "open_choice",
              label: "Open",
              consequenceId: "consequence_trick_ogre",
            },
          ],
          possibleConsequences: ["consequence_fight_ogre", "consequence_trick_ogre"],
        },
      ],
      startingBeatId: "beat_mixed",
    });
    const session = createWorldSession(
      {
        id: "session_list_choices",
        worldId: world.id,
        worldVersionId: "world_stonepass_valley_v1",
        startingBeatId: "beat_mixed",
      },
      world,
    );

    const result = listAvailableChoices(world, session);

    expect(result.ok).toBe(true);
    expect(result.choices?.map((choice) => choice.id)).toEqual(["open_choice"]);
  });
});
