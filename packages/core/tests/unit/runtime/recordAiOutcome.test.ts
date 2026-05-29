import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { initializeWorldSession } from "../../../src/session/initializeWorldSession.js";
import { recordAiGatewayOutcome } from "../../../src/runtime/recordAiOutcome.js";
import { loadWorld } from "../../../src/world/loadWorld.js";
import type { WorldSession } from "../../../src/schemas/worldSession.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const contentRoot = join(__dirname, "../../../../content");

function loadStonepassSession(): WorldSession {
  const worldResult = loadWorld("world_stonepass_valley", contentRoot);
  expect(worldResult.ok).toBe(true);
  const sessionResult = initializeWorldSession(worldResult.world!, {
    sessionId: "session_record_ai_outcome",
  });
  expect(sessionResult.ok).toBe(true);
  return sessionResult.session!;
}

function ledgerSnapshot(session: WorldSession) {
  return {
    activeFlags: [...session.ledger.activeFlags],
    resolvedFlags: [...session.ledger.resolvedFlags],
    currentBeatId: session.currentBeatId,
    turnNumber: session.turnNumber,
  };
}

describe("recordAiGatewayOutcome", () => {
  it("appends ai_suggestion when the gateway returns ok without fallback", () => {
    const session = loadStonepassSession();
    const beforeLedger = ledgerSnapshot(session);

    const next = recordAiGatewayOutcome(
      session,
      {
        ok: true,
        provider: "fake",
        fallbackUsed: false,
        value: {
          action: "select_next_beat",
          targetId: "beat_landslide_aftermath",
          reason: "Advance after ogre.",
          confidence: 0.8,
        },
      },
      { agent: "director", task: "director_select_next_beat" },
    );

    expect(next.debugEvents.at(-1)?.type).toBe("ai_suggestion");
    expect(next.debugEvents.at(-1)?.metadata?.agent).toBe("director");
    expect(ledgerSnapshot(next)).toEqual(beforeLedger);
  });

  it("appends fallback_used when ok with fallbackUsed", () => {
    const session = loadStonepassSession();
    const beforeLedger = ledgerSnapshot(session);

    const next = recordAiGatewayOutcome(
      session,
      {
        ok: true,
        provider: "fake",
        fallbackUsed: true,
        validationErrors: ["schema: invalid action"],
        value: {
          action: "select_next_beat",
          targetId: session.currentBeatId,
          reason: "Deterministic fallback.",
          confidence: 0.5,
        },
      },
      { agent: "director", task: "director_select_next_beat" },
    );

    expect(next.debugEvents.at(-1)?.type).toBe("fallback_used");
    expect(next.debugEvents.at(-1)?.metadata?.validationErrors).toEqual(["schema: invalid action"]);
    expect(ledgerSnapshot(next)).toEqual(beforeLedger);
  });

  it("appends validation_failed when the gateway returns not ok", () => {
    const session = loadStonepassSession();
    const beforeLedger = ledgerSnapshot(session);

    const next = recordAiGatewayOutcome(
      session,
      {
        ok: false,
        provider: "fake",
        fallbackUsed: false,
        validationErrors: ["provider outage"],
      },
      { agent: "npc", task: "npc_reaction" },
    );

    expect(next.debugEvents.at(-1)?.type).toBe("validation_failed");
    expect(next.debugEvents.at(-1)?.metadata?.agent).toBe("npc");
    expect(ledgerSnapshot(next)).toEqual(beforeLedger);
  });
});
