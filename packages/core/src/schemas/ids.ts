import { z } from "zod";

const LOWER_SNAKE_CASE_MESSAGE = "IDs must be lowercase_snake_case starting with a letter";

/** Flag, goal, location, and similar entity identifiers. */
export const EntityIdSchema = z
  .string()
  .min(1)
  .regex(/^[a-z][a-z0-9_]*$/, LOWER_SNAKE_CASE_MESSAGE);

/** Story beat, choice, consequence, NPC, world, session, and event IDs. */
export const NamedIdSchema = EntityIdSchema;
