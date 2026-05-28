import { z } from "zod";

/** Current hybrid contract version — see Playable_Worlds_Lab_v4_1_FULL_CURSOR.md §22 */
export const CURRENT_SCHEMA_VERSION = "0.2.0";

/** Schema versions accepted by cross-file validation and loaders. */
export const SUPPORTED_SCHEMA_VERSIONS = new Set<string>([CURRENT_SCHEMA_VERSION]);

export const SchemaVersionSchema = z.string().min(1);
