import assert from "node:assert/strict";

// Called only by the explicitly enabled live Owner 2 smoke; at most two shopping requests.
export async function smokeOwner3({ baseUrl, look, supabase, workspaceId }) {
  const savedIds = [];
  async function api(path, method = "GET", body, expectedStatus = 200) {
    const response = await fetch(new URL(path, baseUrl), {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(60000),
    });
    const payload = await response.json().catch(() => null);
    // Do not include paths here: public paths contain bearer share tokens.
    assert.equal(
      response.status,
      expectedStatus,
      `${method} returned ${response.status}: ${payload?.error?.code || "unexpected response"}`,
    );
    assert.match(response.headers.get("cache-control") || "", /no-store/);
    return payload;
  }
  const lookId = look.id;
  const option = look.options.find((entry) => entry.option_type === "closest");
  assert.ok(option, "Owner 2 must persist a closest option");
  const prefix = `/api/looks/${lookId}`;
  try {
    const before = await api(`${prefix}/products?option_id=${option.id}`);
    assert.equal(before.items.length, option.items.length);
    const missing = before.items
      .filter((entry) => entry.item_kind === "missing")
      .slice(0, 2);
    assert.equal(
      missing.length,
      2,
      "Integration fixture requires two missing pieces",
    );
    const selections = [];
    for (const item of missing) {
      const found = await api(`${prefix}/products/search`, "POST", {
        option_id: option.id,
        option_item_id: item.id,
      });
      assert.equal(found.source_type, "live");
      assert.ok(
        found.items.length,
        "Live shopping must return a valid candidate",
      );
      assert.ok(
        found.items.every(
          (entry) => entry.source_type === "live" && entry.source_label,
        ),
      );
      selections.push({
        option_item_id: item.id,
        product_id: found.items[0].id,
        alternatives: found.items,
      });
    }
    console.log(
      "PASS: two Owner 2 missing slots searched through live SerpAPI and persisted",
    );
    const compare = await api(`${prefix}/products?option_id=${option.id}`);
    for (const selection of selections) {
      const item = compare.items.find(
        (entry) => entry.id === selection.option_item_id,
      );
      assert.ok(
        item.candidates.some((entry) => entry.id === selection.product_id),
      );
    }
    for (let index = 0; index < selections.length; index++) {
      const selection = selections[index];
      const detail = await api(`${prefix}/selection`, "PUT", {
        option_id: option.id,
        expected_revision: look.revision,
        choices: [
          {
            option_item_id: selection.option_item_id,
            product_id: selection.product_id,
          },
        ],
      });
      for (const previous of selections.slice(0, index + 1)) {
        assert.equal(
          detail.items.find((entry) => entry.id === previous.option_item_id)
            .product_id,
          previous.product_id,
        );
      }
      assert.ok(
        detail.items
          .filter((entry) => entry.kind === "product")
          .every((entry) => entry.ownership === "suggested"),
      );
    }
    console.log(
      "PASS: independent per-slot selection preserves prior choices and suggested ownership",
    );
    const detail = await api(`${prefix}/selected?option_id=${option.id}`);
    assert.equal(detail.selected_option.id, option.id);
    const owner2Reload = await api(prefix);
    assert.equal(owner2Reload.data.selected_option_id, option.id);
    assert.equal(
      owner2Reload.data.options
        .find((entry) => entry.id === option.id)
        .items.filter((entry) => entry.item_kind === "product").length,
      2,
    );
    console.log(
      "PASS: Owner 2 reload and Owner 3 selected detail agree on real IDs",
    );
    await api(
      `${prefix}/selection`,
      "PUT",
      {
        option_id: option.id,
        expected_revision: look.revision + 1,
        choices: [
          {
            option_item_id: selections[0].option_item_id,
            product_id: selections[0].product_id,
          },
        ],
      },
      409,
    );
    console.log("PASS: stale source revision returns a recoverable conflict");
    await api(
      `${prefix}/save`,
      "POST",
      {
        option_id: option.id,
        expected_revision: look.revision,
        workspace_id: workspaceId,
      },
      400,
    );
    console.log("PASS: client-supplied workspace is rejected");
    const saved = await api(
      `${prefix}/save`,
      "POST",
      { option_id: option.id, expected_revision: look.revision },
      201,
    );
    savedIds.push(saved.saved_look_id);
    const snapshot = await api(`/api/saved-looks/${saved.saved_look_id}`);
    assert.ok(
      snapshot.items.some(
        (entry) => entry.product_id === selections[0].product_id,
      ),
    );
    const alternate = selections[0].alternatives.find(
      (entry) => entry.id !== selections[0].product_id,
    );
    assert.ok(
      alternate,
      "Need a second real candidate to verify immutable saves",
    );
    await api(`${prefix}/selection`, "PUT", {
      option_id: option.id,
      expected_revision: look.revision,
      choices: [
        {
          option_item_id: selections[0].option_item_id,
          product_id: alternate.id,
        },
      ],
    });
    const reloadedSnapshot = await api(
      `/api/saved-looks/${saved.saved_look_id}`,
    );
    assert.deepEqual(reloadedSnapshot.items, snapshot.items);
    const collection = await api("/api/saved-looks?limit=50");
    assert.ok(
      collection.items.some((entry) => entry.id === saved.saved_look_id),
    );
    console.log(
      "PASS: save/reopen is immutable after changing a real product selection",
    );
    const share = await api(
      `/api/saved-looks/${saved.saved_look_id}/shares`,
      "POST",
      { catchphrase: "Integration smoke", expires_in_hours: 1 },
      201,
    );
    const publicPath = `/api/shared/${share.share_token}`;
    const published = await api(publicPath);
    assert.deepEqual(Object.keys(published).sort(), [
      "catchphrase",
      "public_snapshot",
    ]);
    assert.deepEqual(Object.keys(published.public_snapshot).sort(), [
      "items",
      "source_type",
      "title",
    ]);
    for (const item of published.public_snapshot.items) {
      assert.deepEqual(Object.keys(item).sort(), [
        "category",
        "color",
        "kind",
        "name",
      ]);
    }
    await api(`/api/shares/${share.share_id}`, "DELETE");
    await api(`/api/shares/${share.share_id}`, "DELETE");
    await api(publicPath, "GET", undefined, 404);
    console.log(
      "PASS: public share is minimal; revoke is idempotent and invalidates the token",
    );
  } finally {
    async function remove(query, label) {
      const { error } = await query;
      if (error) throw new Error(`Integration cleanup failed: ${label}`);
    }
    for (const savedId of savedIds) {
      await remove(
        supabase
          .from("share_links")
          .delete()
          .eq("workspace_id", workspaceId)
          .eq("saved_look_id", savedId),
        "share",
      );
      await remove(
        supabase
          .from("saved_look_snapshots")
          .delete()
          .eq("workspace_id", workspaceId)
          .eq("id", savedId),
        "snapshot",
      );
    }
    await remove(
      supabase
        .from("looks")
        .update({ selected_option_id: null })
        .eq("workspace_id", workspaceId)
        .eq("id", lookId),
      "selected option",
    );
    console.log(
      "CLEANUP: integration snapshots and shares removed; live product catalog retained",
    );
  }
}
