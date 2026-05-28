/**
 * One-off helper: merges enrichment JSON into step tracker CSV.
 * Agents should edit the CSV directly going forward; this documents column layout.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const csvPath = join(root, "Playable_Worlds_Lab_v4_1_Notion_Step_Tracker.csv");
const enrichmentPath = join(root, "scripts/step-tracker-enrichment.json");

function parseCsvLine(line) {
  const fields = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      fields.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
}

function escapeCsvField(value) {
  const s = value ?? "";
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

const raw = readFileSync(csvPath, "utf8").replace(/\r\n/g, "\n").trimEnd();
const lines = raw.split("\n");
const header = parseCsvLine(lines[0]);
const enrichment = JSON.parse(readFileSync(enrichmentPath, "utf8"));

const insertAfter = "Completion Evidence";
const insertIdx = header.indexOf(insertAfter);
if (insertIdx === -1) throw new Error("Completion Evidence column not found");

const newCols = [
  "Implementation Added Changed",
  "Project Relevance",
  "Future Features Impact",
  "Tests And Verification",
  "Last Updated",
];

const alreadyHas = header.includes(newCols[0]);
const newHeader = alreadyHas
  ? header
  : [
      ...header.slice(0, insertIdx + 1),
      ...newCols,
      ...header.slice(insertIdx + 1),
    ];

const newHeaderLine = newHeader.map(escapeCsvField).join(",");

const outLines = [newHeaderLine];

for (let li = 1; li < lines.length; li++) {
  const fields = parseCsvLine(lines[li]);
  const stepId = fields[3];
  const data = enrichment[stepId];

  if (alreadyHas) {
    const implIdx = newHeader.indexOf(newCols[0]);
    if (data && fields[0] === "Complete") {
      fields[implIdx] = data.implementation;
      fields[implIdx + 1] = data.relevance;
      fields[implIdx + 2] = data.future;
      fields[implIdx + 3] = data.tests;
      fields[implIdx + 4] = "2026-05-28";
      const evIdx = newHeader.indexOf("Completion Evidence");
      if (evIdx >= 0 && data.evidence) fields[evIdx] = data.evidence;
    } else if (data && fields[0] === "Next") {
      fields[implIdx] = data.implementation;
      fields[implIdx + 1] = data.relevance;
      fields[implIdx + 2] = data.future;
      fields[implIdx + 3] = data.tests;
      fields[implIdx + 4] = "2026-05-28 (planned)";
    }
    outLines.push(fields.map(escapeCsvField).join(","));
    continue;
  }

  const before = fields.slice(0, insertIdx + 1);
  const after = fields.slice(insertIdx + 1);
  const extra = data
    ? [
        data.implementation,
        data.relevance,
        data.future,
        data.tests,
        fields[0] === "Next" ? "2026-05-28 (planned)" : data ? "2026-05-28" : "",
      ]
    : ["", "", "", "", ""];

  if (data?.evidence && insertIdx >= 0) {
    before[insertIdx] = data.evidence;
  }

  outLines.push([...before, ...extra, ...after].map(escapeCsvField).join(","));
}

const outPath = join(root, "Playable_Worlds_Lab_v4_1_Notion_Step_Tracker.updated.csv");
writeFileSync(outPath, `${outLines.join("\n")}\n`, "utf8");
console.log(`Wrote ${outPath} with ${newCols.length} new columns. Close IDE CSV tab; rename .updated.csv over original if needed.`);
