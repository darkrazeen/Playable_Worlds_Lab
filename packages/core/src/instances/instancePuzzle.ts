import { z } from "zod";

import { ConsequenceIdSchema } from "../schemas/consequence.js";
import { NamedIdSchema } from "../schemas/ids.js";
import type { WorldDefinition } from "../schemas/worldDefinition.js";

export const MAX_INSTANCE_PUZZLE_SOLUTIONS = 4;

export const InstancePuzzleSolutionSchema = z.object({
  id: NamedIdSchema,
  label: z.string().min(1),
  description: z.string().min(1).optional(),
  consequenceId: ConsequenceIdSchema,
  completesPuzzle: z.boolean(),
});

export const InstancePuzzleSchema = z
  .object({
    id: NamedIdSchema,
    title: z.string().min(1),
    description: z.string().min(1),
    solutions: z.array(InstancePuzzleSolutionSchema).min(1).max(MAX_INSTANCE_PUZZLE_SOLUTIONS),
  })
  .superRefine((puzzle, ctx) => {
    if (!puzzle.solutions.some((solution) => solution.completesPuzzle)) {
      ctx.addIssue({
        code: "custom",
        message: "instance-puzzle: at least one solution must set completesPuzzle to true",
        path: ["solutions"],
      });
    }
  });

export type InstancePuzzle = z.infer<typeof InstancePuzzleSchema>;
export type InstancePuzzleSolution = z.infer<typeof InstancePuzzleSolutionSchema>;

export function parseInstancePuzzle(input: unknown): InstancePuzzle {
  return InstancePuzzleSchema.parse(input);
}

export function safeParseInstancePuzzle(input: unknown) {
  return InstancePuzzleSchema.safeParse(input);
}

/** Ensure puzzle solutions reference consequences on the world and define a completion path. */
export function validateInstancePuzzleAgainstWorld(
  puzzle: InstancePuzzle,
  world: WorldDefinition,
): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  const consequenceIds = new Set(world.consequences.map((entry) => entry.id));

  for (const solution of puzzle.solutions) {
    if (!consequenceIds.has(solution.consequenceId)) {
      errors.push(
        `instance-puzzle: solution "${solution.id}" references unknown consequence "${solution.consequenceId}"`,
      );
    }
  }

  if (!puzzle.solutions.some((solution) => solution.completesPuzzle)) {
    errors.push("instance-puzzle: puzzle has no completion solution");
  }

  return { ok: errors.length === 0, errors };
}

export function findInstancePuzzleSolution(
  puzzle: InstancePuzzle,
  solutionId: string,
): InstancePuzzleSolution | undefined {
  return puzzle.solutions.find((solution) => solution.id === solutionId);
}

export function isInstancePuzzleCompletionSolution(
  puzzle: InstancePuzzle,
  solutionId: string,
): boolean {
  const solution = findInstancePuzzleSolution(puzzle, solutionId);
  return solution?.completesPuzzle === true;
}
