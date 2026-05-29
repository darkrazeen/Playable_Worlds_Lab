import { describe, expect, it } from "vitest";

import {
  buildFlagsChangedEvent,
  buildValidationFailedEvent,
} from "../../../src/debug/buildDebugEvents.js";
import { createEmptyWorldLedger } from "../../../src/schemas/worldLedger.js";

describe("buildDebugEvents", () => {
  it("builds flags_changed when active or resolved flags differ", () => {
    const before = createEmptyWorldLedger();
    const after = {
      ...before,
      activeFlags: ["ogre_defeated", "bridge_open"],
      resolvedFlags: ["ogre_blocks_bridge"],
    };

    const event = buildFlagsChangedEvent({
      turnNumber: 1,
      consequenceId: "consequence_fight_ogre",
      before,
      after,
    });

    expect(event?.type).toBe("flags_changed");
    expect(event?.metadata?.addedActiveFlags).toEqual(["ogre_defeated", "bridge_open"]);
    expect(event?.metadata?.addedResolvedFlags).toEqual(["ogre_blocks_bridge"]);
  });

  it("returns undefined when flags are unchanged", () => {
    const ledger = createEmptyWorldLedger();
    expect(
      buildFlagsChangedEvent({
        turnNumber: 1,
        consequenceId: "consequence_noop",
        before: ledger,
        after: ledger,
      }),
    ).toBeUndefined();
  });

  it("builds validation_failed with error list metadata", () => {
    const event = buildValidationFailedEvent({
      turnNumber: 0,
      errors: ["runtime: choice blocked"],
      metadata: { choiceId: "fight_ogre" },
    });

    expect(event.type).toBe("validation_failed");
    expect(event.metadata?.errors).toEqual(["runtime: choice blocked"]);
    expect(event.metadata?.choiceId).toBe("fight_ogre");
  });
});
