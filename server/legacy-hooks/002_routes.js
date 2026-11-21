// DayZero — server-side route hardening (supplementary to the migration rules).
//
// The collection migration already encodes most authorization as API rules.
// This file exists only to close gaps where API-rule syntax is awkward or
// where we want an explicit server-side assertion even if a rule is later
// relaxed.
//
// Keep this file additive and explicit.  If a rule here duplicates a rule in
// the migration, prefer the migration and delete this one.

// Roles are never client-settable.
$app.recordBeforeCreate("/collections/posts", (record, context) => {
    const body = context && context.request && context.request.body;
    if (body && body.role !== undefined) {
        throw new Error("post_role_readonly");
    }
    return record;
});

$app.recordBeforeUpdate("/collections/posts", (record, context) => {
    const body = context && context.request && context.request.body;
    if (body && body.role !== undefined) {
        throw new Error("post_role_readonly");
    }
    return record;
});

$app.recordBeforeCreate("/collections/reports", (record, context) => {
    const body = context && context.request && context.request.body;
    if (body && body.role !== undefined) {
        throw new Error("report_role_readonly");
    }
    return record;
});

$app.recordBeforeUpdate("/collections/reports", (record, context) => {
    const body = context && context.request && context.request.body;
    if (body && body.role !== undefined) {
        throw new Error("report_role_readonly");
    }
    return record;
});

// Invitation usage/identity fields are server-managed.
$app.recordBeforeCreate("/collections/invitations", (record, context) => {
    const body = context && context.request && context.request.body;
    if (body && (body.usedCount !== undefined || body.revokedAt !== undefined)) {
        throw new Error("invitation_usage_readonly");
    }
    return record;
});

$app.recordBeforeUpdate("/collections/invitations", (record, context) => {
    const body = context && context.request && context.request.body;
    if (body && (body.usedCount !== undefined || body.revokedAt !== undefined)) {
        throw new Error("invitation_usage_readonly");
    }
    return record;
});

// Membership role/status is server-managed.
$app.recordBeforeCreate("/collections/memberships", (record, context) => {
    const body = context && context.request && context.request.body;
    if (body && (body.role !== undefined || body.status !== undefined)) {
        throw new Error("membership_role_status_readonly");
    }
    return record;
});

$app.recordBeforeUpdate("/collections/memberships", (record, context) => {
    const body = context && context.request && context.request.body;
    if (body && (body.role !== undefined || body.status !== undefined)) {
        throw new Error("membership_role_status_readonly");
    }
    return record;
});

// audit_log is write-only from the client.
$app.recordBeforeCreate("/collections/audit_log", () => {
    throw new Error("audit_log_write_only");
});
