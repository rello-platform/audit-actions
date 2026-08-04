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
     *
     * ── THE DEFAULT IS RETAIN, AND IT IS STRUCTURAL ──────────────────────────
     * This field is OPTIONAL, and that is load-bearing rather than incidental.
     * Absent `tier` means the action is retained. An action nobody has
     * classified — including every action added in the future, and every action
     * not in this registry at all — is therefore RETAINED by construction, not by
     * anyone remembering a convention. A retention default that failed toward
     * deletion on a compliance table would be worse than having no tiering at
     * all, so the only way to opt a row-class OUT of retention is to write
     * `tier: "telemetry"` here, deliberately, with a justification.
     *
     * Consumers MUST therefore treat "no entry" and "entry without tier"
     * identically: retain. Never infer telemetry from absence.
     *
     * ── RETAINED BY DECISION, NOT BY OMISSION (Kelly, 2026-08-04) ────────────
     * A full classification of all 293 (action, entityType) pairs on PROD ran on
     * 2026-08-04. Eleven ambiguous row-classes were reviewed and explicitly
     * RETAINED. They are recorded here so a later pass does not "discover" them
     * as untriaged and tier them:
     *   COST_LEDGER_APPEND, COST_LEDGER_REVERSAL, lead_tag_added, task.created,
     *   create/PlatformSignal, fired (LeadSharingRule + LeadSharingNotification),
     *   lead_created / lead_updated / lead_deleted, mailgun_event_unmatched,
     *   drop/NewsletterSend, sms.default_used + sms.service-send,
     *   synthetic_login + synthetic_flag_set.
     *
     * `COST_LEDGER_APPEND` / `COST_LEDGER_REVERSAL` are HARD-EXCLUDED from ever
     * being tiered. They are written by a Postgres trigger
     * (`fn_costledger_insert_audit`) whose audit INSERT sits deliberately OUTSIDE
     * the exception guard, so a failed audit write aborts the `CostLedger` INSERT
     * — a fail-closed integrity guarantee on an append-only financial ledger.
     * Tiering or relocating them would remove that guarantee. Do not.
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
declare const EXACT_REGISTRY_DATA: {
    readonly create: {
        readonly lifecycle: "active";
        readonly kind: "crud_composite";
    };
    readonly update: {
        readonly lifecycle: "active";
        readonly kind: "crud_composite";
    };
    readonly delete: {
        readonly lifecycle: "active";
        readonly kind: "crud_composite";
    };
    readonly soft_deleted: {
        readonly lifecycle: "active";
        readonly kind: "crud_composite";
        readonly description: "Soft-delete (deactivate without hard-delete) state mutation — e.g. NS tenant soft-delete (CHURNED + isActive=false) via newsletter-studio.audit.tenant.soft_deleted.";
    };
    readonly login: {
        readonly lifecycle: "active";
        readonly kind: "crud_composite";
    };
    readonly logout: {
        readonly lifecycle: "active";
        readonly kind: "crud_composite";
    };
    readonly view: {
        readonly lifecycle: "active";
        readonly kind: "crud_composite";
    };
    readonly export: {
        readonly lifecycle: "active";
        readonly kind: "crud_composite";
    };
    readonly import: {
        readonly lifecycle: "active";
        readonly kind: "crud_composite";
    };
    readonly enroll: {
        readonly lifecycle: "active";
        readonly kind: "crud_composite";
    };
    readonly unenroll: {
        readonly lifecycle: "active";
        readonly kind: "crud_composite";
    };
    readonly send: {
        readonly lifecycle: "active";
        readonly kind: "crud_composite";
    };
    readonly grant: {
        readonly lifecycle: "active";
        readonly kind: "crud_composite";
    };
    readonly revoke: {
        readonly lifecycle: "active";
        readonly kind: "crud_composite";
    };
    readonly defer: {
        readonly lifecycle: "active";
        readonly kind: "crud_composite";
        readonly description: "NS send-guardrail verdict";
    };
    readonly drop: {
        readonly lifecycle: "active";
        readonly kind: "crud_composite";
        readonly description: "NS send-guardrail verdict";
    };
    readonly preempt: {
        readonly lifecycle: "active";
        readonly kind: "crud_composite";
        readonly description: "NS send-guardrail verdict";
    };
    readonly TENANT_STATUS_CHANGE: {
        readonly lifecycle: "active";
        readonly kind: "crud_composite";
    };
    readonly TICKET_UPDATE: {
        readonly lifecycle: "active";
        readonly kind: "crud_composite";
    };
    readonly IMPERSONATE_START: {
        readonly lifecycle: "active";
        readonly kind: "crud_composite";
    };
    readonly IMPERSONATE_STOP: {
        readonly lifecycle: "active";
        readonly kind: "crud_composite";
    };
    readonly ACTIVATE: {
        readonly lifecycle: "active";
        readonly kind: "crud_composite";
    };
    readonly converted: {
        readonly lifecycle: "active";
        readonly kind: "crud_composite";
        readonly description: "Guest-MLO → agent conversion (guest-mlos convert route).";
    };
    readonly reactivated: {
        readonly lifecycle: "active";
        readonly kind: "crud_composite";
        readonly description: "Guest-MLO reactivation (guest-mlo reactivate route — FO-1 SUSPENDED→ACTIVE).";
    };
    readonly UPDATE_ENTITLEMENT: {
        readonly lifecycle: "active";
        readonly kind: "crud_composite";
        readonly description: "TenantEntitlement modify (admin entitlements route).";
    };
    readonly CONFIG_CHANGE: {
        readonly lifecycle: "active";
        readonly kind: "crud_composite";
    };
    readonly ACCOUNT_DELETE_REQUEST: {
        readonly lifecycle: "active";
        readonly kind: "domain_event";
    };
    readonly ACCOUNT_DELETE_CANCELLED: {
        readonly lifecycle: "active";
        readonly kind: "domain_event";
    };
    readonly SESSION_REVOKE_OTHERS: {
        readonly lifecycle: "active";
        readonly kind: "domain_event";
    };
    readonly ACCOUNT_DATA_EXPORT_REQUESTED: {
        readonly lifecycle: "active";
        readonly kind: "domain_event";
    };
    readonly ACCOUNT_DATA_EXPORT_READY: {
        readonly lifecycle: "active";
        readonly kind: "domain_event";
    };
    readonly TENANT_PROVISIONED: {
        readonly lifecycle: "active";
        readonly kind: "domain_event";
    };
    readonly cross_app_tenant_provisioned: {
        readonly lifecycle: "active";
        readonly kind: "domain_event";
    };
    readonly "TenantApp.CREATE": {
        readonly lifecycle: "active";
        readonly kind: "domain_event";
    };
    readonly "TenantEntitlement.CREATE": {
        readonly lifecycle: "active";
        readonly kind: "domain_event";
    };
    readonly lead_tag_added: {
        readonly lifecycle: "active";
        readonly kind: "domain_event";
    };
    readonly lead_tag_removed: {
        readonly lifecycle: "active";
        readonly kind: "domain_event";
    };
    readonly lead_created: {
        readonly lifecycle: "active";
        readonly kind: "domain_event";
    };
    readonly lead_stage_changed: {
        readonly lifecycle: "active";
        readonly kind: "domain_event";
    };
    readonly lead_deleted: {
        readonly lifecycle: "active";
        readonly kind: "domain_event";
    };
    readonly lead_updated: {
        readonly lifecycle: "active";
        readonly kind: "domain_event";
    };
    readonly lead_forked: {
        readonly lifecycle: "active";
        readonly kind: "domain_event";
    };
    readonly lead_moved: {
        readonly lifecycle: "active";
        readonly kind: "domain_event";
    };
    readonly HUB_LINK_ISSUED: {
        readonly lifecycle: "active";
        readonly kind: "domain_event";
    };
    readonly HUB_LINK_RESENT: {
        readonly lifecycle: "active";
        readonly kind: "domain_event";
    };
    readonly HUB_PREVIEW_ISSUED: {
        readonly lifecycle: "active";
        readonly kind: "domain_event";
    };
    readonly HUB_INVITE_NOOP: {
        readonly lifecycle: "active";
        readonly kind: "domain_event";
    };
    readonly LEAD_CLAIMED_VIA_HUB_LINK: {
        readonly lifecycle: "active";
        readonly kind: "domain_event";
    };
    readonly bulk_tag_add: {
        readonly lifecycle: "active";
        readonly kind: "domain_event";
    };
    readonly webhook_endpoint_events_updated: {
        readonly lifecycle: "active";
        readonly kind: "domain_event";
    };
    readonly agent_today_card_created: {
        readonly lifecycle: "active";
        readonly kind: "domain_event";
        readonly description: "AgentTodayCard creation (PFP cockpit re-engagement signal emitters: hecm-eligibility / dscr-reengagement / bankstatement-reengagement).";
    };
    readonly hh_nonqm_type_classified: {
        readonly lifecycle: "active";
        readonly kind: "domain_event";
        readonly description: "Harvest-Home non-QM product classification on the INVESTOR branch (DSCR vs BANK_STATEMENT) at intake — HH-DSCR-AWARE-INTAKE-AND-SCORING. SYSTEM-actored, written Pattern A via src/lib/admin/audit.ts.";
    };
    readonly invite_resent: {
        readonly lifecycle: "active";
        readonly kind: "domain_event";
        readonly description: "Guest-MLO invite re-send (resend-invite / reinvite routes).";
    };
    readonly GUEST_MLO_DISCLOSURE_ACCEPTED: {
        readonly lifecycle: "active";
        readonly kind: "domain_event";
        readonly description: "Guest-MLO RESPA/GLBA disclosure acceptance (accept-disclosure route).";
    };
    readonly GUEST_MLO_DATA_RETENTION_EXPIRED: {
        readonly lifecycle: "active";
        readonly kind: "domain_event";
        readonly description: "Guest-MLO data-retention expiry sweep (guest-mlo-retention-sweep job).";
    };
    readonly "rello.meeting_booked": {
        readonly lifecycle: "active";
        readonly kind: "domain_event";
    };
    readonly "rello.meeting_completed": {
        readonly lifecycle: "active";
        readonly kind: "domain_event";
    };
    readonly "rello.meeting_canceled": {
        readonly lifecycle: "active";
        readonly kind: "domain_event";
    };
    readonly "rello.meeting_no_show": {
        readonly lifecycle: "active";
        readonly kind: "domain_event";
    };
    readonly "rello.meeting_rescheduled": {
        readonly lifecycle: "active";
        readonly kind: "domain_event";
    };
    readonly "rello.meeting_reminder_dispatched": {
        readonly lifecycle: "active";
        readonly kind: "domain_event";
    };
    readonly "rello.meeting_reminder_suppressed": {
        readonly lifecycle: "active";
        readonly kind: "domain_event";
    };
    readonly "rello.video_link_attached": {
        readonly lifecycle: "active";
        readonly kind: "domain_event";
    };
    readonly "rello.video_link_failed": {
        readonly lifecycle: "active";
        readonly kind: "domain_event";
    };
    readonly "rello.video_provider_connected": {
        readonly lifecycle: "active";
        readonly kind: "domain_event";
    };
    readonly "rello.video_provider_disconnected": {
        readonly lifecycle: "active";
        readonly kind: "domain_event";
    };
    readonly "rello.booking_link_created": {
        readonly lifecycle: "active";
        readonly kind: "domain_event";
    };
    readonly "rello.booking_link_updated": {
        readonly lifecycle: "active";
        readonly kind: "domain_event";
    };
    readonly "rello.booking_link_disabled": {
        readonly lifecycle: "active";
        readonly kind: "domain_event";
    };
    readonly "rello.team_pool_created": {
        readonly lifecycle: "active";
        readonly kind: "domain_event";
    };
    readonly "rello.team_pool_updated": {
        readonly lifecycle: "active";
        readonly kind: "domain_event";
    };
    readonly "rello.team_pool_disabled": {
        readonly lifecycle: "active";
        readonly kind: "domain_event";
    };
    readonly "rello.team_pool_member_added": {
        readonly lifecycle: "active";
        readonly kind: "domain_event";
    };
    readonly "rello.team_pool_member_updated": {
        readonly lifecycle: "active";
        readonly kind: "domain_event";
    };
    readonly "rello.team_pool_member_removed": {
        readonly lifecycle: "active";
        readonly kind: "domain_event";
    };
    readonly "rello.agent_availability_created": {
        readonly lifecycle: "active";
        readonly kind: "domain_event";
    };
    readonly "rello.agent_availability_updated": {
        readonly lifecycle: "active";
        readonly kind: "domain_event";
    };
    readonly "rello.agent_availability_disabled": {
        readonly lifecycle: "active";
        readonly kind: "domain_event";
    };
    readonly synthetic_login: {
        readonly lifecycle: "active";
        readonly kind: "domain_event";
        readonly description: "A synthetic test session (ml_token) was minted via POST /api/v1/auth/synthetic-session for a designated isSyntheticTestUser (Big Star test tenant). Logged on every issuance — synthetic logins are the most-audited login class. SPEC-260610.";
    };
    readonly synthetic_flag_set: {
        readonly lifecycle: "active";
        readonly kind: "domain_event";
        readonly description: "A User was flagged isSyntheticTestUser=true via the guarded PLATFORM_ADMIN setter (false→true only, tenant + role-ceiling gated). SPEC-260610.";
    };
    readonly boot_preflight_env_mirror_check: {
        readonly lifecycle: "active";
        readonly kind: "domain_event";
        readonly tier: "telemetry";
        readonly description: "env-mirror preflight check, v1 spelling — superseded by _v2, retained for the 4,118 historical PROD rows (OQ-3: relocation pending)";
    };
    readonly boot_preflight_env_mirror_check_v2: {
        readonly lifecycle: "active";
        readonly kind: "domain_event";
        readonly tier: "telemetry";
        readonly description: "env-mirror preflight check (OQ-3: relocation pending)";
    };
    readonly boot_preflight_env_mirror_divergence_detected: {
        readonly lifecycle: "active";
        readonly kind: "domain_event";
        readonly tier: "telemetry";
        readonly description: "env-mirror divergence comparator (OQ-3: relocation pending)";
    };
};
/** `as const` union of every EXACT registry key. */
export type CanonicalAuditAction = keyof typeof EXACT_REGISTRY_DATA;
/**
 * The canonical EXACT action vocabulary, typed as a uniform `Record` so callers
 * can read `.tier` / `.kind` on any entry. The underlying object is the
 * literal-narrow `as const` data above (its keys define `CanonicalAuditAction`).
 */
export declare const EXACT_REGISTRY: Record<CanonicalAuditAction, AuditActionEntry>;
/**
 * Dotted DOMAIN-action families. Each prefix is a grep-verified `AuditLog.action`
 * value written via `logAudit` in Rello — NOT a signals `<slug>.audit.`
 * signal-type family.
 */
export declare const FAMILY_REGISTRY: readonly AuditActionFamily[];
/** Full canonical action set (includes telemetry-tier keys — they ARE known
 *  canonical rows, just not dropdown verbs). Use for drift detection. */
export declare const CANONICAL_AUDIT_ACTION_SET: ReadonlySet<string>;
/** True iff `raw` is an exact canonical action (any tier). */
export declare function isCanonicalAuditAction(raw: string): raw is CanonicalAuditAction;
/** The dotted DOMAIN-action family `raw` belongs to, or `null`. */
export declare function matchesAuditActionFamily(raw: string): AuditActionFamily | null;
/**
 * SOT primitive — the admin action-dropdown denominator. Returns every
 * non-telemetry canonical action in registry (= dropdown) order. Replaces the
 * hand-maintained `ACTION_VALUES` / `EVENT_ACTION_VALUES` arrays.
 */
export declare function listActiveAuditActions(): readonly CanonicalAuditAction[];
/**
 * Generic CRUD case + tense fold → canonical lowercase verb (all members of
 * the CRUD/composite registry tier). `activated` folds to the canonical
 * uppercase composite `ACTIVATE`. Only these keys fold; everything else passes
 * through verbatim. (Ported from `crud-case-normalization.ts`.)
 */
export declare const CRUD_CASE_MAP: Record<string, string>;
/**
 * 28 prod ApiKey `action` literals → 4 canonical buckets (`create`/`grant`/
 * `update`/`revoke`). Scoped to `entityType=api_key` only — `DELETE` buckets to
 * `revoke` here (soft-revoke semantics), which MUST NOT apply platform-wide.
 * (Ported from `apikey-action-normalization.ts`.)
 */
export declare const CANONICAL_APIKEY_ACTION_MAP: Record<string, string>;
export type CanonicalApiKeyAction = (typeof CANONICAL_APIKEY_ACTION_MAP)[keyof typeof CANONICAL_APIKEY_ACTION_MAP];
/**
 * Inverse of `CRUD_CASE_MAP`: canonical verb → all case/tense variants (incl.
 * the canonical itself). `buildAuditWhere` expands a canonical filter value →
 * all stored variants. Derived identically to Rello's local copy (same forward
 * map, same insertion order) so the expanded array is byte-identical.
 */
export declare const CRUD_CASE_VARIANTS: Record<string, string[]>;
/**
 * Inverse of `CANONICAL_APIKEY_ACTION_MAP`: canonical bucket → all raw variants
 * (incl. the canonical key itself). Used by `buildAuditWhere` only when
 * `entityType=api_key`. Byte-identical to Rello's local derivation.
 */
export declare const APIKEY_ACTION_BUCKET_VARIANTS: Record<string, string[]>;
/**
 * Generic CRUD case/tense fold (legacy parity with `normalizeCrudAction` in
 * `crud-case-normalization.ts`). Folds ONLY `CRUD_CASE_MAP` keys; everything
 * else passes through verbatim (NEVER lowercased — preserves forensic signal).
 * Empty/nullish → `""`.
 */
export declare function normalizeCrudAction(raw: string | null | undefined): string;
/**
 * ApiKey 28→4 bucket fold (legacy parity with `normalizeApiKeyAuditAction` in
 * `apikey-action-normalization.ts`). Unknown values fall back to
 * `raw.toLowerCase().trim()` — this lowercasing miss-fallback is retained for
 * byte-identical parity with the shipped per-ApiKey audit-trail display surface
 * (DELIBERATELY different from the verbatim pass-through of the generic fold).
 * Empty/nullish → `""`.
 */
export declare function normalizeApiKeyAuditAction(raw: string | null | undefined): string;
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
export declare function normalizeAuditAction(raw: string | null | undefined, entityType?: string): string;
export {};
//# sourceMappingURL=index.d.ts.map