import assert from "node:assert/strict";
import { test } from "node:test";

import {
  CANONICAL_AUDIT_ACTION_SET,
  EXACT_REGISTRY,
  FAMILY_REGISTRY,
  isCanonicalAuditAction,
  listActiveAuditActions,
  matchesAuditActionFamily,
} from "./index.js";

test("EXACT_REGISTRY keys === CANONICAL_AUDIT_ACTION_SET", () => {
  const keys = Object.keys(EXACT_REGISTRY);
  assert.equal(keys.length, CANONICAL_AUDIT_ACTION_SET.size);
  for (const k of keys) assert.equal(CANONICAL_AUDIT_ACTION_SET.has(k), true);
});

test("every exact entry conforms to the ratified grammar tiers", () => {
  for (const [action, entry] of Object.entries(EXACT_REGISTRY)) {
    assert.equal(entry.lifecycle, "active", `${action} must be active`);
    assert.ok(
      entry.kind === "crud_composite" || entry.kind === "domain_event",
      `${action} has an invalid kind`,
    );
    if (entry.tier !== undefined) {
      assert.equal(entry.tier, "telemetry", `${action} tier must be telemetry`);
    }
  }
});

test("telemetry tier flagged + excluded from the active dropdown denominator", () => {
  const active = listActiveAuditActions();
  assert.equal(active.includes("boot_preflight_env_mirror_check_v2" as never), false);
  assert.equal(
    active.includes("boot_preflight_env_mirror_divergence_detected" as never),
    false,
  );
  assert.equal(EXACT_REGISTRY.boot_preflight_env_mirror_check_v2.tier, "telemetry");
  assert.equal(
    EXACT_REGISTRY.boot_preflight_env_mirror_divergence_detected.tier,
    "telemetry",
  );
  // ...but they ARE canonical-known (a future guard must not flag them as drift).
  assert.equal(isCanonicalAuditAction("boot_preflight_env_mirror_check_v2"), true);
});

test("listActiveAuditActions reproduces the 66 dropdown entries, grouped + ordered", () => {
  const active = listActiveAuditActions();
  assert.equal(active.length, 66);

  const crud = active.filter((a) => EXACT_REGISTRY[a].kind === "crud_composite");
  const events = active.filter((a) => EXACT_REGISTRY[a].kind === "domain_event");
  assert.equal(crud.length, 22, "CRUD/composite optgroup must stay 22");
  assert.equal(events.length, 44, "Events optgroup must stay 44");

  // Insertion order: every CRUD verb precedes every domain event (single split).
  const firstEventIdx = active.findIndex(
    (a) => EXACT_REGISTRY[a].kind === "domain_event",
  );
  const lastCrudIdx =
    active.length -
    1 -
    [...active].reverse().findIndex((a) => EXACT_REGISTRY[a].kind === "crud_composite");
  assert.ok(lastCrudIdx < firstEventIdx, "CRUD group must precede the events group");

  // Order anchors (head + tail of each group).
  assert.equal(crud[0], "create");
  assert.equal(crud[crud.length - 1], "CONFIG_CHANGE");
  assert.equal(events[0], "ACCOUNT_DELETE_REQUEST");
  assert.equal(events[events.length - 1], "rello.agent_availability_disabled");
});

test("isCanonicalAuditAction narrows known + rejects unknown", () => {
  assert.equal(isCanonicalAuditAction("create"), true);
  assert.equal(isCanonicalAuditAction("TenantApp.CREATE"), true);
  assert.equal(isCanonicalAuditAction("rello.meeting_booked"), true);
  assert.equal(isCanonicalAuditAction("not_a_real_action"), false);
  assert.equal(isCanonicalAuditAction(""), false);
});

test("matchesAuditActionFamily matches dotted domain-action prefixes only", () => {
  assert.equal(matchesAuditActionFamily("closing.key_date.created")?.prefix, "closing.key_date.");
  assert.equal(matchesAuditActionFamily("refi_target.snooze")?.prefix, "refi_target.");
  assert.equal(
    matchesAuditActionFamily("lender_llpa_override.soft_deleted")?.prefix,
    "lender_llpa_override.",
  );
  assert.equal(matchesAuditActionFamily("support.suggest_reply")?.prefix, "support.");
  assert.equal(matchesAuditActionFamily("create"), null);
  // Must NOT claim the signals-owned `<slug>.audit.` signal-type families.
  assert.equal(matchesAuditActionFamily("content-engine.audit.lead.created"), null);
  assert.equal(matchesAuditActionFamily("rello.audit.tenant.updated"), null);
});

test("FAMILY_REGISTRY does not re-declare signals <slug>.audit. families", () => {
  for (const fam of FAMILY_REGISTRY) {
    assert.equal(/\.audit\.$/.test(fam.prefix), false, `${fam.prefix} collides with signals`);
    assert.ok(fam.prefix.endsWith("."), `${fam.prefix} must be a dotted prefix`);
  }
});
