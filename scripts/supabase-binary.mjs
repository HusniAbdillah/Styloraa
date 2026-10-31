import { createRequire } from "node:module";
import path from "node:path";

export function supabaseBinary() {
  if (process.env.SUPABASE_CLI_BINARY_OVERRIDE)
    return process.env.SUPABASE_CLI_BINARY_OVERRIDE;
  if (process.platform === "win32") {
    const require = createRequire(import.meta.url);
    const cliRequire = createRequire(require.resolve("supabase/package.json"));
    const packagePath = cliRequire.resolve(
      `@supabase/cli-windows-${process.arch}/package.json`,
    );
    return path.join(path.dirname(packagePath), "bin", "supabase.exe");
  }
  return "supabase";
}
