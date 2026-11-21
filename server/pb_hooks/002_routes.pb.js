console.log("DAYZERO_ROUTES_LOADED 002");
// DayZero — server-side routes for the operations that a collection API rule
// cannot express safely (invitation redemption, rosters, moderation, deletion).

// ---------------------------------------------------------------------------
// POST /api/dayzero/community/join   body: { code, pseudonym }
//
// Canonical invitation redemption (docs/SECURITY.md). /api/dayzero/invite/redeem
// is registered as an alias of the very same handler so no client diverges.
// Failures answer with an explicit { code, message } body so clients can react
// to the reason instead of parsing prose.
// ---------------------------------------------------------------------------
function redeemInvitation(e) {
    function sanitize(val) {
        return String(val).replace(/[^A-Za-z0-9_-]/g, "");
    }
    function audit(actorId, action, targetType, targetId, groupId, meta) {
        try {
            const col = $app.findCollectionByNameOrId("audit_log");
            const rec = new Record(col);
            rec.set("actor", actorId);
            rec.set("action", action);
            rec.set("targetType", targetType);
            rec.set("targetId", targetId);
            if (groupId) rec.set("group", groupId);
            rec.set("meta", meta || {});
            $app.save(rec);
        } catch (err) {
            console.log("audit failed: " + action + " -> " + (err && err.message));
        }
    }

    const body = e.requestInfo().body || {};
    const code = String(body.code || "").trim();
    const pseudonym = String(body.pseudonym || "").trim();

    if (code.length < 16) {
        return e.json(400, { code: "invalid_code", message: "invalid invitation code" });
    }
    if (pseudonym.length < 2 || pseudonym.length > 32) {
        return e.json(400, { code: "invalid_pseudonym", message: "pseudonym must be 2-32 characters" });
    }

    let invite = null;
    try {
        invite = $app.findFirstRecordByFilter("invitations", `code = "${sanitize(code)}"`);
    } catch (err) {}
    if (!invite) {
        return e.json(404, { code: "not_found", message: "invitation not found" });
    }
    if (invite.getString("revokedAt")) {
        return e.json(400, { code: "revoked", message: "invitation has been revoked" });
    }
    // PocketBase stores date fields as "YYYY-MM-DD HH:MM:SS.sssZ" (space, not T),
    // so a raw string comparison against a JS ISO string would mark every invite
    // as expired. Normalise both sides to timestamps before comparing.
    function expiredAt(value) {
        if (!value) return false;
        const parsed = Date.parse(String(value).replace(" ", "T"));
        if (Number.isNaN(parsed)) return true; // unparsable = treat as expired
        return parsed < Date.now();
    }
    if (expiredAt(invite.getString("expiresAt"))) {
        return e.json(400, { code: "expired", message: "invitation has expired" });
    }
    if (Number(invite.get("usedCount") || 0) >= Number(invite.get("maxUses") || 1)) {
        return e.json(400, { code: "fully_used", message: "invitation has already been used" });
    }

    const groupId = invite.getString("group");
    const userId = e.auth.id;

    let existing = null;
    try {
        existing = $app.findFirstRecordByFilter(
            "memberships",
            `user = "${userId}" && group = "${groupId}"`
        );
    } catch (err) {}
    if (existing && existing.getString("status") !== "removed") {
        return e.json(409, { code: "already_member", message: "already a member of this group" });
    }

    const now = new Date().toISOString();
    const col = $app.findCollectionByNameOrId("memberships");
    let membership;
    if (existing) {
        membership = existing;
        membership.set("status", "active");
        membership.set("pseudonym", pseudonym);
        membership.set("joinedAt", now);
    } else {
        membership = new Record(col);
        membership.set("group", groupId);
        membership.set("user", userId);
        membership.set("pseudonym", pseudonym);
        membership.set("role", "member");
        membership.set("status", "active");
        membership.set("joinedAt", now);
        membership.set("addedBy", invite.getString("createdBy"));
    }
    $app.save(membership);

    invite.set("usedCount", Number(invite.get("usedCount") || 0) + 1);
    $app.save(invite);

    audit(e.auth.id, "invitation.redeem", "membership", membership.id, groupId, { code: "" });

    return e.json(200, {
        code: "joined",
        membershipId: membership.id,
        group: groupId,
        pseudonym: pseudonym,
    });
}

routerAdd("POST", "/api/dayzero/community/join", redeemInvitation, $apis.requireAuth());
routerAdd("POST", "/api/dayzero/invite/redeem", redeemInvitation, $apis.requireAuth());

// ---------------------------------------------------------------------------
// GET /api/dayzero/groups/{id}/members — roster of active members
// ---------------------------------------------------------------------------
routerAdd("GET", "/api/dayzero/groups/{id}/members", (e) => {
    function sanitize(val) {
        return String(val).replace(/[^A-Za-z0-9_-]/g, "");
    }
    function assertActiveMember(userId, groupId) {
        let m = null;
        try {
            m = $app.findFirstRecordByFilter(
                "memberships",
                `user = "${sanitize(userId)}" && group = "${sanitize(groupId)}" && status = "active"`
            );
        } catch (err) {}
        if (!m) {
            throw new NotFoundError("group not found");
        }
        return m;
    }

    const groupId = e.request.pathValue("id");
    assertActiveMember(e.auth.id, groupId);

    const rows = $app.findRecordsByFilter(
        "memberships",
        `group = "${sanitize(groupId)}" && status = "active"`,
        "-joinedAt",
        100,
        0
    );

    return e.json(200, rows.map((r) => ({
        membershipId: r.id,
        pseudonym: r.getString("pseudonym"),
        role: r.getString("role"),
        joinedAt: r.getString("joinedAt"),
    })));
}, $apis.requireAuth());

// ---------------------------------------------------------------------------
// POST /api/dayzero/moderation/posts/{id}  body: { action: hide|restore|delete, reason }
// ---------------------------------------------------------------------------
routerAdd("POST", "/api/dayzero/moderation/posts/{id}", (e) => {
    function sanitize(val) {
        return String(val).replace(/[^A-Za-z0-9_-]/g, "");
    }
    function isMod(userId, groupId) {
        try {
            const m = $app.findFirstRecordByFilter(
                "memberships",
                `user = "${sanitize(userId)}" && group = "${sanitize(groupId)}" && status = "active" && role = "moderator"`
            );
            return !!m;
        } catch (err) {
            return false;
        }
    }
    function audit(actorId, action, targetType, targetId, groupId, meta) {
        try {
            const col = $app.findCollectionByNameOrId("audit_log");
            const rec = new Record(col);
            rec.set("actor", actorId);
            rec.set("action", action);
            rec.set("targetType", targetType);
            rec.set("targetId", targetId);
            if (groupId) rec.set("group", groupId);
            rec.set("meta", meta || {});
            $app.save(rec);
        } catch (err) {
            console.log("audit failed: " + action + " -> " + (err && err.message));
        }
    }

    const postId = e.request.pathValue("id");
    const body = e.requestInfo().body || {};
    const action = String(body.action || "");
    const reason = String(body.reason || "").slice(0, 300);

    let post = null;
    try {
        post = $app.findRecordById("posts", postId);
    } catch (err) {
        throw new NotFoundError("post not found");
    }
    const groupId = post.getString("group");

    if (!isMod(e.auth.id, groupId)) {
        throw new ForbiddenError("moderator role required for this group");
    }

    if (action === "hide" || action === "restore") {
        post.set("status", action === "hide" ? "hidden" : "visible");
        post.set("hiddenReason", action === "hide" ? reason : "");
        $app.save(post);
    } else if (action === "delete") {
        $app.delete(post);
    } else {
        throw new BadRequestError("unknown action", {}, "action");
    }

    audit(e.auth.id, "moderation.post." + action, "post", postId, groupId, { reason: reason });
    return e.json(200, { success: true, action: action });
}, $apis.requireAuth());

// ---------------------------------------------------------------------------
// POST /api/dayzero/moderation/members/{id}  body: { action: mute|restore|ban|unban }
// ---------------------------------------------------------------------------
routerAdd("POST", "/api/dayzero/moderation/members/{id}", (e) => {
    function sanitize(val) {
        return String(val).replace(/[^A-Za-z0-9_-]/g, "");
    }
    function isMod(userId, groupId) {
        try {
            const m = $app.findFirstRecordByFilter(
                "memberships",
                `user = "${sanitize(userId)}" && group = "${sanitize(groupId)}" && status = "active" && role = "moderator"`
            );
            return !!m;
        } catch (err) {
            return false;
        }
    }
    function audit(actorId, action, targetType, targetId, groupId, meta) {
        try {
            const col = $app.findCollectionByNameOrId("audit_log");
            const rec = new Record(col);
            rec.set("actor", actorId);
            rec.set("action", action);
            rec.set("targetType", targetType);
            rec.set("targetId", targetId);
            if (groupId) rec.set("group", groupId);
            rec.set("meta", meta || {});
            $app.save(rec);
        } catch (err) {
            console.log("audit failed: " + action + " -> " + (err && err.message));
        }
    }

    const membershipId = e.request.pathValue("id");
    const body = e.requestInfo().body || {};
    const action = String(body.action || "");

    let membership = null;
    try {
        membership = $app.findRecordById("memberships", membershipId);
    } catch (err) {
        throw new NotFoundError("membership not found");
    }
    const groupId = membership.getString("group");

    if (!isMod(e.auth.id, groupId)) {
        throw new ForbiddenError("moderator role required for this group");
    }
    if (membership.getString("user") === e.auth.id) {
        throw new BadRequestError("a moderator cannot moderate their own membership");
    }

    const map = { mute: "removed", restore: "active", ban: "banned", unban: "active" };
    if (!map[action]) {
        throw new BadRequestError("unknown action", {}, "action");
    }
    membership.set("status", map[action]);
    $app.save(membership);

    audit(e.auth.id, "moderation.member." + action, "membership", membershipId, groupId, {});
    return e.json(200, { success: true, status: map[action] });
}, $apis.requireAuth());

// ---------------------------------------------------------------------------
// POST /api/dayzero/account/delete   body: { password, confirm? }
// ---------------------------------------------------------------------------
routerAdd("POST", "/api/dayzero/account/delete", (e) => {
    function sanitize(val) {
        return String(val).replace(/[^A-Za-z0-9_-]/g, "");
    }

    const body = e.requestInfo().body || {};
    // Re-authentication with the account password is the security control
    // (docs/SECURITY.md ST-SEC-07). A client may additionally send the literal
    // "DELETE" confirmation, and if it does it must match, but it is not
    // required: the Android client and the web proxy only send the password.
    if (body.confirm !== undefined && body.confirm !== "DELETE") {
        throw new BadRequestError('type "DELETE" to confirm account deletion', {}, "confirm");
    }
    const password = String(body.password || "");
    if (!password) {
        throw new BadRequestError("password required", {}, "password");
    }

    if (!e.auth.validatePassword(password)) {
        throw new UnauthorizedError("invalid credentials");
    }

    const userId = e.auth.id;
    try {
        // Cascade delete all dependent private records
        const deleteRecords = (collection, filter) => {
            try {
                const recs = $app.findRecordsByFilter(collection, filter, "", 200, 0);
                for (const r of recs) {
                    try { $app.delete(r); } catch (delErr) {}
                }
            } catch (queryErr) {}
        };

        deleteRecords("checkins", `user = "${sanitize(userId)}"`);
        deleteRecords("goals", `user = "${sanitize(userId)}"`);
        deleteRecords("memberships", `user = "${sanitize(userId)}"`);
        deleteRecords("posts", `author = "${sanitize(userId)}"`);
        // Required relations back to the account (invitations.createdBy and
        // reports.reporter) block the account delete otherwise, so remove them
        // explicitly. Neither may outlive the account that produced them.
        deleteRecords("invitations", `createdBy = "${sanitize(userId)}"`);
        deleteRecords("reports", `reporter = "${sanitize(userId)}"`);
        deleteRecords("blocks", `blocker = "${sanitize(userId)}" || blocked = "${sanitize(userId)}"`);

        const user = $app.findRecordById("accounts", userId);
        $app.delete(user);
    } catch (err) {
        console.log("ACCOUNT DELETE ERROR: " + err + " (stack: " + (err && err.stack) + ")");
        throw err;
    }

    return e.json(200, { code: "deleted", success: true, deleted: userId });
}, $apis.requireAuth());
