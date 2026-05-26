/**
 * @rello-platform/audit-actions — canonical AuditLog `action`-column vocabulary.
 *
 * ── What this package governs ──────────────────────────────────────────────
 * The TERMINAL VERB written to `AuditLog.action` — i.e. the value `logAudit({
 * action })` (Rello) / the spoke Pattern-C `action:` payload field persist into
 * the action column (`create`, `update`, `IMPERSONATE_START`,
 * `rello.meeting_booked`, `closing.key_date.created`, …).
 *
 * ── What this package does NOT govern ──────────────────────────────────────
 * The dotted WIRE signal-TYPE `<slug>.audit.<entity>.<action>` — that vocabulary
 * is owned by `@rello-platform/signals` (`AUDIT_FAMILIES` + the explicit
 * `content-engine.audit.` family in its `FAMILY_REGISTRY`). The two are distinct
 * layers: a spoke emitter sets `signalType` AND `action` separately, and Rello's
 * `handleAuditSignal` writes `logAudit({ action: payload.action })` — the
 * terminal verb, not the signalType. This package therefore declares its OWN
 * action-value families (the dotted DOMAIN-action verbs like `closing.key_date.`)
 * and MUST NOT re-declare the signals `<slug>.audit.` signal-type families.
 *
 * ── Grammar (ratified) ─────────────────────────────────────────────────────
 * Per `~/.claude/standards/audit-logging.md`: canonical lowercase action verbs
 * (`create`/`update`/`delete`/`grant`/`revoke`) + uppercase composite literals
 * (`ACTIVATE`/`CONFIG_CHANGE`/`TENANT_STATUS_CHANGE`/`IMPERSONATE_*`) for
 * non-CRUD events, plus accepted verbatim domain-event vocabulary. The registry
 * keys on this ratified grammar — NOT a strict `^[a-z]+$` shape.
 *
 * SEED step (KEYSPACE-SEED): canonical registry + `listActiveAuditActions()` SOT
 * primitive. NORMALIZER step (B, v0.2.0): `normalizeAuditAction(raw, entityType?)`
 * + the two reverse variant maps, absorbing Rello's two read-side normalizers so
 * the admin filter and the future `check:audit-actions` guard share ONE fold. No
 * build-guard (steps C/D) here.
 *
 * Promotion provenance: the read-side union shipped in Rello's
 * `src/lib/admin/audit-filters.ts` (`ACTION_VALUES` 22 + `EVENT_ACTION_VALUES`
 * 44 = the 66 admin-dropdown entries), promoted here into the canonical SOT.
 */

/** Two-tier grouping mirroring the ratified grammar: canonical CRUD/composite
 *  verbs vs verbatim domain-event literals. Surfaces the admin dropdown's two
 *  optgroups ("CRUD / composites" and "Events") from the SOT. */
export type AuditActionKind = "crud_composite" | "domain_event";

export interface AuditActionEntry {
  /** All registered entries are live. Retirement is a future lifecycle state. */
  readonly lifecycle: "active";
  /** Which dropdown optgroup / grammar tier the verb belongs to. */
  readonly kind: AuditActionKind;
  /**
   * `"telemetry"` marks an operational, high-volume row-class that lands on
   * `AuditLog` today but is NOT a canonical audit VERB and is excluded from the
   * admin action dropdown (e.g. `boot_preflight_*` env-mirror checks). Relocating
   * these off `AuditLog` is a separate Kelly-gated decision (OQ-3).
   */
  readonly tier?: "telemetry";
  /** Human-oriented note on what the verb records. */
  readonly description?: string;
}

/**
 * Dotted DOMAIN-action families — prefix-matched action VALUES (distinct from
 * the signals `<slug>.audit.` signal-type families). Every prefix below is
 * grep-verified as an actual `AuditLog.action` value written via `logAudit`.
 */
export interface AuditActionFamily {
  readonly prefix: string;
  readonly description: string;
}

/**
 * The canonical EXACT action vocabulary.
 *
 * Insertion order is load-bearing: it reproduces the admin dropdown order
 * (CRUD/composites first, then security/tenant → core-CRM → meeting events).
 * `listActiveAuditActions()` returns keys in this order so the dropdown stays
 * byte-identical to the hand-maintained arrays it replaces.
 */
const EXACT_REGISTRY_DATA = {
  // ── CRUD / composite verbs (Rello audit-filters `ACTION_VALUES`, 22) ───────
  create: { lifecycle: "active", kind: "crud_composite" },
  update: { lifecycle: "active", kind: "crud_composite" },
  delete: { lifecycle: "active", kind: "crud_composite" },
  login: { lifecycle: "active", kind: "crud_composite" },
  logout: { lifecycle: "active", kind: "crud_composite" },
  view: { lifecycle: "active", kind: "crud_composite" },
  export: { lifecycle: "active", kind: "crud_composite" },
  import: { lifecycle: "active", kind: "crud_composite" },
  enroll: { lifecycle: "active", kind: "crud_composite" },
  unenroll: { lifecycle: "active", kind: "crud_composite" },
  send: { lifecycle: "active", kind: "crud_composite" },
  grant: { lifecycle: "active", kind: "crud_composite" },
  revoke: { lifecycle: "active", kind: "crud_composite" },
  defer: { lifecycle: "active", kind: "crud_composite", description: "NS send-guardrail verdict" },
  drop: { lifecycle: "active", kind: "crud_composite", description: "NS send-guardrail verdict" },
  preempt: { lifecycle: "active", kind: "crud_composite", description: "NS send-guardrail verdict" },
  TENANT_STATUS_CHANGE: { lifecycle: "active", kind: "crud_composite" },
  TICKET_UPDATE: { lifecycle: "active", kind: "crud_composite" },
  IMPERSONATE_START: { lifecycle: "active", kind: "crud_composite" },
  IMPERSONATE_STOP: { lifecycle: "active", kind: "crud_composite" },
  ACTIVATE: { lifecycle: "active", kind: "crud_composite" },
  CONFIG_CHANGE: { lifecycle: "active", kind: "crud_composite" },

  // ── Domain events: security / tenant tier (9) ──────────────────────────────
  ACCOUNT_DELETE_REQUEST: { lifecycle: "active", kind: "domain_event" },
  ACCOUNT_DELETE_CANCELLED: { lifecycle: "active", kind: "domain_event" },
  SESSION_REVOKE_OTHERS: { lifecycle: "active", kind: "domain_event" },
  ACCOUNT_DATA_EXPORT_REQUESTED: { lifecycle: "active", kind: "domain_event" },
  ACCOUNT_DATA_EXPORT_READY: { lifecycle: "active", kind: "domain_event" },
  TENANT_PROVISIONED: { lifecycle: "active", kind: "domain_event" },
  cross_app_tenant_provisioned: { lifecycle: "active", kind: "domain_event" },
  "TenantApp.CREATE": { lifecycle: "active", kind: "domain_event" },
  "TenantEntitlement.CREATE": { lifecycle: "active", kind: "domain_event" },

  // ── Domain events: core-CRM tier (12) ──────────────────────────────────────
  lead_tag_added: { lifecycle: "active", kind: "domain_event" },
  lead_tag_removed: { lifecycle: "active", kind: "domain_event" },
  lead_created: { lifecycle: "active", kind: "domain_event" },
  lead_stage_changed: { lifecycle: "active", kind: "domain_event" },
  lead_deleted: { lifecycle: "active", kind: "domain_event" },
  lead_updated: { lifecycle: "active", kind: "domain_event" },
  HUB_LINK_ISSUED: { lifecycle: "active", kind: "domain_event" },
  HUB_PREVIEW_ISSUED: { lifecycle: "active", kind: "domain_event" },
  HUB_INVITE_NOOP: { lifecycle: "active", kind: "domain_event" },
  LEAD_CLAIMED_VIA_HUB_LINK: { lifecycle: "active", kind: "domain_event" },
  bulk_tag_add: { lifecycle: "active", kind: "domain_event" },
  webhook_endpoint_events_updated: { lifecycle: "active", kind: "domain_event" },

  // ── Domain events: meeting / booking tier (23) ─────────────────────────────
  // Mirror of Rello `AUDIT_EVENTS` (src/lib/booking/audit-events.ts), promoted
  // verbatim. A Rello-side guard test asserts AUDIT_EVENTS ⊆ this set so a
  // future booking-registry addition cannot silently drop from the dropdown.
  "rello.meeting_booked": { lifecycle: "active", kind: "domain_event" },
  "rello.meeting_completed": { lifecycle: "active", kind: "domain_event" },
  "rello.meeting_canceled": { lifecycle: "active", kind: "domain_event" },
  "rello.meeting_no_show": { lifecycle: "active", kind: "domain_event" },
  "rello.meeting_rescheduled": { lifecycle: "active", kind: "domain_event" },
  "rello.meeting_reminder_dispatched": { lifecycle: "active", kind: "domain_event" },
  "rello.meeting_reminder_suppressed": { lifecycle: "active", kind: "domain_event" },
  "rello.video_link_attached": { lifecycle: "active", kind: "domain_event" },
  "rello.video_link_failed": { lifecycle: "active", kind: "domain_event" },
  "rello.video_provider_connected": { lifecycle: "active", kind: "domain_event" },
  "rello.video_provider_disconnected": { lifecycle: "active", kind: "domain_event" },
  "rello.booking_link_created": { lifecycle: "active", kind: "domain_event" },
  "rello.booking_link_updated": { lifecycle: "active", kind: "domain_event" },
  "rello.booking_link_disabled": { lifecycle: "active", kind: "domain_event" },
  "rello.team_pool_created": { lifecycle: "active", kind: "domain_event" },
  "rello.team_pool_updated": { lifecycle: "active", kind: "domain_event" },
  "rello.team_pool_disabled": { lifecycle: "active", kind: "domain_event" },
  "rello.team_pool_member_added": { lifecycle: "active", kind: "domain_event" },
  "rello.team_pool_member_updated": { lifecycle: "active", kind: "domain_event" },
  "rello.team_pool_member_removed": { lifecycle: "active", kind: "domain_event" },
  "rello.agent_availability_created": { lifecycle: "active", kind: "domain_event" },
  "rello.agent_availability_updated": { lifecycle: "active", kind: "domain_event" },
  "rello.agent_availability_disabled": { lifecycle: "active", kind: "domain_event" },

  // ── Telemetry tier (NOT canonical verbs; excluded from the dropdown) ───────
  // Env-mirror preflight rows (provisioning-core.ts). OQ-3: relocation off
  // AuditLog is a separate Kelly-gated decision.
  boot_preflight_env_mirror_check_v2: {
    lifecycle: "active",
    kind: "domain_event",
    tier: "telemetry",
    description: "env-mirror preflight check (OQ-3: relocation pending)",
  },
  boot_preflight_env_mirror_divergence_detected: {
    lifecycle: "active",
    kind: "domain_event",
    tier: "telemetry",
    description: "env-mirror divergence comparator (OQ-3: relocation pending)",
  },
} as const satisfies Record<string, AuditActionEntry>;

/** `as const` union of every EXACT registry key. */
export type CanonicalAuditAction = keyof typeof EXACT_REGISTRY_DATA;

/**
 * The canonical EXACT action vocabulary, typed as a uniform `Record` so callers
 * can read `.tier` / `.kind` on any entry. The underlying object is the
 * literal-narrow `as const` data above (its keys define `CanonicalAuditAction`).
 */
export const EXACT_REGISTRY: Record<CanonicalAuditAction, AuditActionEntry> =
  EXACT_REGISTRY_DATA;

/**
 * Dotted DOMAIN-action families. Each prefix is a grep-verified `AuditLog.action`
 * value written via `logAudit` in Rello — NOT a signals `<slug>.audit.`
 * signal-type family.
 */
export const FAMILY_REGISTRY: readonly AuditActionFamily[] = [
  {
    prefix: "closing.key_date.",
    description:
      "Closing key-date lifecycle (created/updated/completed/deleted) — closing-copilot audit verbs.",
  },
  {
    prefix: "refi_target.",
    description:
      "Refi-target lifecycle actions (mark_contacted/snooze/dismiss).",
  },
  {
    prefix: "lender_llpa_override.",
    description:
      "Lender LLPA override lifecycle (created/updated/soft_deleted).",
  },
  {
    prefix: "support.",
    description:
      "Admin support-tool actions (generate_context/generate_template/suggest_reply).",
  },
] as const;

/** Full canonical action set (includes telemetry-tier keys — they ARE known
 *  canonical rows, just not dropdown verbs). Use for drift detection. */
export const CANONICAL_AUDIT_ACTION_SET: ReadonlySet<string> = new Set(
  Object.keys(EXACT_REGISTRY),
);

/** True iff `raw` is an exact canonical action (any tier). */
export function isCanonicalAuditAction(raw: string): raw is CanonicalAuditAction {
  return CANONICAL_AUDIT_ACTION_SET.has(raw);
}

/** The dotted DOMAIN-action family `raw` belongs to, or `null`. */
export function matchesAuditActionFamily(raw: string): AuditActionFamily | null {
  for (const family of FAMILY_REGISTRY) {
    if (raw.startsWith(family.prefix)) return family;
  }
  return null;
}

/**
 * SOT primitive — the admin action-dropdown denominator. Returns every
 * non-telemetry canonical action in registry (= dropdown) order. Replaces the
 * hand-maintained `ACTION_VALUES` / `EVENT_ACTION_VALUES` arrays.
 */
export function listActiveAuditActions(): readonly CanonicalAuditAction[] {
  return (Object.keys(EXACT_REGISTRY) as CanonicalAuditAction[]).filter(
    (action) => EXACT_REGISTRY[action].tier !== "telemetry",
  );
}

// ───────────────────────────────────────────────────────────────────────────
// NORMALIZER (step B) — absorbs Rello's two read-side action-normalizers.
//
// Promotion provenance: this folds + the two reverse variant maps are ported
// VERBATIM from Rello's `src/lib/audit/{crud-case,apikey-action}-normalization.ts`
// so the admin filter expansion (`buildAuditWhere`) and the future
// `check:audit-actions` guard share ONE canonical fold. Behavior-neutral — same
// maps, same derivation, now packaged + reused.
//
// CRITICAL — pass-through is verbatim (NOT lowercased). The unified
// `normalizeAuditAction` folds ONLY the explicit map keys; domain-event vocab
// (`lead_tag_added`, `TENANT_PROVISIONED`, `rello.meeting_booked`, …) and dotted
// families pass through untouched, preserving forensic signal. The legacy
// `normalizeApiKeyAuditAction` retains its `.toLowerCase()` miss fallback for
// byte-identical parity with the shipped per-ApiKey audit-trail display.
// ───────────────────────────────────────────────────────────────────────────

/**
 * Generic CRUD case + tense fold → canonical lowercase verb (all members of
 * the CRUD/composite registry tier). `activated` folds to the canonical
 * uppercase composite `ACTIVATE`. Only these keys fold; everything else passes
 * through verbatim. (Ported from `crud-case-normalization.ts`.)
 */
export const CRUD_CASE_MAP: Record<string, string> = {
  CREATE: "create",
  created: "create",
  UPDATE: "update",
  updated: "update",
  DELETE: "delete",
  deleted: "delete",
  activated: "ACTIVATE", // tense → canonical uppercase composite (ACTIVATE ∈ registry)
};

/**
 * 28 prod ApiKey `action` literals → 4 canonical buckets (`create`/`grant`/
 * `update`/`revoke`). Scoped to `entityType=api_key` only — `DELETE` buckets to
 * `revoke` here (soft-revoke semantics), which MUST NOT apply platform-wide.
 * (Ported from `apikey-action-normalization.ts`.)
 */
export const CANONICAL_APIKEY_ACTION_MAP: Record<string, string> = {
  // create (mint) — 7 variants
  "apikey.created": "create",
  "apikey.create": "create",
  create: "create",
  CREATE: "create",
  "apikey.mint": "create",
  api_key_minted: "create",
  "apikey.minted_broad_scope_canonical_pfp_rello": "create",
  // grant (permission addition) — 4 variants
  "apikey.permissions.append": "grant",
  "apikey.permissions_appended": "grant",
  "apikey.permissions_appended_recovery": "grant",
  "ApiKey.PERMISSION_GRANTED": "grant",
  // update (permission modify/replace/remove + key-field change) — 9 variants
  update: "update",
  UPDATE: "update",
  "apikey.update": "update",
  "apikey.permissions.update": "update",
  "apikey.permissions_replaced": "update",
  "apikey.permission_removed_post_callsite_refactor": "update",
  "apikey.permissions_legacy_slug_removed": "update",
  "apikey.rotated": "update", // key-material rotation (changes oldSha→newSha); no canonical "rotate"
  "apikey.tenant_scoped": "update", // verified: changes={tenantId:{from:null,to:...}} — modifies existing key
  // revoke (revoke / deactivate / soft-delete) — 8 variants
  "apikey.revoked": "revoke",
  DELETE: "revoke", // DELETE handler does soft-revoke (isActive=false), not hard delete
  "apikey.revoke": "revoke",
  revoke: "revoke",
  apikey_orphan_deactivated: "revoke",
  DEACTIVATE: "revoke",
  "soft-revoke": "revoke",
  "apikey.deactivated_exhaustive_search_no_consumer_found": "revoke",
};

export type CanonicalApiKeyAction =
  (typeof CANONICAL_APIKEY_ACTION_MAP)[keyof typeof CANONICAL_APIKEY_ACTION_MAP];

/** Derive a forward map's inverse: canonical → all variants (incl. itself). */
function invertForwardMap(forward: Record<string, string>): Record<string, string[]> {
  const inverse: Record<string, string[]> = {};
  for (const [variant, canonical] of Object.entries(forward)) {
    (inverse[canonical] ??= []).push(variant);
  }
  for (const canonical of Object.keys(inverse)) {
    if (!inverse[canonical].includes(canonical)) inverse[canonical].push(canonical);
  }
  return inverse;
}

/**
 * Inverse of `CRUD_CASE_MAP`: canonical verb → all case/tense variants (incl.
 * the canonical itself). `buildAuditWhere` expands a canonical filter value →
 * all stored variants. Derived identically to Rello's local copy (same forward
 * map, same insertion order) so the expanded array is byte-identical.
 */
export const CRUD_CASE_VARIANTS: Record<string, string[]> =
  invertForwardMap(CRUD_CASE_MAP);

/**
 * Inverse of `CANONICAL_APIKEY_ACTION_MAP`: canonical bucket → all raw variants
 * (incl. the canonical key itself). Used by `buildAuditWhere` only when
 * `entityType=api_key`. Byte-identical to Rello's local derivation.
 */
export const APIKEY_ACTION_BUCKET_VARIANTS: Record<string, string[]> =
  invertForwardMap(CANONICAL_APIKEY_ACTION_MAP);

/**
 * Generic CRUD case/tense fold (legacy parity with `normalizeCrudAction` in
 * `crud-case-normalization.ts`). Folds ONLY `CRUD_CASE_MAP` keys; everything
 * else passes through verbatim (NEVER lowercased — preserves forensic signal).
 * Empty/nullish → `""`.
 */
export function normalizeCrudAction(raw: string | null | undefined): string {
  if (!raw) return "";
  const trimmed = raw.trim();
  if (trimmed === "") return "";
  return CRUD_CASE_MAP[trimmed] ?? trimmed;
}

/**
 * ApiKey 28→4 bucket fold (legacy parity with `normalizeApiKeyAuditAction` in
 * `apikey-action-normalization.ts`). Unknown values fall back to
 * `raw.toLowerCase().trim()` — this lowercasing miss-fallback is retained for
 * byte-identical parity with the shipped per-ApiKey audit-trail display surface
 * (DELIBERATELY different from the verbatim pass-through of the generic fold).
 * Empty/nullish → `""`.
 */
export function normalizeApiKeyAuditAction(raw: string | null | undefined): string {
  if (!raw) return "";
  const trimmed = raw.trim();
  if (trimmed === "") return "";
  const canonical = CANONICAL_APIKEY_ACTION_MAP[trimmed];
  if (canonical) return canonical;
  return trimmed.toLowerCase();
}

/**
 * Unified canonical action fold — the step-B deliverable. Resolves a raw
 * `AuditLog.action` value to its canonical form for the (future)
 * `check:audit-actions` guard AND any read normalization, sharing ONE fold.
 *
 * Precedence (matches the read-side inverse semantics):
 *   1. `entityType === "api_key"` → the ApiKey 28→4 bucket fold takes precedence
 *      (so `DELETE` → `revoke` soft-revoke semantics, NOT the generic `delete`).
 *   2. otherwise the generic CRUD case/tense fold (`CREATE`/`updated`/… → verb).
 *   3. already-canonical exact verbs + dotted-family values → returned VERBATIM.
 *   4. unresolved → trimmed `raw` VERBATIM (NO lowercasing — forensic signal).
 *
 * Empty/nullish → `""`. Domain-event vocab + dotted families always pass through
 * unchanged. This is INTENTIONALLY non-lowercasing on miss (unlike the legacy
 * `normalizeApiKeyAuditAction`); the legacy fn is retained separately for the
 * display surface that relies on its lowercasing.
 */
export function normalizeAuditAction(
  raw: string | null | undefined,
  entityType?: string,
): string {
  if (!raw) return "";
  const trimmed = raw.trim();
  if (trimmed === "") return "";
  // (1) api_key-scoped bucket fold wins (DELETE→revoke etc.).
  if (entityType === "api_key") {
    const bucket = CANONICAL_APIKEY_ACTION_MAP[trimmed];
    if (bucket) return bucket;
  }
  // (2) generic CRUD case/tense fold.
  const crud = CRUD_CASE_MAP[trimmed];
  if (crud) return crud;
  // (3) already canonical (exact verb or dotted family) → verbatim.
  if (isCanonicalAuditAction(trimmed)) return trimmed;
  if (matchesAuditActionFamily(trimmed)) return trimmed;
  // (4) unresolved → trimmed raw verbatim (NO lowercasing).
  return trimmed;
}
