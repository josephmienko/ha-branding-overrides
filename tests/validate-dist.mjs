import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const distPath = resolve(root, "dist", "ha-branding-overrides.js");
const source = await readFile(distPath, "utf8");

assert.match(source, /window\.ha_branding_overrides/);
assert.match(source, /frontend\.extra_module_url|ha-branding-overrides/i);
assert.match(source, /MutationObserver/);
assert.match(source, /logoSelectors/);
assert.match(source, /removeSelectors/);
assert.match(source, /updateExistingHeadIconLinks/);
assert.match(source, /replaceExactText/);
assert.doesNotMatch(source, /Crooked Sentry/);
assert.doesNotMatch(source, /crooked-sentry-branding/);
assert.doesNotMatch(source, /\/local\/community\//);
