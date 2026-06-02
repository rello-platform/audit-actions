import assert from "node:assert/strict";
import { test } from "node:test";

import {
  APIKEY_ACTION_BUCKET_VARIANTS,
  CANONICAL_APIKEY_ACTION_MAP,
  CANONICAL_AUDIT_ACTION_SET,
  CRUD_CASE_MAP,
  CRUD_CASE_VARIANTS,
  EXACT_REGISTRY,
  FAMILY_REGISTRY,
  isCanonicalAuditAction,
  listActiveAuditActions,
  matchesAuditActionFamily,
  normalizeApiKeyAuditAction,
  normalizeAuditAction,
  normalizeCrudAction,
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

test("listActiveAuditActions reproduces the dropdown entries, grouped + ordered", () => {
  const active = listActiveAuditActions();
  assert.equal(active.length, 76);

  const crud = active.filter((a) => EXACT_REGISTRY[a].kind === "crud_composite");
  const events = active.filter((a) => EXACT_REGISTRY[a].kind === "domain_event");
  assert.equal(crud.length, 26, "CRUD/composite optgroup (22 + converted + reactivated + UPDATE_ENTITLEMENT + soft_deleted)");
  assert.equal(
    events.length,
    50,
    "Events optgroup (45 + HUB_LINK_RESENT + invite_resent + GUEST_MLO_DISCLOSURE_ACCEPTED + GUEST_MLO_DATA_RETENTION_EXPIRED + hh_nonqm_type_classified)",
  );

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
  assert.equal(isCanonicalAuditAction("agent_today_card_created"), true);
  assert.equal(isCanonicalAuditAction("reactivated"), true);
  assert.equal(isCanonicalAuditAction("soft_deleted"), true);
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
  assert.equal(matchesAuditActionFamily("crm.connection.synced")?.prefix, "crm.connection.");
  assert.equal(matchesAuditActionFamily("crm.connection.disconnected")?.prefix, "crm.connection.");
  assert.equal(matchesAuditActionFamily("crm.connection.expiry_reminder_sent")?.prefix, "crm.connection.");
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

// ── step B: normalizer + reverse variant maps ──────────────────────────────

test("CRUD_CASE_MAP folds case/tense to canonical (8 keys, verbatim otherwise)", () => {
  assert.equal(Object.keys(CRUD_CASE_MAP).length, 8);
  assert.equal(normalizeCrudAction("CREATE"), "create");
  assert.equal(normalizeCrudAction("created"), "create");
  assert.equal(normalizeCrudAction("UPDATE"), "update");
  assert.equal(normalizeCrudAction("updated"), "update");
  assert.equal(normalizeCrudAction("DELETE"), "delete");
  assert.equal(normalizeCrudAction("deleted"), "delete");
  assert.equal(normalizeCrudAction("activated"), "ACTIVATE");
  assert.equal(normalizeCrudAction("revoked"), "revoke");
  // verbatim pass-through — NEVER lowercased
  assert.equal(normalizeCrudAction("TENANT_PROVISIONED"), "TENANT_PROVISIONED");
  assert.equal(normalizeCrudAction("rello.meeting_booked"), "rello.meeting_booked");
  assert.equal(normalizeCrudAction("  create  "), "create");
  assert.equal(normalizeCrudAction(""), "");
  assert.equal(normalizeCrudAction(null), "");
});

test("CANONICAL_APIKEY_ACTION_MAP is 28 variants → 4 buckets; legacy fn lowercases on miss", () => {
  assert.equal(Object.keys(CANONICAL_APIKEY_ACTION_MAP).length, 28);
  const buckets = new Set(Object.values(CANONICAL_APIKEY_ACTION_MAP));
  assert.deepEqual([...buckets].sort(), ["create", "grant", "revoke", "update"]);
  for (const [variant, bucket] of Object.entries(CANONICAL_APIKEY_ACTION_MAP)) {
    assert.equal(normalizeApiKeyAuditAction(variant), bucket, `${variant} → ${bucket}`);
  }
  // legacy miss fallback is LOWERCASE (display-surface parity)
  assert.equal(normalizeApiKeyAuditAction("SomethingWeird"), "somethingweird");
  assert.equal(normalizeApiKeyAuditAction(""), "");
});

test("reverse variant maps round-trip every forward entry, canonical included", () => {
  for (const [variant, canonical] of Object.entries(CRUD_CASE_MAP)) {
    assert.ok(CRUD_CASE_VARIANTS[canonical].includes(variant));
    assert.ok(CRUD_CASE_VARIANTS[canonical].includes(canonical));
  }
  for (const [variant, bucket] of Object.entries(CANONICAL_APIKEY_ACTION_MAP)) {
    assert.ok(APIKEY_ACTION_BUCKET_VARIANTS[bucket].includes(variant));
    assert.ok(APIKEY_ACTION_BUCKET_VARIANTS[bucket].includes(bucket));
  }
  // exact reproduction of the shipped derivation order (load-bearing for the
  // byte-identical buildAuditWhere where-clause)
  assert.deepEqual(CRUD_CASE_VARIANTS["update"], ["UPDATE", "updated", "update"]);
  assert.deepEqual(CRUD_CASE_VARIANTS["delete"], ["DELETE", "deleted", "delete"]);
  assert.deepEqual(CRUD_CASE_VARIANTS["ACTIVATE"], ["activated", "ACTIVATE"]);
  assert.deepEqual(CRUD_CASE_VARIANTS["revoke"], ["revoked", "revoke"]);
  assert.deepEqual(APIKEY_ACTION_BUCKET_VARIANTS["update"], [
    "update",
    "UPDATE",
    "apikey.update",
    "apikey.permissions.update",
    "apikey.permissions_replaced",
    "apikey.permission_removed_post_callsite_refactor",
    "apikey.permissions_legacy_slug_removed",
    "apikey.rotated",
    "apikey.tenant_scoped",
  ]);
});

test("normalizeAuditAction: generic CRUD fold + verbatim domain/family pass-through", () => {
  assert.equal(normalizeAuditAction("CREATE"), "create");
  assert.equal(normalizeAuditAction("updated"), "update");
  assert.equal(normalizeAuditAction("activated"), "ACTIVATE");
  assert.equal(normalizeAuditAction("revoked"), "revoke");
  // domain events + families pass VERBATIM (no lowercasing)
  assert.equal(normalizeAuditAction("TENANT_PROVISIONED"), "TENANT_PROVISIONED");
  assert.equal(normalizeAuditAction("rello.meeting_booked"), "rello.meeting_booked");
  assert.equal(normalizeAuditAction("closing.key_date.created"), "closing.key_date.created");
  assert.equal(normalizeAuditAction("lender_llpa_override.soft_deleted"), "lender_llpa_override.soft_deleted");
  // unresolved → trimmed raw VERBATIM (NO lowercasing)
  assert.equal(normalizeAuditAction("SomethingWeird"), "SomethingWeird");
  assert.equal(normalizeAuditAction("  GUEST_MLO_DATA_RETENTION_EXPIRED  "), "GUEST_MLO_DATA_RETENTION_EXPIRED");
  assert.equal(normalizeAuditAction(""), "");
  assert.equal(normalizeAuditAction(null), "");
});

test("normalizeAuditAction: api_key scoping — bucket fold wins (DELETE→revoke)", () => {
  // api_key-scoped: the ApiKey bucket fold takes precedence
  assert.equal(normalizeAuditAction("DELETE", "api_key"), "revoke");
  assert.equal(normalizeAuditAction("apikey.rotated", "api_key"), "update");
  assert.equal(normalizeAuditAction("apikey.mint", "api_key"), "create");
  assert.equal(normalizeAuditAction("ApiKey.PERMISSION_GRANTED", "api_key"), "grant");
  // WITHOUT api_key scope, DELETE folds to the GENERIC delete (not revoke)
  assert.equal(normalizeAuditAction("DELETE"), "delete");
  assert.equal(normalizeAuditAction("DELETE", "lead"), "delete");
  // api_key value not in the bucket map falls through to the CRUD fold then verbatim
  assert.equal(normalizeAuditAction("updated", "api_key"), "update");
  assert.equal(normalizeAuditAction("rello.meeting_booked", "api_key"), "rello.meeting_booked");
  // every ApiKey variant round-trips to its bucket under api_key scope
  for (const [variant, bucket] of Object.entries(CANONICAL_APIKEY_ACTION_MAP)) {
    assert.equal(normalizeAuditAction(variant, "api_key"), bucket, `${variant} → ${bucket}`);
  }
});
