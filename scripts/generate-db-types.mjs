import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { supabaseBinary } from "./supabase-binary.mjs";
import { format } from "prettier";

// Capture stdout directly: PowerShell redirection can produce incompatible encodings.
const projectId = process.env.SUPABASE_PROJECT_ID;
if (projectId && !/^[a-z0-9-]+$/.test(projectId)) {
  throw new Error(
    "SUPABASE_PROJECT_ID must contain only lowercase letters, digits, and hyphens.",
  );
}
const args = [
  "gen",
  "types",
  "typescript",
  projectId ? "--project-id" : "--local",
];
if (projectId) args.push(projectId);
args.push("--schema", "public");
const executable = supabaseBinary();
const result = spawnSync(executable, args, {
  encoding: "utf8",
  shell: process.platform === "win32",
});
if (
  result.status !== 0 ||
  !result.stdout?.includes("export type Database") ||
  !result.stdout.includes("wardrobe_items")
) {
  process.stderr.write(
    result.stderr ||
      "Database type generation failed. Start Supabase locally or set SUPABASE_PROJECT_ID.\n",
  );
  process.exit(result.status || 1);
}
writeFileSync(
  new URL("../src/types/database.ts", import.meta.url),
  await format(result.stdout, { parser: "typescript" }),
  "utf8",
);
