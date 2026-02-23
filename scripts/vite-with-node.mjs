import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

function readNvmVersion(projectRoot) {
  const nvmrcPath = join(projectRoot, ".nvmrc");
  if (!existsSync(nvmrcPath)) {
    return null;
  }

  const raw = readFileSync(nvmrcPath, "utf8").trim();
  if (!raw) {
    return null;
  }

  return raw.startsWith("v") ? raw : `v${raw}`;
}

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDir, "..");
const viteBinPath = join(projectRoot, "node_modules", "vite", "bin", "vite.js");

if (!existsSync(viteBinPath)) {
  // Keep this failure explicit so npm users know they still need dependencies installed.
  console.error("Vite binary not found. Run npm install first.");
  process.exit(1);
}

const nvmVersion = readNvmVersion(projectRoot);
const home = process.env.HOME;
const nvmNodePath =
  home && nvmVersion ? join(home, ".nvm", "versions", "node", nvmVersion, "bin", "node") : null;

const nodePath = nvmNodePath && existsSync(nvmNodePath) ? nvmNodePath : process.execPath;
const nodeMajor = Number.parseInt(process.versions.node.split(".")[0] ?? "0", 10);

if (nodePath === process.execPath && nodeMajor < 18) {
  console.error(
    `Node ${process.versions.node} is too old for Vite. Run "nvm use" in ${projectRoot} and retry.`
  );
  process.exit(1);
}

const result = spawnSync(nodePath, [viteBinPath, ...process.argv.slice(2)], {
  stdio: "inherit",
  env: process.env,
});

if (typeof result.status === "number") {
  process.exit(result.status);
}

process.exit(1);
