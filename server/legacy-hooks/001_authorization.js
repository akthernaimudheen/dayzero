// DayZero — server-side authorization hooks.
//
// Security boundary: when a record belongs to a group (posts, reports,
// invitations), the group and/or membership must match the authenticated
// account.  Those fields are never settable by the client; the create hook
// forces them from verified server state so that a stale API rule alone is
// not the only authorization control.
//
// PocketBase hook runtime notes (v0.40.6):
//   * top-level helpers are $app, $request, $logger, $account
//   * collection hooks receive (record, context) where context has auth and
//     request
//   * route handlers receive (req, res) where req has auth and body/json()
//   * PocketBase sets req.auth on authenticated route calls; when present it
//     includes id and token
//   * we never trust client-supplied role/status/ownership fields; we resolve
//     them from server state instead

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function audit(action, meta) {
    try {
        const auditLog = $app.findCollectionByNameOrId("audit_log");
        const actorId = ($request && $request.auth && $request.auth.id) || "";
        auditLog.create({
            actor: actorId ? actorId : null,
            action: action,
            targetType: meta && meta.targetType ? meta.targetType : null,
            targetId: meta && meta.targetId ? meta.targetId : null,
            meta: meta && Object.keys(meta).length ? meta : null,
        });
    } catch (e) {
        $logger.warn("DayZero audit write failed: " + e);
    }
}

function readRecordOrFail(collection, recordId) {
    const rec = collection.findOne(recordId);
    if (!rec) {
        throw new Error("not_found");
    }
    return rec;
}

// ---------------------------------------------------------------------------
// Accounts — registration shape + role/status immutability
// ---------------------------------------------------------------------------

$app.recordBeforeCreate("/collections/accounts", (record, context) => {
    const body = context && context.request && context.request.body;
    if (!body) {
        return record;
    }
    if (body.language !== "en" && body.language !== "ml" && body.language !== "ml-Latn") {
        throw new Error("language_unsupported");
    }
    // Role and status are never client-assignable.
    record.role = "member";
    record.status = "active";
    record.onboardedAt = new Date().toISOString();
    return record;
});

$app.recordBeforeUpdate("/collections/accounts", (record, context) => {
    const auth = context && context.auth;
    if (!auth || !auth.id) {
        throw new Error("unauthorized");
    }
    const body = context && context.request && context.request.body;
    if (body && (body.role !== undefined || body.status !== undefined)) {
        throw new Error("role_status_readonly");
    }
    return record;
});

// ---------------------------------------------------------------------------
// Groups — server-only creation (controlled pilot)
// ---------------------------------------------------------------------------

$app.recordBeforeCreate("/collections/groups", (record, context) => {
    const body = context && context.request && context.request.body;
    if (!body) {
        throw new Error("invalid_request");
    }
    throw new Error("group_creation_reserved");
});

// ---------------------------------------------------------------------------
// Memberships — role/status immutability
// ---------------------------------------------------------------------------

$app.recordBeforeCreate("/collections/memberships", (record, context) => {
    const body = context && context.request && context.request.body;
    if (!body) {
        throw new Error("invalid_request");
    }
    if (body.role !== undefined) {
        throw new Error("membership_role_readonly");
    }
    record.role = "member";
    record.status = "active";
    return record;
});

$app.recordBeforeUpdate("/collections/memberships", (record, context) => {
    const auth = context && context.auth;
    if (!auth || !auth.id) {
        throw new Error("unauthorized");
    }
    const body = context && context.request && context.request.body;
    if (body && (body.role !== undefined || body.status !== undefined)) {
        throw new Error("membership_role_status_readonly");
    }
    return record;
});

// ---------------------------------------------------------------------------
// Invitations — usage/identity immutability (creation still needs createdBy)
// ---------------------------------------------------------------------------

$app.recordBeforeCreate("/collections/invitations", (record, context) => {
    const body = context && context.request && context.request.body;
    if (!body) {
        throw new Error("invalid_request");
    }
    record.usedCount = record.usedCount || 0;
    return record;
});

$app.recordBeforeUpdate("/collections/invitations", (record, context) => {
    const body = context && context.request && context.request.body;
    if (body && (body.code !== undefined || body.group !== undefined || body.usedCount !== undefined || body.revokedAt !== undefined)) {
        throw new Error("invitation_identity_usage_readonly");
    }
    return record;
});

// ---------------------------------------------------------------------------
// Posts — author + group come from server state, not the client
// ---------------------------------------------------------------------------

$app.recordBeforeCreate("/collections/posts", (record, context) => {
    const auth = context && context.auth;
    if (!auth || !auth.id) {
        throw new Error("unauthorized");
    }
    const body = context && context.request && context.request.body;
    if (!body) {
        throw new Error("invalid_request");
    }
    if (body.role !== undefined) {
        throw new Error("post_role_readonly");
    }

    // Body may mention the group id; the authoritative group comes from the
    // authenticated membership so a client cannot post into a group it does not
    // belong to.
    if (body.group) {
        const memberships = $app.findCollectionByNameOrId("memberships");
        const m = memberships.findFirst({
            filter: "(group = '" + body.group + "') && (user = '" + auth.id + "') && (status = 'active')",
        });
        if (!m) {
            throw new Error("not_group_member");
        }
        record.group = { id: m.group };
    } else {
        throw new Error("group_required");
    }
    record.author = { id: auth.id };
    record.status = "visible";
    return record;
});

$app.recordBeforeUpdate("/collections/posts", (record, context) => {
    const auth = context && context.auth;
    if (!auth || !auth.id) {
        throw new Error("unauthorized");
    }
    const body = context && context.request && context.request.body;
    if (body && (body.group !== undefined || body.author !== undefined || body.role !== undefined)) {
        throw new Error("post_identity_readonly");
    }
    return record;
});

// ---------------------------------------------------------------------------
// Reports — own-post guard + role immutability
// ---------------------------------------------------------------------------

$app.recordBeforeCreate("/collections/reports", (record, context) => {
    const auth = context && context.auth;
    if (!auth || !auth.id) {
        throw new Error("unauthorized");
    }
    const body = context && context.request && context.request.body;
    if (!body) {
        throw new Error("invalid_request");
    }
    if (body.role !== undefined) {
        throw new Error("report_role_readonly");
    }
    if (body.targetPost) {
        const posts = $app.findCollectionByNameOrId("posts");
        const post = readRecordOrFail(posts, body.targetPost);
        if (post.author && post.author.id === auth.id) {
            throw new Error("cannot_report_own_post");
        }
    }
    return record;
});

$app.recordBeforeUpdate("/collections/reports", (record, context) => {
    const auth = context && context.auth;
    if (!auth || !auth.id) {
        throw new Error("unauthorized");
    }
    const body = context && context.request && context.request.body;
    if (body && body.role !== undefined) {
        throw new Error("report_role_readonly");
    }
    return record;
});

// ---------------------------------------------------------------------------
// Server-side invitation redemption
// ---------------------------------------------------------------------------

$app.route("/api/dayzero/community/join", async (req, res) => {
    if (req.method !== "POST") {
        res.status(405).json({ code: "method_not_allowed" });
        return;
    }
    const auth = req.auth;
    if (!auth || !auth.id) {
        res.status(401).json({ code: "unauthorized" });
        return;
    }

    let body;
    try {
        body = await req.json();
    } catch (e) {
        res.status(400).json({ code: "invalid_body" });
        return;
    }
    if (!body || !body.code) {
        res.status(400).json({ code: "missing_code" });
        return;
    }

    const invitations = $app.findCollectionByNameOrId("invitations");
    const memberships = $app.findCollectionByNameOrId("memberships");

    const inv = invitations.findFirst({
        filter: "code = '" + body.code + "'",
    });
    if (!inv) {
        res.status(404).json({ code: "invalid_code" });
        return;
    }

    const nowIso = new Date().toISOString();
    if (inv.expiresAt && inv.expiresAt < nowIso) {
        res.status(410).json({ code: "expired" });
        return;
    }
    if (inv.revokedAt) {
        res.status(410).json({ code: "revoked" });
        return;
    }
    if (!inv.maxUses || inv.usedCount >= inv.maxUses) {
        res.status(410).json({ code: "fully_used" });
        return;
    }

    // Authorize the creator as an active moderator of the target group.
    const creatorMembership = memberships.findFirst({
        filter: "(group = '" + inv.group + "') && (user = '" + inv.createdBy + "') && (status = 'active')",
    });
    if (!creatorMembership || creatorMembership.role !== "moderator") {
        res.status(403).json({ code: "unauthorized_creator" });
        return;
    }

    // Single-use guard: do not let a member rejoin with a new code.
    const existing = memberships.findFirst({
        filter: "(group = '" + inv.group + "') && (user = '" + auth.id + "')",
    });
    if (existing) {
        res.status(409).json({ code: "already_member" });
        return;
    }

    // Atomic: increment usedCount, then create membership.
    let joined = false;
    try {
        $app.db.atomic(() => {
            const updated = invitations.update(inv.id, {
                usedCount: (inv.usedCount || 0) + 1,
            });
            if (!updated) {
                throw new Error("invitation_increment_failed");
            }
            memberships.create({
                group: { id: inv.group },
                user: { id: auth.id },
                pseudonym: body.pseudonym || "Member",
                role: "member",
                status: "active",
                joinedAt: new Date().toISOString(),
                addedBy: { id: inv.createdBy },
            });
            joined = true;
        });
    } catch (e) {
        if (e.message === "invitation_increment_failed") {
            res.status(409).json({ code: "race_cond_aside_incremented" });
            return;
        }
        $logger.error("DayZero join failed: " + e);
        res.status(500).json({ code: "internal_error" });
        return;
    }

    if (!joined) {
        res.status(500).json({ code: "internal_error" });
        return;
    }

    audit("membership_joined", {
        targetType: "group",
        targetId: inv.group,
        meta: { invitationCode: body.code, pseudonym: body.pseudonym || "Member" },
    });

    res.status(200).json({ code: "joined", group: inv.group });
});

// ---------------------------------------------------------------------------
// Account deletion — password-verified, best-effort dependent cleanup
// ---------------------------------------------------------------------------

$app.route("/api/dayzero/account/delete", async (req, res) => {
    if (req.method !== "POST") {
        res.status(405).json({ code: "method_not_allowed" });
        return;
    }
    const auth = req.auth;
    if (!auth || !auth.id) {
        res.status(401).json({ code: "unauthorized" });
        return;
    }

    let body;
    try {
        body = await req.json();
    } catch (e) {
        res.status(400).json({ code: "invalid_body" });
        return;
    }
    if (!body || !body.password) {
        res.status(400).json({ code: "missing_password" });
        return;
    }

    const accounts = $app.findCollectionByNameOrId("accounts");
    const record = accounts.findOne(auth.id);
    if (!record) {
        res.status(404).json({ code: "not_found" });
        return;
    }

    let passwordOk = false;
    try {
        passwordOk = await $account.verifyPassword(auth.id, body.password);
    } catch (e) {
        $logger.error("DayZero password verification error: " + e);
        res.status(500).json({ code: "internal_error" });
        return;
    }
    if (!passwordOk) {
        res.status(403).json({ code: "invalid_password" });
        audit("account_delete_denied", {
            targetType: "accounts",
            targetId: auth.id,
            meta: { reason: "invalid_password" },
        });
        return;
    }

    // Best-effort removal of the user's private dependent records.
    try {
        const checkins = $app.findCollectionByNameOrId("checkins");
        const goals = $app.findCollectionByNameOrId("goals");
        const memberships = $app.findCollectionByNameOrId("memberships");
        const posts = $app.findCollectionByNameOrId("posts");
        const blocks = $app.findCollectionByNameOrId("blocks");

        const userCheckins = checkins.find({ filter: "user = '" + auth.id + "'" });
        userCheckins.forEach((c) => checkins.delete(c.id));

        const userGoals = goals.find({ filter: "user = '" + auth.id + "'" });
        userGoals.forEach((g) => goals.delete(g.id));

        const userMemberships = memberships.find({ filter: "user = '" + auth.id + "'" });
        userMemberships.forEach((m) => memberships.delete(m.id));

        const userPosts = posts.find({ filter: "author = '" + auth.id + "'" });
        userPosts.forEach((p) => posts.delete(p.id));

        const userBlockerSide = blocks.find({ filter: "blocker = '" + auth.id + "'" });
        userBlockerSide.forEach((b) => blocks.delete(b.id));
        const userBlockedSide = blocks.find({ filter: "blocked = '" + auth.id + "'" });
        userBlockedSide.forEach((b) => blocks.delete(b.id));
    } catch (e) {
        $logger.error("DayZero account-deletion cleanup failed: " + e);
    }

    try {
        accounts.delete(auth.id);
        audit("account_deleted", {
            targetType: "accounts",
            targetId: auth.id,
        });
    } catch (e) {
        $logger.error("DayZero account deletion failed: " + e);
        res.status(500).json({ code: "deletion_failed" });
        return;
    }

    res.status(200).json({
        code: "deleted",
        message: "Your DayZero account and private data have been deleted.",
    });
});
