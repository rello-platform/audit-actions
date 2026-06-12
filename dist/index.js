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
/**
 * The canonical EXACT action vocabulary.
 *
 * Insertion order is load-bearing: it reproduces the admin dropdown order
 * (CRUD/composites first, then security/tenant → core-CRM → meeting events).
 * `listActiveAuditActions()` returns keys in this order so the dropdown stays
 * byte-identical to the hand-maintained arrays it replaces.
 */
const EXACT_REGISTRY_DATA = {
    // ── CRUD / composite verbs (Rello audit-filters `ACTION_VALUES`, 24) ───────
    create: { lifecycle: "active", kind: "crud_composite" },
    update: { lifecycle: "active", kind: "crud_composite" },
    delete: { lifecycle: "active", kind: "crud_composite" },
    // Soft-delete state-mutation verb. Spoke admin-state soft-deletes (set a
    // CHURNED/inactive flag rather than hard-deleting the row) emit Pattern C →
    // Rello writes `action: "soft_deleted"`. First producer: Newsletter-Studio's
    // `DELETE /api/admin/tenants/[id]` (subscriptionStatus→CHURNED + isActive→false)
    // via `newsletter-studio.audit.tenant.soft_deleted`. Distinct CRUD-class verb
    // with NO base canonical to fold to (it is NOT the hard `delete` — the row
    // survives), so it earns its own EXACT_REGISTRY key, mirroring the precedent
    // set by `converted` / `reactivated`. The dotted `lender_llpa_override.`
    // family already carries a `soft_deleted` leaf — this bare-verb registration
    // is the platform-canonical underscore form for the SAME semantics, surfaced
    // in the admin action-filter dropdown. Underscore form per the ratified
    // grammar (matches `agent_today_card_created` et al.).
    soft_deleted: {
        lifecycle: "active",
        kind: "crud_composite",
        description: "Soft-delete (deactivate without hard-delete) state mutation — e.g. NS tenant soft-delete (CHURNED + isActive=false) via newsletter-studio.audit.tenant.soft_deleted.",
    },
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
    // Guest-MLO lifecycle state-mutation verb (`GUEST_MLO_ACTIONS.CONVERTED`
    // convert route) — bare lowercase CRUD-class verb, mirroring its sibling
    // lifecycle verbs `created→create` / `updated→update` / `activated→ACTIVATE`.
    converted: {
        lifecycle: "active",
        kind: "crud_composite",
        description: "Guest-MLO → agent conversion (guest-mlos convert route).",
    },
    // Guest-MLO reactivation verb (`GUEST_MLO_ACTIONS.REACTIVATED`, guest-mlo
    // reactivate route — FO-1 agent-initiated SUSPENDED→ACTIVE). A distinct
    // lifecycle verb with NO base canonical to fold to (unlike `activated→ACTIVATE`
    // or `revoked→revoke`), so it earns its own EXACT_REGISTRY key, mirroring its
    // sibling `converted`. CRUD-class status update per guest-mlos.ts Q11/FO-1.
    reactivated: {
        lifecycle: "active",
        kind: "crud_composite",
        description: "Guest-MLO reactivation (guest-mlo reactivate route — FO-1 SUSPENDED→ACTIVE).",
    },
    // Entitlement modify composite (`UPDATE_ENTITLEMENT`, tenants/[id]/
    // entitlements/[feature] route) — uppercase composite admin verb, mirroring
    // the `TICKET_UPDATE` / `CONFIG_CHANGE` composite-update convention.
    UPDATE_ENTITLEMENT: {
        lifecycle: "active",
        kind: "crud_composite",
        description: "TenantEntitlement modify (admin entitlements route).",
    },
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
    // ── Domain events: core-CRM tier (17) ──────────────────────────────────────
    lead_tag_added: { lifecycle: "active", kind: "domain_event" },
    lead_tag_removed: { lifecycle: "active", kind: "domain_event" },
    lead_created: { lifecycle: "active", kind: "domain_event" },
    lead_stage_changed: { lifecycle: "active", kind: "domain_event" },
    lead_deleted: { lifecycle: "active", kind: "domain_event" },
    lead_updated: { lifecycle: "active", kind: "domain_event" },
    // LEAD-TRANSFER-PORTABILITY (fork model) — each agent holds a discrete Lead
    // record for the same person. `lead_forked` audits the creation of a new
    // per-agent fork from an existing lead; `lead_moved` audits a lead's
    // ownership transfer between agents. Registered in W1 so the W2 fork/transfer
    // operation can write these without tripping the armed `check:audit-actions`
    // guard (the guard's grandfather baseline is file-keyed, so the W2 writer's
    // not-yet-written file can't be grandfathered ahead of time — canonical
    // registration is the durable, file-independent home).
    lead_forked: { lifecycle: "active", kind: "domain_event" },
    lead_moved: { lifecycle: "active", kind: "domain_event" },
    HUB_LINK_ISSUED: { lifecycle: "active", kind: "domain_event" },
    // Resend variant of HUB_LINK_ISSUED (issue-magic-link.ts ternary) — mirrors
    // its sibling's `domain_event` classification exactly.
    HUB_LINK_RESENT: { lifecycle: "active", kind: "domain_event" },
    HUB_PREVIEW_ISSUED: { lifecycle: "active", kind: "domain_event" },
    HUB_INVITE_NOOP: { lifecycle: "active", kind: "domain_event" },
    LEAD_CLAIMED_VIA_HUB_LINK: { lifecycle: "active", kind: "domain_event" },
    bulk_tag_add: { lifecycle: "active", kind: "domain_event" },
    webhook_endpoint_events_updated: { lifecycle: "active", kind: "domain_event" },
    agent_today_card_created: {
        lifecycle: "active",
        kind: "domain_event",
        description: "AgentTodayCard creation (PFP cockpit re-engagement signal emitters: hecm-eligibility / dscr-reengagement / bankstatement-reengagement).",
    },
    hh_nonqm_type_classified: {
        lifecycle: "active",
        kind: "domain_event",
        description: "Harvest-Home non-QM product classification on the INVESTOR branch (DSCR vs BANK_STATEMENT) at intake — HH-DSCR-AWARE-INTAKE-AND-SCORING. SYSTEM-actored, written Pattern A via src/lib/admin/audit.ts.",
    },
    // Guest-MLO domain-event verbs (emitted via `GUEST_MLO_ACTIONS.*` member
    // expressions / a retention-sweep static literal — terminal values written to
    // `AuditLog.action`). Registered so they resolve + auto-surface in the
    // SOT-derived compliance dropdown (supersedes AUDIT-FILTER-UNION-GUEST-MLO-FIX).
    invite_resent: {
        lifecycle: "active",
        kind: "domain_event",
        description: "Guest-MLO invite re-send (resend-invite / reinvite routes).",
    },
    GUEST_MLO_DISCLOSURE_ACCEPTED: {
        lifecycle: "active",
        kind: "domain_event",
        description: "Guest-MLO RESPA/GLBA disclosure acceptance (accept-disclosure route).",
    },
    GUEST_MLO_DATA_RETENTION_EXPIRED: {
        lifecycle: "active",
        kind: "domain_event",
        description: "Guest-MLO data-retention expiry sweep (guest-mlo-retention-sweep job).",
    },
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
    // ── Domain events: synthetic-session IdP tier (2) ──────────────────────────
    // SYNTHETIC-SESSION-IDP-CAPABILITY Phase 0b (SPEC-260610). Two guarded
    // domain-event verbs for the Big Star test-tenant synthetic-session IdP.
    synthetic_login: { lifecycle: "active", kind: "domain_event", description: "A synthetic test session (ml_token) was minted via POST /api/v1/auth/synthetic-session for a designated isSyntheticTestUser (Big Star test tenant). Logged on every issuance — synthetic logins are the most-audited login class. SPEC-260610." },
    synthetic_flag_set: { lifecycle: "active", kind: "domain_event", description: "A User was flagged isSyntheticTestUser=true via the guarded PLATFORM_ADMIN setter (false→true only, tenant + role-ceiling gated). SPEC-260610." },
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
};
/**
 * The canonical EXACT action vocabulary, typed as a uniform `Record` so callers
 * can read `.tier` / `.kind` on any entry. The underlying object is the
 * literal-narrow `as const` data above (its keys define `CanonicalAuditAction`).
 */
export const EXACT_REGISTRY = EXACT_REGISTRY_DATA;
/**
 * Dotted DOMAIN-action families. Each prefix is a grep-verified `AuditLog.action`
 * value written via `logAudit` in Rello — NOT a signals `<slug>.audit.`
 * signal-type family.
 */
export const FAMILY_REGISTRY = [
    {
        prefix: "closing.key_date.",
        description: "Closing key-date lifecycle (created/updated/completed/deleted) — closing-copilot audit verbs.",
    },
    {
        prefix: "refi_target.",
        description: "Refi-target lifecycle actions (mark_contacted/snooze/dismiss).",
    },
    {
        prefix: "lender_llpa_override.",
        description: "Lender LLPA override lifecycle (created/updated/soft_deleted).",
    },
    {
        prefix: "support.",
        description: "Admin support-tool actions (generate_context/generate_template/suggest_reply).",
    },
    {
        prefix: "crm.connection.",
        description: "Harvest-Home CRM-connection lifecycle (synced/disconnected/expiry_reminder_sent) — written to the Rello-owned AuditLog via the cross-schema raw-SQL helper.",
    },
    {
        prefix: "lead_email.",
        description: "LeadEmail rotation-engine lifecycle (retired/graduated/person_stop) — SKIP-TRACE-MULTI-EMAIL-OUTREACH discovery-wave status transitions written by src/lib/nurture/email-rotation.ts (Rule D: every status transition audited).",
    },
    {
        prefix: "lead_phone.",
        description: "LeadPhone ranked-stack lifecycle (disposition_recorded/graduated/burned) — SKIP-TRACE-PHONE-OUTREACH P-1 calls-only substrate transitions written by Rello src/lib/phones/ranked-stack.ts (Rule D: every disposition/graduation/burn audited; B-01 calls-only — no automated outbound).",
    },
    {
        prefix: "co_marketing.",
        description: "Co-marketing functional co-branding state mutations (branding.upsert/branding.delete, config.update, attestation.write/attestation.revoke, and co_marketing.*_lender_assign verbs) — RESPA-defensibility audit trail per SPEC-RELLO-II-CO-MARKETING-FUNCTIONAL-CO-BRANDING §8.D. NO per-render audit (would create a billing-prep basis — §1.2).",
    },
];
/** Full canonical action set (includes telemetry-tier keys — they ARE known
 *  canonical rows, just not dropdown verbs). Use for drift detection. */
export const CANONICAL_AUDIT_ACTION_SET = new Set(Object.keys(EXACT_REGISTRY));
/** True iff `raw` is an exact canonical action (any tier). */
export function isCanonicalAuditAction(raw) {
    return CANONICAL_AUDIT_ACTION_SET.has(raw);
}
/** The dotted DOMAIN-action family `raw` belongs to, or `null`. */
export function matchesAuditActionFamily(raw) {
    for (const family of FAMILY_REGISTRY) {
        if (raw.startsWith(family.prefix))
            return family;
    }
    return null;
}
/**
 * SOT primitive — the admin action-dropdown denominator. Returns every
 * non-telemetry canonical action in registry (= dropdown) order. Replaces the
 * hand-maintained `ACTION_VALUES` / `EVENT_ACTION_VALUES` arrays.
 */
export function listActiveAuditActions() {
    return Object.keys(EXACT_REGISTRY).filter((action) => EXACT_REGISTRY[action].tier !== "telemetry");
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
export const CRUD_CASE_MAP = {
    CREATE: "create",
    created: "create",
    UPDATE: "update",
    updated: "update",
    DELETE: "delete",
    deleted: "delete",
    activated: "ACTIVATE", // tense → canonical uppercase composite (ACTIVATE ∈ registry)
    revoked: "revoke", // tense → canonical `revoke` (∈ registry); mirrors `deleted→delete`
};
/**
 * 28 prod ApiKey `action` literals → 4 canonical buckets (`create`/`grant`/
 * `update`/`revoke`). Scoped to `entityType=api_key` only — `DELETE` buckets to
 * `revoke` here (soft-revoke semantics), which MUST NOT apply platform-wide.
 * (Ported from `apikey-action-normalization.ts`.)
 */
export const CANONICAL_APIKEY_ACTION_MAP = {
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
/** Derive a forward map's inverse: canonical → all variants (incl. itself). */
function invertForwardMap(forward) {
    const inverse = {};
    for (const [variant, canonical] of Object.entries(forward)) {
        (inverse[canonical] ??= []).push(variant);
    }
    for (const canonical of Object.keys(inverse)) {
        if (!inverse[canonical].includes(canonical))
            inverse[canonical].push(canonical);
    }
    return inverse;
}
/**
 * Inverse of `CRUD_CASE_MAP`: canonical verb → all case/tense variants (incl.
 * the canonical itself). `buildAuditWhere` expands a canonical filter value →
 * all stored variants. Derived identically to Rello's local copy (same forward
 * map, same insertion order) so the expanded array is byte-identical.
 */
export const CRUD_CASE_VARIANTS = invertForwardMap(CRUD_CASE_MAP);
/**
 * Inverse of `CANONICAL_APIKEY_ACTION_MAP`: canonical bucket → all raw variants
 * (incl. the canonical key itself). Used by `buildAuditWhere` only when
 * `entityType=api_key`. Byte-identical to Rello's local derivation.
 */
export const APIKEY_ACTION_BUCKET_VARIANTS = invertForwardMap(CANONICAL_APIKEY_ACTION_MAP);
/**
 * Generic CRUD case/tense fold (legacy parity with `normalizeCrudAction` in
 * `crud-case-normalization.ts`). Folds ONLY `CRUD_CASE_MAP` keys; everything
 * else passes through verbatim (NEVER lowercased — preserves forensic signal).
 * Empty/nullish → `""`.
 */
export function normalizeCrudAction(raw) {
    if (!raw)
        return "";
    const trimmed = raw.trim();
    if (trimmed === "")
        return "";
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
export function normalizeApiKeyAuditAction(raw) {
    if (!raw)
        return "";
    const trimmed = raw.trim();
    if (trimmed === "")
        return "";
    const canonical = CANONICAL_APIKEY_ACTION_MAP[trimmed];
    if (canonical)
        return canonical;
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
export function normalizeAuditAction(raw, entityType) {
    if (!raw)
        return "";
    const trimmed = raw.trim();
    if (trimmed === "")
        return "";
    // (1) api_key-scoped bucket fold wins (DELETE→revoke etc.).
    if (entityType === "api_key") {
        const bucket = CANONICAL_APIKEY_ACTION_MAP[trimmed];
        if (bucket)
            return bucket;
    }
    // (2) generic CRUD case/tense fold.
    const crud = CRUD_CASE_MAP[trimmed];
    if (crud)
        return crud;
    // (3) already canonical (exact verb or dotted family) → verbatim.
    if (isCanonicalAuditAction(trimmed))
        return trimmed;
    if (matchesAuditActionFamily(trimmed))
        return trimmed;
    // (4) unresolved → trimmed raw verbatim (NO lowercasing).
    return trimmed;
}
