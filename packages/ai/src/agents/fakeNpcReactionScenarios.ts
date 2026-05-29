import type { FakeProviderScenario } from "../providers/fakeProvider.js";

export const STONEPASS_OGRE_REACTION: FakeProviderScenario = {
  kind: "success",
  value: {
    npcId: "npc_ogre",
    line: 'The ogre gives a gruff grunt and plants his club. "Toll is three silver—no sneaking past."',
  },
  latencyMs: 8,
};

export const STONEPASS_ELDER_REACTION: FakeProviderScenario = {
  kind: "success",
  value: {
    npcId: "npc_elder",
    line: 'Elder Mara offers a warm but cautious nod. "The valley remembers every choice you make."',
  },
  latencyMs: 10,
};

/** Fails teen safety validation when used as a successful provider payload. */
export const STONEPASS_UNSAFE_TEEN_REACTION: FakeProviderScenario = {
  kind: "success",
  value: {
    npcId: "npc_ogre",
    line: "I'll damn well crush you if you cross without paying.",
  },
};

/** Valid schema but missing ogre tone keywords (gruff, simple, teen-safe, etc.). */
export const STONEPASS_OFF_TONE_OGRE_REACTION: FakeProviderScenario = {
  kind: "success",
  value: {
    npcId: "npc_ogre",
    line: "The pastry chef waves a delicate hand and hums a lullaby.",
  },
};
