import { z } from "zod";

/** Current hybrid contract version — see Playable_Worlds_Lab_v4_1_FULL_CURSOR.md §22 */
export const CURRENT_SCHEMA_VERSION = "0.2.0";

export const SchemaVersionSchema = z.string().min(1);
