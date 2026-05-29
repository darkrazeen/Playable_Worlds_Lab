import { describe, expect, it } from "vitest";

import { DirectorDecisionSchema } from "@playable-worlds/core";

import {
  FakeProvider,
  hashGenerationSeed,
  resolveFakeProviderScenario,
} from "../../../src/providers/fakeProvider.js";
import {
  STONEPASS_DIRECTOR_LANDSLIDE,
  STONEPASS_DIRECTOR_SEED_CATALOG,
  STONEPASS_DIRECTOR_VALLEY,
} from "../../../src/providers/fakeProviderScenarios.js";
import type { AIRequest } from "../../../src/index.js";

const directorRequest: AIRequest = {
  task: "director_select_next_beat",
  prompt: "Suggest the next story beat.",
  generationSeed: "seed_alpha",
};

describe("FakeProvider seed and scenario resolution", () => {
  it("hashGenerationSeed is stable for the same input", () => {
    expect(hashGenerationSeed("seed_alpha")).toBe(hashGenerationSeed("seed_alpha"));
    expect(hashGenerationSeed("seed_alpha")).not.toBe(hashGenerationSeed("seed_beta"));
  });

  it("selects the same catalog scenario for the same generationSeed", () => {
    const options = { scenarioCatalog: STONEPASS_DIRECTOR_SEED_CATALOG };

    const first = resolveFakeProviderScenario(
      { ...directorRequest, generationSeed: "replay_seed_42" },
      options,
    );
    const second = resolveFakeProviderScenario(
      { ...directorRequest, generationSeed: "replay_seed_42" },
      options,
    );

    expect(first).toEqual(second);
    expect(first.kind).toBe("success");
  });

  it("can map different seeds to different catalog slots", () => {
    const seeds = ["seed_a", "seed_b", "seed_c", "seed_d", "seed_e"];
    const resolved = seeds.map((generationSeed) =>
      resolveFakeProviderScenario(
        { ...directorRequest, generationSeed },
        { scenarioCatalog: STONEPASS_DIRECTOR_SEED_CATALOG },
      ),
    );

    const targetIds = resolved
      .filter((scenario) => scenario.kind === "success")
      .map((scenario) => (scenario as { value: { targetId: string } }).value.targetId);

    expect(new Set(targetIds).size).toBeGreaterThan(1);
  });

  it("responsesBySeed bundle supports per-task overrides", () => {
    const scenario = resolveFakeProviderScenario(
      { task: "npc_reaction", prompt: "React.", generationSeed: "bundle_seed" },
      {
        responsesBySeed: {
          bundle_seed: {
            default: STONEPASS_DIRECTOR_LANDSLIDE,
            byTask: {
              npc_reaction: { kind: "success", value: { line: "The ogre grunts." } },
            },
          },
        },
      },
    );

    expect(scenario.kind).toBe("success");
    expect((scenario as { value: { line: string } }).value.line).toBe("The ogre grunts.");
  });

  it("replays identical AIResult for the same seed and task across calls", async () => {
    const provider = new FakeProvider({
      scenarioCatalog: STONEPASS_DIRECTOR_SEED_CATALOG,
    });

    const request = {
      ...directorRequest,
      generationSeed: "deterministic_replay_seed",
    };

    const first = await provider.generateStructured(request, DirectorDecisionSchema);
    const second = await provider.generateStructured(request, DirectorDecisionSchema);

    expect(first.ok).toBe(second.ok);
    expect(first.value).toEqual(second.value);
    expect(first.generationSeed).toBe("deterministic_replay_seed");
  });

  it("responsesBySeed single scenario beats catalog for that seed", () => {
    const resolved = resolveFakeProviderScenario(
      { ...directorRequest, generationSeed: "pinned_seed" },
      {
        scenarioCatalog: STONEPASS_DIRECTOR_SEED_CATALOG,
        responsesBySeed: {
          pinned_seed: STONEPASS_DIRECTOR_VALLEY,
        },
      },
    );

    expect(resolved).toEqual(STONEPASS_DIRECTOR_VALLEY);
  });
});
