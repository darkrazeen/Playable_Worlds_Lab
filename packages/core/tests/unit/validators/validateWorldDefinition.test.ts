import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  parseWorldDefinition,
  validateWorldDefinition,
  type WorldDefinition,
} from "../../../src/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const examplesDir = join(__dirname, "../../../../content/examples");

function loadMinimalWorld(): WorldDefinition {
  return parseWorldDefinition(
    JSON.parse(
      readFileSync(join(examplesDir, "world-definition-stonepass-minimal.example.json"), "utf8"),
    ),
  );
}

describe("validateWorldDefinition", () => {
  it("accepts world-definition-stonepass-minimal.example.json", () => {
    const world = loadMinimalWorld();
    const result = validateWorldDefinition(world);
    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("rejects missing startingBeatId target", () => {
    const world = loadMinimalWorld();
    world.startingBeatId = "beat_does_not_exist";
    const result = validateWorldDefinition(world);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes("startingBeatId"))).toBe(true);
  });

  it("rejects choice consequenceId that does not exist", () => {
    const world = loadMinimalWorld();
    world.storyBeats[0]!.availableChoices[0]!.consequenceId = "consequence_missing";
    const result = validateWorldDefinition(world);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes("unknown consequence"))).toBe(true);
  });

  it("rejects possibleConsequences entry that does not exist", () => {
    const world = loadMinimalWorld();
    world.storyBeats[0]!.possibleConsequences.push("consequence_phantom");
    const result = validateWorldDefinition(world);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes("possibleConsequences"))).toBe(true);
  });

  it("rejects duplicate story beat ids", () => {
    const world = loadMinimalWorld();
    const duplicate = { ...world.storyBeats[0]!, id: world.storyBeats[0]!.id };
    world.storyBeats.push(duplicate);
    const result = validateWorldDefinition(world);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes("duplicate_id"))).toBe(true);
  });

  it("rejects duplicate choice ids across beats", () => {
    const world = loadMinimalWorld();
    world.storyBeats.push({
      ...world.storyBeats[0]!,
      id: "beat_second",
      title: "Second",
      trigger: "second",
      requiredFlags: ["ogre_defeated"],
    });
    const result = validateWorldDefinition(world);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes("choice id"))).toBe(true);
  });

  it("rejects consequence temporaryInstances reference to missing instance", () => {
    const world = loadMinimalWorld();
    world.consequences[0]!.temporaryInstances.push("instance_missing");
    const result = validateWorldDefinition(world);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes("temporary instance"))).toBe(true);
  });

  it("rejects completionConsequenceId pointing to missing consequence", () => {
    const world = loadMinimalWorld();
    world.temporaryInstances[0]!.completionConsequenceId = "consequence_missing";
    const result = validateWorldDefinition(world);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes("completionConsequenceId"))).toBe(true);
  });

  it("rejects requiredFlags that are never produced or preconditioned", () => {
    const world = loadMinimalWorld();
    world.storyBeats.push({
      id: "beat_locked_gate",
      title: "Locked Gate",
      description: "A gate that cannot be reached.",
      trigger: "gate",
      availableChoices: [
        {
          id: "open_gate",
          label: "Open",
          consequenceId: "consequence_fight_ogre",
          requiredFlags: ["flag_never_defined_anywhere"],
        },
      ],
      possibleConsequences: ["consequence_fight_ogre"],
      requiredFlags: ["flag_never_defined_anywhere"],
    });
    const result = validateWorldDefinition(world);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes("flag_never_defined_anywhere"))).toBe(true);
  });

  it("rejects unreachable non-hidden beats", () => {
    const world = loadMinimalWorld();
    world.storyBeats.push({
      id: "beat_unreachable",
      title: "Unreachable",
      description: "No consequence in the world ever produces the beat gate flag.",
      trigger: "unreachable",
      availableChoices: [
        {
          id: "do_unreachable",
          label: "Try",
          consequenceId: "consequence_trick_ogre",
        },
      ],
      possibleConsequences: ["consequence_trick_ogre"],
      requiredFlags: ["flag_no_producer_in_world"],
    });
    const result = validateWorldDefinition(world);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes("unreachable"))).toBe(true);
  });

  it("allows system_ and external_ flags without production", () => {
    const world = loadMinimalWorld();
    world.storyBeats[0]!.requiredFlags = ["system_intro_complete"];
    const result = validateWorldDefinition(world);
    expect(result.ok).toBe(true);
  });
});
