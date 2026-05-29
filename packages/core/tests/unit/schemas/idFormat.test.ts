import { describe, expect, it } from "vitest";

import {
  ChoiceIdSchema,
  EntityIdSchema,
  FlagIdSchema,
  NamedIdSchema,
  WorldIdSchema,
} from "../../../src/schemas/index.js";

describe("ID format schemas", () => {
  it.each([
    ["landslide_triggered", FlagIdSchema],
    ["goal_hear_elder_counsel", EntityIdSchema],
    ["beat_ogre_bridge", NamedIdSchema],
    ["fight_ogre", ChoiceIdSchema],
    ["world_stonepass_valley", WorldIdSchema],
  ])("accepts valid id %s", (id, schema) => {
    expect(schema.safeParse(id).success).toBe(true);
  });

  it.each(["Landslide_Triggered", "landslide-triggered", "1bad_start", "", "UPPER"])(
    "rejects invalid entity id %s",
    (id) => {
      expect(EntityIdSchema.safeParse(id).success).toBe(false);
    },
  );
});
