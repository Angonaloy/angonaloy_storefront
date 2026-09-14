import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./index.ts", import.meta.url), "utf8");

test("local API request logs contain route metadata but never serialized response bodies", () => {
  assert.match(source, /\$\{req\.method\} \$\{path\} \$\{res\.statusCode\} in \$\{duration\}ms/);
  assert.doesNotMatch(source, /capturedJsonResponse/);
  assert.doesNotMatch(source, /JSON\.stringify\(capturedJsonResponse\)/);
});
