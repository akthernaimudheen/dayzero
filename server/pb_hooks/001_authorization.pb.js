console.log("DAYZERO_HOOKS_LOADED 001");
// DayZero — server-side authorization hooks (verified against pb_data/types.d.ts).

// ---------------------------------------------------------------------------
// accounts: hide email from all client API responses
// ---------------------------------------------------------------------------
onRecordEnrich((e) => {
    e.record.hide("email");
    return e.next();
}, "accounts");

// ---------------------------------------------------------------------------
// users: role, status and onboarding are server-assigned. A client may never
// promote itself to moderator/admin.
// ---------------------------------------------------------------------------
onRecordCreateRequest((e) => {
    e.record.set("role", "member");
    e.record.set("status", "active");
    e.record.set("onboardedAt", null);
    return e.next();
}, "accounts");

onRecordUpdateRequest((e) => {
    if (!e.hasSuperuserAuth()) {
        const original = $app.findRecordById("accounts", e.record.id);
        if (e.record.getString("role") !== original.getString("role")) {
            throw new BadRequestError("role is server-assigned", {}, "role");
        }
        if (e.record.getString("status") !== original.getString("status")) {
            throw new BadRequestError("status is server-assigned", {}, "status");
        }
    }
    return e.next();
}, "accounts");

// ---------------------------------------------------------------------------
// memberships: the client may edit its own pseudonym and nothing else.
// ---------------------------------------------------------------------------
onRecordUpdateRequest((e) => {
    if (!e.hasSuperuserAuth()) {
        const original = $app.findRecordById("memberships", e.record.id);
        ["role", "status", "group", "user", "addedBy", "joinedAt"].forEach((f) => {
            if (e.record.getString(f) !== original.getString(f)) {
                throw new BadRequestError("membership field is server-assigned", {}, f);
            }
        });
    }
    const pseudonym = e.record.getString("pseudonym");
    if (pseudonym.length < 2 || pseudonym.length > 32) {
        throw new BadRequestError("pseudonym must be 2-32 characters", {}, "pseudonym");
    }
    return e.next();
}, "memberships");

// ---------------------------------------------------------------------------
// check-ins: validate the local calendar date server-side.
// ---------------------------------------------------------------------------
onRecordCreateRequest((e) => {
    function computeLocalDateKey(isoInstant, timeZone) {
        const d = new Date(isoInstant || Date.now());
        let offsetMinutes = 330; // Asia/Kolkata is UTC+5:30 (330 min)
        if (timeZone === "UTC") offsetMinutes = 0;
        const target = new Date(d.getTime() + offsetMinutes * 60000);
        const y = target.getUTCFullYear();
        const m = String(target.getUTCMonth() + 1).padStart(2, "0");
        const day = String(target.getUTCDate()).padStart(2, "0");
        return y + "-" + m + "-" + day;
    }

    const localDate = e.record.getString("localDate");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(localDate)) {
        throw new BadRequestError("localDate must be YYYY-MM-DD", {}, "localDate");
    }
    if (!e.record.getBool("completed")) {
        throw new BadRequestError("only completed check-ins are stored", {}, "completed");
    }

    const ownerId = e.record.getString("user");
    if (!ownerId) {
        throw new BadRequestError("user is required", {}, "user");
    }
    if (e.auth && ownerId !== e.auth.id) {
        throw new BadRequestError("cannot create check-ins for another account", {}, "user");
    }

    const owner = $app.findRecordById("accounts", ownerId);
    const tz = owner.getString("timezone") || "Asia/Kolkata";
    const today = computeLocalDateKey(new Date().toISOString(), tz);
    if (localDate > today) {
        throw new BadRequestError("check-in cannot be dated in the future", {}, "localDate");
    }
    return e.next();
}, "checkins");

// ---------------------------------------------------------------------------
// invitations: unguessable server-generated code.
// ---------------------------------------------------------------------------
onRecordCreateRequest((e) => {
    if (!e.record.getString("code")) {
        e.record.set("code", $security.randomStringWithAlphabet(24, "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"));
    }
    e.record.set("usedCount", 0);
    e.record.set("revokedAt", null);
    return e.next();
}, "invitations");

// ---------------------------------------------------------------------------
// reports: a member may not report their own post (self-report spam).
// ---------------------------------------------------------------------------
onRecordCreateRequest((e) => {
    const targetPost = e.record.getString("targetPost");
    if (!targetPost) {
        return e.next();
    }
    let post = null;
    try {
        post = $app.findRecordById("posts", targetPost);
    } catch (err) {
        post = null;
    }
    if (!post) {
        throw new BadRequestError("target post not found", {}, "targetPost");
    }
    if (post.getString("author") === e.auth.id) {
        throw new BadRequestError("you cannot report your own post", {}, "targetPost");
    }
    return e.next();
}, "reports");

// ---------------------------------------------------------------------------
// posts: only a moderator of that group may change visibility.
// ---------------------------------------------------------------------------
onRecordUpdateRequest((e) => {
    function isMod(userId, groupId) {
        try {
            const m = $app.findFirstRecordByFilter(
                "memberships",
                `user = "${userId}" && group = "${groupId}" && status = "active" && role = "moderator"`
            );
            return !!m;
        } catch (err) {
            return false;
        }
    }

    if (!e.hasSuperuserAuth()) {
        const original = $app.findRecordById("posts", e.record.id);
        if (e.record.getString("status") !== original.getString("status")) {
            const actor = e.auth;
            if (!actor || !isMod(actor.id, original.getString("group"))) {
                throw new BadRequestError("only moderators may change post visibility", {}, "status");
            }
        }
    }
    return e.next();
}, "posts");
