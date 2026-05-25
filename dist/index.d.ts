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
 * primitive only. No normalizer (step B) and no build-guard (steps C/D) here.
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
    readonly HUB_LINK_ISSUED: {
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
export {};
//# sourceMappingURL=index.d.ts.map