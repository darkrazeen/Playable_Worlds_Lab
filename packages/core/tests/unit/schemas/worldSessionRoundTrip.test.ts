import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { applyPlayerChoice } from "../../../src/runtime/applyConsequence.js";
import { safeParseWorldSession } from "../../../src/schemas/worldSession.js";
import { initializeWorldSession } from "../../../src/session/initializeWorldSession.js";
import { loadWorld } from "../../../src/world/loadWorld.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const contentRoot = join(__dirname, "../../../../content");

describe("WorldSession JSON round-trip", () => {
  it("re-parses a fresh session after JSON serialization", () => {
    const world = loadWorld("world_stonepass_valley", contentRoot).world!;
    const init = initializeWorldSession(world, { sessionId: "session_roundtrip_fresh" });

    const serialized = JSON.stringify(init.session);
    const parsed = safeParseWorldSession(JSON.parse(serialized) as unknown);

    expect(parsed.success).toBe(true);
    expect(parsed.data?.id).toBe("session_roundtrip_fresh");
    expect(parsed.data?.debugEvents[0]?.type).toBe("session_loaded");
  });

  it("re-parses a post-choice session with ledger and debug events", () => {
    const world = loadWorld("world_stonepass_valley", contentRoot).world!;
    const init = initializeWorldSession(world, { sessionId: "session_roundtrip_apply" });
    const applied = applyPlayerChoice(world, init.session!, "fight_ogre");

    expect(applied.ok).toBe(true);

    const serialized = JSON.stringify(applied.session);
    const parsed = safeParseWorldSession(JSON.parse(serialized) as unknown);

    expect(parsed.success).toBe(true);
    expect(parsed.data?.turnNumber).toBe(1);
    expect(parsed.data?.ledger.activeFlags).toContain("ogre_defeated");
    expect(parsed.data?.debugEvents.some((e) => e.type === "consequence_applied")).toBe(true);
  });
});
