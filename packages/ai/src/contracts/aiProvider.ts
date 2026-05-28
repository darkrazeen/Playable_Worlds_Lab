import type { z } from "zod";

import type { AIResultOf } from "@playable-worlds/core";

import type { AIRequest } from "./aiRequest.js";

/** Provider-agnostic contract for structured AI calls (§10). */
export interface AIProvider {
  readonly name: string;
  generateStructured<T extends z.ZodTypeAny>(
    input: AIRequest,
    schema: T,
  ): Promise<AIResultOf<T>>;
}
