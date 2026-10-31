import { spawnSync } from "node:child_process";
import { supabaseBinary } from "./supabase-binary.mjs";

const args = process.argv.slice(2);
if (
  process.platform === "win32" &&
  args.some((arg) => /[&|<>^%!\r\n"]/u.test(arg))
) {
  throw new Error(
    "Pass CLI secrets through environment variables and use plain command arguments.",
  );
}
const result = spawnSync(supabaseBinary(), args, {
  stdio: "inherit",
  shell: process.platform === "win32",
});
if (result.error) process.stderr.write(`${result.error.message}\n`);
process.exit(result.status ?? 1);
