import { z } from "zod";

import { NamedIdSchema } from "./ids.js";

export const DebugEventIdSchema = NamedIdSchema;

export const DebugEventTypeSchema = z.enum([
  "choice_selected",
  "consequence_applied",
  "flags_changed",
  "goal_unlocked",
  "ai_suggestion",
  "fallback_used",
  "validation_failed",
  "session_loaded",
  "session_saved",
]);

export const DebugEventSchema = z.object({
  id: DebugEventIdSchema,
  turnNumber: z.number().int().min(0),
  type: DebugEventTypeSchema,
  summary: z.string().min(1),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type DebugEvent = z.infer<typeof DebugEventSchema>;
export type DebugEventType = z.infer<typeof DebugEventTypeSchema>;

export function parseDebugEvent(input: unknown): DebugEvent {
  return DebugEventSchema.parse(input);
}

export function safeParseDebugEvent(input: unknown) {
  return DebugEventSchema.safeParse(input);
}
