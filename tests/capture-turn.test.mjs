import test from "node:test";
import assert from "node:assert/strict";

import { captureTurn } from "../plugins/codex/scripts/lib/codex.mjs";
import { renderNativeReviewResult } from "../plugins/codex/scripts/lib/render.mjs";
import { fenceFor } from "../plugins/codex/scripts/lib/fs.mjs";

function createFakeClient() {
  let resolveExit;
  const client = {
    notificationHandler: null,
    exitError: null,
    exitPromise: new Promise((resolve) => {
      resolveExit = resolve;
    }),
    setNotificationHandler(handler) {
      this.notificationHandler = handler;
    },
    die(error) {
      this.exitError = error;
      resolveExit();
    }
  };
  return client;
}

test("captureTurn rejects instead of hanging when the app-server exits mid-turn", async () => {
  const client = createFakeClient();
  const pending = captureTurn(client, "thread-1", async () => ({ turn: { id: "turn-1", status: "inProgress" } }));
  setTimeout(() => client.die(new Error("codex app-server exited unexpectedly (exit 1).")), 20);

  await assert.rejects(pending, /exited unexpectedly/);
});

test("captureTurn resolves normally when the turn completes before the client exits", async () => {
  const client = createFakeClient();
  const result = await captureTurn(client, "thread-1", async () => ({ turn: { id: "turn-1", status: "completed" } }));
  assert.equal(result.finalTurn.status, "completed");
  client.die(null);
});

test("fenceFor lengthens the fence when the content contains backtick runs", () => {
  assert.equal(fenceFor("plain"), "```");
  assert.equal(fenceFor("has ``` inside"), "````");
});

test("review output with a code fence inside stderr cannot close the surrounding block", () => {
  const rendered = renderNativeReviewResult(
    { status: 1, stdout: "", stderr: "boom\n```\nescaped" },
    { reviewLabel: "Review", targetLabel: "working tree diff" }
  );
  assert.match(rendered, /````text\nboom\n```\nescaped\n````/);
});
