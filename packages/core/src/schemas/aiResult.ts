import { z } from "zod";

export const AIProviderNameSchema = z.string().min(1);

export const ValidationErrorListSchema = z.array(z.string().min(1));

const aiResultBaseShape = {
  ok: z.boolean(),
  raw: z.unknown().optional(),
  provider: AIProviderNameSchema,
  fallbackUsed: z.boolean(),
  validationErrors: ValidationErrorListSchema.optional(),
  latencyMs: z.number().nonnegative().optional(),
  generationSeed: z.string().min(1).optional(),
} as const;

/** Untyped AI result — `value` is not schema-validated. */
export const AIResultSchema = z.object({
  ...aiResultBaseShape,
  value: z.unknown().optional(),
});

export type AIResult = z.infer<typeof AIResultSchema>;

/** Typed AI result — validates `value` against the provided Zod schema when present. */
export function createAIResultSchema<T extends z.ZodTypeAny>(valueSchema: T) {
  return z.object({
    ...aiResultBaseShape,
    value: valueSchema.optional(),
  });
}

export type AIResultOf<T extends z.ZodTypeAny> = z.infer<ReturnType<typeof createAIResultSchema<T>>>;

export function parseAIResult(input: unknown): AIResult {
  return AIResultSchema.parse(input);
}

export function safeParseAIResult(input: unknown) {
  return AIResultSchema.safeParse(input);
}

export function parseTypedAIResult<T extends z.ZodTypeAny>(
  valueSchema: T,
  input: unknown,
): AIResultOf<T> {
  return createAIResultSchema(valueSchema).parse(input);
}

export function safeParseTypedAIResult<T extends z.ZodTypeAny>(valueSchema: T, input: unknown) {
  return createAIResultSchema(valueSchema).safeParse(input);
}
