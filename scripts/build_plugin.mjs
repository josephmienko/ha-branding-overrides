import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = resolve(root, "src", "ha-branding-overrides.js");
const outputPath = resolve(root, "dist", "ha-branding-overrides.js");

const banner = `/**
 * Built file for the HA Branding Overrides HACS artifact.
 * Edit src/ha-branding-overrides.js and rerun npm run build.
 */

`;

const source = await readFile(sourcePath, "utf8");
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, banner + source.trimEnd() + "\n", "utf8");
