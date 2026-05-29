import { z } from "zod";

import { SafetyModeSchema } from "./safetyMode.js";

export const WorldGenreSchema = z.enum(["fantasy", "sci_fi", "mystery", "cozy", "survival"]);

export const WorldToneSchema = z.enum(["cozy", "heroic", "dark", "funny", "mysterious"]);

export const SessionLengthMinutesSchema = z.union([
  z.literal(5),
  z.literal(10),
  z.literal(15),
  z.literal(30),
  z.literal(45),
]);

export const ConsequenceIntensitySchema = z.enum(["light", "medium", "major"]);

export const AiCreativitySchema = z.enum(["conservative", "balanced", "wild"]);

export const WorldDNASchema = z.object({
  genre: WorldGenreSchema,
  tone: WorldToneSchema,
  sessionLengthMinutes: SessionLengthMinutesSchema,
  coreLoop: z.array(z.string().min(1)).min(1),
  consequenceIntensity: ConsequenceIntensitySchema,
  aiCreativity: AiCreativitySchema,
  safetyMode: SafetyModeSchema,
});

export type WorldDNA = z.infer<typeof WorldDNASchema>;

export function parseWorldDNA(input: unknown): WorldDNA {
  return WorldDNASchema.parse(input);
}

export function safeParseWorldDNA(input: unknown) {
  return WorldDNASchema.safeParse(input);
}
