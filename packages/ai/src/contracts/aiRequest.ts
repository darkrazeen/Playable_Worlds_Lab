import { z } from "zod";

// TODO(Phase 2): Replace free-form context with per-agent typed schemas (Director, NPC, WorldArchitect).

export const AIRequestSchema = z.object({
  task: z.string().min(1),
  prompt: z.string().min(1),
  context: z.record(z.unknown()).optional(),
  generationSeed: z.string().min(1).optional(),
});

export type AIRequest = z.infer<typeof AIRequestSchema>;

export function parseAIRequest(input: unknown): AIRequest {
  return AIRequestSchema.parse(input);
}

export function safeParseAIRequest(input: unknown) {
  return AIRequestSchema.safeParse(input);
}
