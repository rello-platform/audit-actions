# @rello-platform/audit-actions

Canonical **`AuditLog.action`-column vocabulary** for the Rello ecosystem — the
single source of truth (SOT) for the **terminal verb** written to the audit
`action` column.

## What this package governs (and what it does NOT)

There are **two distinct identifier layers** in the audit pipeline:

| Layer | Example | Owner |
| --- | --- | --- |
| Wire **signal-TYPE** | `the-drumbeat.audit.lead.updated` | `@rello-platform/signals` (`AUDIT_FAMILIES` + `content-engine.audit.`) |
| **`AuditLog.action`** terminal verb | `update`, `IMPERSONATE_START`, `closing.key_date.created` | **this package** |

A spoke emitter sets `signalType` **and** `action` separately; Rello's
`handleAuditSignal` then writes `logAudit({ action: payload.action })` — the
terminal verb, **not** the signalType. So this package declares its **own**
dotted DOMAIN-action families (e.g. `closing.key_date.`) and **must never
re-declare the signals `<slug>.audit.` signal-type families** — that would
create a parallel registry.

## Grammar

Per `~/.claude/standards/audit-logging.md` (ratified): canonical lowercase
verbs (`create`/`update`/`delete`/`grant`/`revoke`) **+** uppercase composite
literals (`ACTIVATE`/`CONFIG_CHANGE`/`TENANT_STATUS_CHANGE`/`IMPERSONATE_*`) for
non-CRUD events, **+** accepted verbatim domain-event vocabulary. The registry
keys on this ratified grammar — not on a strict `^[a-z]+$` shape.

## Provenance

The `EXACT_REGISTRY` promotes Rello's read-side action union shipped in
`src/lib/admin/audit-filters.ts`:

- `ACTION_VALUES` (22) → `kind: "crud_composite"`
- `EVENT_ACTION_VALUES` (44 = 9 security/tenant + 12 core-CRM + 23 meeting)
  → `kind: "domain_event"`
- **= 66 admin-dropdown entries**, promoted verbatim (behavior-neutral).

`boot_preflight_*` env-mirror rows are registered as `tier: "telemetry"` — known
canonical rows that are **excluded from the dropdown** and pending a Kelly-gated
relocation off `AuditLog` (OQ-3).

## API

```ts
import {
  EXACT_REGISTRY,             // Record<CanonicalAuditAction, AuditActionEntry>
  FAMILY_REGISTRY,            // readonly AuditActionFamily[] (dotted domain-action prefixes)
  CANONICAL_AUDIT_ACTION_SET, // ReadonlySet<string> (all keys, incl. telemetry)
  isCanonicalAuditAction,     // (raw) => raw is CanonicalAuditAction
  matchesAuditActionFamily,   // (raw) => AuditActionFamily | null
  listActiveAuditActions,     // () => readonly CanonicalAuditAction[]  ← dropdown denominator
  type CanonicalAuditAction,
  type AuditActionEntry,
  type AuditActionFamily,
  type AuditActionKind,
} from "@rello-platform/audit-actions";
```

`listActiveAuditActions()` is the SOT primitive: it returns every non-telemetry
canonical action in registry (dropdown) order, replacing the hand-maintained
`ACTION_VALUES` / `EVENT_ACTION_VALUES` arrays.

## Scope (KEYSPACE-SEED step)

This is the **registry seed only**. It does **not** ship a normalizer
(`normalizeAuditAction` — step B) or a build-guard (`check:audit-actions` —
steps C/D). Those are later steps in the Platform Identifier Drift-Guards
workstream.

## Build / test / publish

```bash
npm run build      # tsc → dist (committed)
npm test           # node --test (compiles to .test-build, then runs)
```

Standalone, zero runtime dependencies. Committed `dist`, **no `prepare`/
`postinstall`** (a `prepare` hook would force git+ssh clone-build on every
consumer install and break Railway nixpacks). Published via **git tag**
(`v0.1.0`), not GitHub Releases. Consumers pin `github:rello-platform/audit-actions#v0.1.0`.
