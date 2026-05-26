import { z } from "zod";

export const SafetyModeSchema = z.enum(["teen", "adult"]);

export type SafetyMode = z.infer<typeof SafetyModeSchema>;
