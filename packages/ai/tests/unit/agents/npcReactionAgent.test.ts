import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  initializeWorldSession,
  loadWorld,
  parseNpc,
  type WorldSession,
} from "@playable-worlds/core";

import {
  buildDefaultNpcReactionFallback,
  createNPCReactionAgent,
} from "../../../src/agents/npcReactionAgent.js";
import {
  STONEPASS_ELDER_REACTION,
  STONEPASS_OFF_TONE_OGRE_REACTION,
  STONEPASS_OGRE_REACTION,
  STONEPASS_UNSAFE_TEEN_REACTION,
} from "../../../src/agents/fakeNpcReactionScenarios.js";
import {
  lineMatchesToneRules,
  validateNpcReactionIssues,
} from "../../../src/agents/validateNpcReaction.js";
import { createAIGateway } from "../../../src/gateway/aiGateway.js";
import { FakeProvider } from "../../../src/providers/fakeProvider.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const examplesDir = join(__dirname, "../../../../content/examples");
const contentRoot = join(__dirname, "../../../../content");

const ogreNpc = parseNpc(
  JSON.parse(readFileSync(join(examplesDir, "npc-ogre.example.json"), "utf8")),
);
const elderNpc = parseNpc(
  JSON.parse(readFileSync(join(examplesDir, "npc-elder.example.json"), "utf8")),
);

const elderFallback = {
  npcId: "npc_elder" as const,
  line: 'Elder Mara offers a warm but cautious nod. "Stay alert on the road."',
};

function loadStonepassSession(): WorldSession {
  const worldResult = loadWorld("world_stonepass_valley", contentRoot);
  expect(worldResult.ok).toBe(true);
  const sessionResult = initializeWorldSession(worldResult.world!, {
    sessionId: "session_npc_reaction_test",
  });
  expect(sessionResult.ok).toBe(true);
  return sessionResult.session!;
}

function snapshotSession(session: WorldSession): string {
  return JSON.stringify(session);
}

describe("validateNpcReaction", () => {
  it("accepts ogre and elder example lines for teen mode", () => {
    const ogreLine = (STONEPASS_OGRE_REACTION as { kind: "success"; value: { line: string } }).value
      .line;
    const elderLine = (STONEPASS_ELDER_REACTION as { kind: "success"; value: { line: string } })
      .value.line;

    expect(
      validateNpcReactionIssues(
        { npcId: "npc_ogre", line: ogreLine },
        { npc: ogreNpc, safetyMode: "teen" },
      ),
    ).toEqual([]);
    expect(
      validateNpcReactionIssues(
        { npcId: "npc_elder", line: elderLine },
        { npc: elderNpc, safetyMode: "teen" },
      ),
    ).toEqual([]);
  });

  it("flags teen-unsafe and off-tone lines", () => {
    const unsafeLine = (
      STONEPASS_UNSAFE_TEEN_REACTION as { kind: "success"; value: { line: string } }
    ).value.line;
    const offToneLine = (
      STONEPASS_OFF_TONE_OGRE_REACTION as {
        kind: "success";
        value: { line: string };
      }
    ).value.line;

    expect(
      validateNpcReactionIssues(
        { npcId: "npc_ogre", line: unsafeLine },
        { npc: ogreNpc, safetyMode: "teen" },
      ).some((issue) => issue.includes("teen safety")),
    ).toBe(true);

    expect(
      validateNpcReactionIssues(
        { npcId: "npc_ogre", line: offToneLine },
        { npc: ogreNpc, safetyMode: "teen" },
      ).some((issue) => issue.includes("tone")),
    ).toBe(true);

    expect(lineMatchesToneRules("A gruff simple threat.", ["gruff", "simple speech"])).toBe(true);
  });
});

describe("NPCReactionAgent", () => {
  it("returns a valid ogre reaction without mutating session", async () => {
    const session = loadStonepassSession();
    const before = snapshotSession(session);

    const agent = createNPCReactionAgent(
      createAIGateway(new FakeProvider({ scenario: STONEPASS_OGRE_REACTION })),
    );

    const { result, session: trackedSession } = await agent.suggestReaction({
      session,
      npc: ogreNpc,
      safetyMode: "teen",
      trigger: "Player offers to fight the ogre.",
    });

    expect(result.ok).toBe(true);
    expect(result.fallbackUsed).toBe(false);
    expect(result.value?.npcId).toBe("npc_ogre");
    expect(trackedSession.debugEvents.some((e) => e.type === "ai_suggestion")).toBe(true);
    expect(snapshotSession(session)).toBe(before);
  });

  it("returns a valid elder reaction", async () => {
    const session = loadStonepassSession();
    const agent = createNPCReactionAgent(
      createAIGateway(new FakeProvider({ scenario: STONEPASS_ELDER_REACTION })),
    );

    const { result } = await agent.suggestReaction({
      session,
      npc: elderNpc,
      safetyMode: "teen",
      trigger: "Player asks about the dragon.",
    });

    expect(result.ok).toBe(true);
    expect(result.value?.npcId).toBe("npc_elder");
    expect(result.value?.line).toContain("warm");
  });

  it("falls back when provider output is teen-unsafe", async () => {
    const session = loadStonepassSession();
    const agent = createNPCReactionAgent(
      createAIGateway(new FakeProvider({ scenario: STONEPASS_UNSAFE_TEEN_REACTION })),
    );

    const { result, session: trackedSession } = await agent.suggestReaction({
      session,
      npc: ogreNpc,
      safetyMode: "teen",
      fallback: buildDefaultNpcReactionFallback(ogreNpc),
    });

    expect(result.ok).toBe(true);
    expect(result.fallbackUsed).toBe(true);
    expect(result.value?.line).toContain("club");
    expect(result.validationErrors?.some((e) => e.includes("teen safety"))).toBe(true);
    expect(trackedSession.debugEvents.some((e) => e.type === "fallback_used")).toBe(true);
  });

  it("falls back when provider output is off-tone for the ogre", async () => {
    const session = loadStonepassSession();
    const agent = createNPCReactionAgent(
      createAIGateway(new FakeProvider({ scenario: STONEPASS_OFF_TONE_OGRE_REACTION })),
    );

    const { result, session: trackedSession } = await agent.suggestReaction({
      session,
      npc: ogreNpc,
      safetyMode: "teen",
    });

    expect(result.ok).toBe(true);
    expect(result.fallbackUsed).toBe(true);
    expect(result.validationErrors?.some((e) => e.includes("tone"))).toBe(true);
    expect(trackedSession.debugEvents.some((e) => e.type === "fallback_used")).toBe(true);
  });

  it("falls back on provider error with default ogre line", async () => {
    const session = loadStonepassSession();
    const agent = createNPCReactionAgent(
      createAIGateway(
        new FakeProvider({
          scenario: { kind: "error", message: "npc provider down" },
        }),
      ),
    );

    const { result } = await agent.suggestReaction({
      session,
      npc: ogreNpc,
      safetyMode: "teen",
    });

    expect(result.ok).toBe(true);
    expect(result.fallbackUsed).toBe(true);
    expect(result.value?.npcId).toBe("npc_ogre");
  });

  it("falls back when schema validation fails at the gateway", async () => {
    const session = loadStonepassSession();
    const agent = createNPCReactionAgent(
      createAIGateway(
        new FakeProvider({
          scenario: {
            kind: "invalid",
            raw: { npcId: "npc_ogre", line: "" },
          },
        }),
      ),
    );

    const { result } = await agent.suggestReaction({
      session,
      npc: ogreNpc,
      safetyMode: "teen",
      fallback: elderFallback,
    });

    expect(result.ok).toBe(true);
    expect(result.fallbackUsed).toBe(true);
    expect(result.value?.npcId).toBe("npc_elder");
  });
});
