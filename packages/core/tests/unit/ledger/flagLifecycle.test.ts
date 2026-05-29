import { describe, expect, it } from "vitest";

import { applyConsequenceToLedger } from "../../../src/consequence/applyConsequenceToLedger.js";
import {
  activeBlockedFlags,
  applyFlagChanges,
  isExemptFlag,
  missingRequiredFlags,
  normalizeFlagList,
  satisfiesFlagRequirements,
  validateLedgerFlags,
} from "../../../src/ledger/flagLifecycle.js";
import { isPlayerChoiceAccessible, isStoryBeatAccessible } from "../../../src/story/beatAccessibility.js";
import { parseConsequence } from "../../../src/schemas/consequence.js";
import { createEmptyWorldLedger, WorldLedgerSchema } from "../../../src/schemas/worldLedger.js";

describe("flag lifecycle primitives", () => {
  it("normalizes duplicate flags preserving order", () => {
    expect(normalizeFlagList(["flag_a", "flag_b", "flag_a", "flag_c"])).toEqual([
      "flag_a",
      "flag_b",
      "flag_c",
    ]);
  });

  it("treats system_ and external_ flags as exempt for required gates", () => {
    expect(isExemptFlag("system_intro")).toBe(true);
    expect(isExemptFlag("external_partner")).toBe(true);
    expect(isExemptFlag("ogre_defeated")).toBe(false);
    expect(
      satisfiesFlagRequirements(new Set(), ["system_intro"], []),
    ).toBe(true);
  });

  it("applyFlagChanges removes from active and records resolved", () => {
    const result = applyFlagChanges(["ogre_blocks_bridge", "bridge_open"], [], {
      removeFlags: ["ogre_blocks_bridge"],
      addFlags: ["landslide_triggered"],
    });

    expect(result.activeFlags).toEqual(["bridge_open", "landslide_triggered"]);
    expect(result.resolvedFlags).toEqual(["ogre_blocks_bridge"]);
  });

  it("records removeFlags in resolved even when flag was never active", () => {
    const result = applyFlagChanges([], [], {
      removeFlags: ["ogre_blocks_bridge"],
    });

    expect(result.activeFlags).toEqual([]);
    expect(result.resolvedFlags).toEqual(["ogre_blocks_bridge"]);
  });

  it("reactivates a flag by removing it from resolved when added again", () => {
    const result = applyFlagChanges([], ["bridge_open"], {
      addFlags: ["bridge_open"],
    });

    expect(result.activeFlags).toEqual(["bridge_open"]);
    expect(result.resolvedFlags).toEqual([]);
  });

  it("keeps active and resolved mutually exclusive after combined changes", () => {
    const result = applyFlagChanges(
      ["flag_a"],
      ["flag_b"],
      { removeFlags: ["flag_a"], addFlags: ["flag_b", "flag_c"] },
    );

    expect(result.activeFlags).toEqual(["flag_b", "flag_c"]);
    expect(result.resolvedFlags).toEqual(["flag_a"]);
    expect(validateLedgerFlags(result.activeFlags, result.resolvedFlags).ok).toBe(true);
  });

  it("validateLedgerFlags rejects duplicates and overlap", () => {
    expect(validateLedgerFlags(["flag_a", "flag_a"], []).ok).toBe(false);
    expect(validateLedgerFlags(["flag_a"], ["flag_a"]).ok).toBe(false);
    expect(validateLedgerFlags(["flag_a"], ["flag_b"]).ok).toBe(true);
  });

  it("reports missing required and active blocked flags", () => {
    const flags = new Set(["flag_blocked"]);
    expect(missingRequiredFlags(flags, ["flag_required"])).toEqual(["flag_required"]);
    expect(activeBlockedFlags(flags, ["flag_blocked"])).toEqual(["flag_blocked"]);
  });
});

describe("flag gates on beats and choices", () => {
  const flagsWithLandslide = new Set(["landslide_triggered"]);

  it("blocks beats until requiredFlags are active", () => {
    expect(
      isStoryBeatAccessible(
        { requiredFlags: ["landslide_triggered"] } as Parameters<typeof isStoryBeatAccessible>[0],
        new Set(),
      ),
    ).toBe(false);
    expect(
      isStoryBeatAccessible(
        { requiredFlags: ["landslide_triggered"] } as Parameters<typeof isStoryBeatAccessible>[0],
        flagsWithLandslide,
      ),
    ).toBe(true);
  });

  it("blocks choices when blockedByFlags are active", () => {
    expect(
      isPlayerChoiceAccessible(
        { blockedByFlags: ["flag_blocked"] } as Parameters<typeof isPlayerChoiceAccessible>[0],
        new Set(["flag_blocked"]),
      ),
    ).toBe(false);
  });
});

describe("WorldLedgerSchema flag validation", () => {
  it("rejects ledgers with duplicate activeFlags", () => {
    const result = WorldLedgerSchema.safeParse({
      ...createEmptyWorldLedger(),
      activeFlags: ["flag_a", "flag_a"],
    });
    expect(result.success).toBe(false);
  });

  it("rejects ledgers with a flag both active and resolved", () => {
    const result = WorldLedgerSchema.safeParse({
      ...createEmptyWorldLedger(),
      activeFlags: ["flag_a"],
      resolvedFlags: ["flag_a"],
    });
    expect(result.success).toBe(false);
  });
});

describe("applyConsequenceToLedger flag lifecycle integration", () => {
  it("produces normalized non-overlapping flag lists after fight_ogre-style changes", () => {
    const consequence = parseConsequence({
      id: "consequence_fight_ogre",
      summary: "Fight.",
      addFlags: ["ogre_defeated", "bridge_open", "landslide_triggered"],
      removeFlags: ["ogre_blocks_bridge"],
    });

    const ledger = applyConsequenceToLedger(createEmptyWorldLedger(), consequence, 1);

    expect(ledger.activeFlags).toEqual([
      "ogre_defeated",
      "bridge_open",
      "landslide_triggered",
    ]);
    expect(ledger.resolvedFlags).toEqual(["ogre_blocks_bridge"]);
    expect(validateLedgerFlags(ledger.activeFlags, ledger.resolvedFlags).ok).toBe(true);
  });
});
