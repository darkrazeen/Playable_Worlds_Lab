import type { FakeProviderScenario } from "./fakeProvider.js";

/** Deterministic director success for Stonepass fight → landslide path. */
export const STONEPASS_DIRECTOR_LANDSLIDE: FakeProviderScenario = {
  kind: "success",
  value: {
    action: "select_next_beat",
    targetId: "beat_landslide_aftermath",
    reason: "Player defeated the ogre and triggered the landslide; advance to the aftermath beat.",
    confidence: 0.82,
    safetyNotes: ["teen-safe combat resolution"],
  },
  latencyMs: 12,
};

/** Deterministic director success for peaceful ogre crossing → valley. */
export const STONEPASS_DIRECTOR_VALLEY: FakeProviderScenario = {
  kind: "success",
  value: {
    action: "select_next_beat",
    targetId: "beat_valley_square",
    reason: "Player crossed peacefully; the antechamber beat fits current flags.",
    confidence: 0.75,
  },
  latencyMs: 10,
};

export const STONEPASS_DIRECTOR_INVALID: FakeProviderScenario = {
  kind: "invalid",
  raw: { action: "bad_action", targetId: "x", reason: "x", confidence: 2 },
  latencyMs: 5,
};

export const STONEPASS_DIRECTOR_ERROR: FakeProviderScenario = {
  kind: "error",
  message: "Simulated director provider outage",
};

/** Catalog for seed-based selection in tests (two variants). */
export const STONEPASS_DIRECTOR_SEED_CATALOG: FakeProviderScenario[] = [
  STONEPASS_DIRECTOR_LANDSLIDE,
  STONEPASS_DIRECTOR_VALLEY,
];
