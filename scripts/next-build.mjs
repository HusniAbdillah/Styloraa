import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const nextCli = require.resolve("next/dist/bin/next");
const result = spawnSync(process.execPath, [nextCli, "build", "--webpack"], {
  env: {
    ...process.env,
    CIRCLE_NODE_TOTAL: "1",
    UV_THREADPOOL_SIZE: "1",
  },
  stdio: "inherit",
});

if (result.error) {
  process.stderr.write(`${result.error.message}\n`);
  process.exitCode = 1;
} else {
  process.exitCode = result.status ?? 1;
}
