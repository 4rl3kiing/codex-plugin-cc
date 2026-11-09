import test from "node:test";
import assert from "node:assert/strict";

import { parseArgs } from "../plugins/codex/scripts/lib/args.mjs";

test("parseArgs keeps '=' characters inside inline values", () => {
  const { options } = parseArgs(["--model=a=b=c", "--flag"], { valueOptions: ["model"], booleanOptions: ["flag"] });
  assert.equal(options.model, "a=b=c");
  assert.equal(options.flag, true);
});

test("parseArgs honours explicit false for boolean options", () => {
  const { options } = parseArgs(["--wait=false"], { booleanOptions: ["wait"] });
  assert.equal(options.wait, false);
});
