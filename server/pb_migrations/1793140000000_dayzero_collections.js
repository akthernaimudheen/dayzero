// DayZero — initial schema, API rules and indexes.
//
// Rule semantics (PocketBase): null = locked (superuser only), "" = open to anyone,
// non-empty = filter expression that must match for the action AND acts as a record filter.
// Unsatisfied listRule -> 200 empty, createRule -> 400, view/update/delete -> 404, locked -> 403.
//
// Design rules encoded here:
//   * every private collection is scoped to the owner or to active membership of the same group
//   * roles can never be granted by the client (locked + hook enforced)
//   * directory/helpline data is read-only for clients; it is curated server-side only
//   * group creation is not available to clients at all (controlled pilot)
//
// NOTE: PocketBase bootstraps a default auth collection called "users" before running user
// migrations. We lock it down (superuser-only) and use our own "accounts" collection instead,
// so that our schema stays fully declarative and version controlled.

migrate((app) => {
    function save(c) {
        try {
            app.save(c);
            console.log("MIG saved: " + c.name);
        } catch (err) {
            console.log("MIG FAILED: " + c.name + " -> " + (err && err.message ? err.message : err));
            throw err;
        }
    }

    // -------------------------------------------- neutralise the built-in "users"
    try {
        const builtinUsers = app.findCollectionByNameOrId("users");
        builtinUsers.listRule = null;
        builtinUsers.viewRule = null;
        builtinUsers.createRule = null;
        builtinUsers.updateRule = null;
        builtinUsers.deleteRule = null;
        save(builtinUsers);
    } catch (err) {
        // Not present in this PocketBase build — nothing to lock down.
        console.log("MIG no built-in users collection to lock: " + (err && err.message));
    }

    // ----------------------------------------------------------------- accounts
    const accounts = new Collection({
        type: "auth",
        name: "accounts",
        // Only the owner may ever read or write their own auth record.
        listRule: `@request.auth.id != "" && id = @request.auth.id`,
        viewRule: `@request.auth.id != "" && id = @request.auth.id`,
        createRule: ``, // self-registration; role/status are forced by hooks
        updateRule: `@request.auth.id != "" && id = @request.auth.id`,
        deleteRule: null, // account deletion only through the server-side flow
        manageRule: null, // nobody manages another user's account via API
        emailVisibility: false, // never expose emails in API responses
        fields: [
            { name: "language", type: "select", values: ["en", "ml", "ml-Latn"], maxSelect: 1, required: true },
            { name: "timezone", type: "text", required: true, max: 64 },
            { name: "onboardedAt", type: "date" },
            { name: "role", type: "select", values: ["member", "moderator", "admin"], maxSelect: 1, required: true },
            { name: "status", type: "select", values: ["active", "suspended"], maxSelect: 1, required: true },
        ],
        indexes: [
            "CREATE INDEX idx_accounts_role ON accounts (role)",
        ],
    });
    save(accounts);

    // ------------------------------------------------- public care directory
    const facilities = new Collection({
        type: "base",
        name: "facilities",
        listRule: ``,
        viewRule: ``,
        createRule: null, // curated server-side only
        updateRule: null,
        deleteRule: null,
        fields: [
            { name: "name", type: "text", required: true, max: 200 },
            { name: "address", type: "text", required: true, max: 400 },
            { name: "district", type: "select", required: true, maxSelect: 1, values: [
                "Thiruvananthapuram", "Kollam", "Pathanamthitta", "Alappuzha", "Kottayam",
                "Idukki", "Ernakulam", "Thrissur", "Palakkad", "Malappuram",
                "Kozhikode", "Wayanad", "Kannur", "Kasaragod",
            ] },
            { name: "facilityType", type: "select", required: true, maxSelect: 1, values: [
                "govt_deaddiction", "punarjani_homoeopathy", "mental_health", "irca", "hospital_atf", "other",
            ] },
            { name: "services", type: "json" },
            { name: "phone", type: "text", max: 40 },
            { name: "costNote", type: "text", max: 300 },
            { name: "eligibilityNote", type: "text", max: 300 },
            { name: "hoursNote", type: "text", max: 300 },
            { name: "sourceName", type: "text", required: true, max: 200 },
            { name: "sourceUrl", type: "url", required: true },
            { name: "sourceRetrievedAt", type: "date", required: true },
            { name: "verifiedAt", type: "date", required: true },
            { name: "verificationStatus", type: "select", required: true, maxSelect: 1, values: ["verified", "unverified", "stale"] },
            { name: "lat", type: "number" },
            { name: "lng", type: "number" },
        ],
        indexes: [
            "CREATE INDEX idx_facilities_district ON facilities (district)",
            "CREATE INDEX idx_facilities_type ON facilities (facilityType)",
            "CREATE INDEX idx_facilities_status ON facilities (verificationStatus)",
        ],
    });
    save(facilities);

    // -------------------------------------------------------------- helplines
    const helplines = new Collection({
        type: "base",
        name: "helplines",
        listRule: ``,
        viewRule: ``,
        createRule: null,
        updateRule: null,
        deleteRule: null,
        fields: [
            { name: "name", type: "text", required: true, max: 160 },
            { name: "number", type: "text", required: true, max: 40 },
            { name: "category", type: "select", required: true, maxSelect: 1, values: ["emergency", "crisis", "counselling", "referral"] },
            { name: "descriptionEn", type: "text", required: true, max: 400 },
            { name: "descriptionMl", type: "text", max: 400 },
            { name: "issuer", type: "text", required: true, max: 200 },
            { name: "sourceUrl", type: "url", required: true },
            { name: "verifiedAt", type: "date", required: true },
            { name: "status", type: "select", required: true, maxSelect: 1, values: ["verified", "unverified", "stale"] },
        ],
        indexes: [
            "CREATE INDEX idx_helplines_category ON helplines (category)",
            "CREATE INDEX idx_helplines_status ON helplines (status)",
        ],
    });
    save(helplines);

    // -------------------------------------------------------------- check-ins
    const checkins = new Collection({
        type: "base",
        name: "checkins",
        listRule: `@request.auth.id != "" && user = @request.auth.id`,
        viewRule: `@request.auth.id != "" && user = @request.auth.id`,
        createRule: `@request.auth.id != "" && user = @request.auth.id`,
        updateRule: `@request.auth.id != "" && user = @request.auth.id`,
        deleteRule: `@request.auth.id != "" && user = @request.auth.id`,
        fields: [
            { name: "user", type: "relation", required: true, collectionId: accounts.id, maxSelect: 1, onDelete: "cascade" },
            { name: "localDate", type: "text", required: true, max: 10, pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
            { name: "mood", type: "number", required: true, min: 1, max: 5 },
            { name: "note", type: "text", max: 500 },
            { name: "completed", type: "bool", required: true },
            { name: "recordedAt", type: "date", required: true },
        ],
        indexes: [
            "CREATE INDEX idx_checkins_user_date ON checkins (user, localDate)",
        ],
    });
    save(checkins);

    // ------------------------------------------------------------------ goals
    const goals = new Collection({
        type: "base",
        name: "goals",
        listRule: `@request.auth.id != "" && user = @request.auth.id`,
        viewRule: `@request.auth.id != "" && user = @request.auth.id`,
        createRule: `@request.auth.id != "" && user = @request.auth.id`,
        updateRule: `@request.auth.id != "" && user = @request.auth.id`,
        deleteRule: `@request.auth.id != "" && user = @request.auth.id`,
        fields: [
            { name: "user", type: "relation", required: true, collectionId: accounts.id, maxSelect: 1, onDelete: "cascade" },
            { name: "title", type: "text", required: true, max: 120 },
            { name: "active", type: "bool", required: true },
            { name: "createdAt", type: "date", required: true },
        ],
        indexes: ["CREATE INDEX idx_goals_user ON goals (user)"],
    });
    save(goals);

    // ----------------------------------------------------------------- groups
    const groups = new Collection({
        type: "base",
        name: "groups",
        // Rules that reference @collection.memberships cannot be resolved until the
        // memberships collection exists (circular relation), so start locked and apply
        // the real visibility rules right after memberships is created below.
        listRule: null,
        viewRule: null,
        createRule: null, // no unmoderated / self-service group creation (controlled pilot)
        updateRule: null,
        deleteRule: null,
        fields: [
            { name: "name", type: "text", required: true, max: 80 },
            { name: "description", type: "text", max: 600 },
            { name: "communityRules", type: "text", required: true, max: 4000 },
            { name: "inviteOnly", type: "bool", required: true },
            { name: "createdBy", type: "relation", collectionId: accounts.id, maxSelect: 1, onDelete: "nullify" },
            { name: "status", type: "select", required: true, maxSelect: 1, values: ["active", "archived"] },
        ],
        indexes: ["CREATE INDEX idx_groups_status ON groups (status)"],
    });
    save(groups);

    // ------------------------------------------------------------- memberships
    const memberships = new Collection({
        type: "base",
        name: "memberships",
        // You may always see your own memberships.
        listRule: `@request.auth.id != "" && user = @request.auth.id`,
        viewRule: `@request.auth.id != "" && user = @request.auth.id`,
        // Never client-created: membership only comes from the server-side invitation redemption.
        createRule: null,
        // Own record only; role/status tampering is blocked in hooks.
        updateRule: `@request.auth.id != "" && user = @request.auth.id`,
        // Leaving a group = deleting your own membership.
        deleteRule: `@request.auth.id != "" && user = @request.auth.id`,
        fields: [
            { name: "group", type: "relation", required: true, collectionId: groups.id, maxSelect: 1, onDelete: "cascade" },
            { name: "user", type: "relation", required: true, collectionId: accounts.id, maxSelect: 1, onDelete: "cascade" },
            { name: "pseudonym", type: "text", required: true, min: 2, max: 32 },
            { name: "role", type: "select", required: true, maxSelect: 1, values: ["member", "moderator"] },
            { name: "status", type: "select", required: true, maxSelect: 1, values: ["active", "removed", "banned"] },
            { name: "joinedAt", type: "date", required: true },
            { name: "addedBy", type: "relation", collectionId: accounts.id, maxSelect: 1, onDelete: "nullify" },
        ],
        indexes: [
            "CREATE UNIQUE INDEX idx_memberships_group_user ON memberships (group, user)",
            "CREATE INDEX idx_memberships_user ON memberships (user)",
        ],
    });
    save(memberships);

    // --- now that memberships exists, open group visibility to active members ---
    groups.listRule = `@request.auth.id != "" && status = "active" && @collection.memberships:auth.group ?= id && @collection.memberships:auth.user ?= @request.auth.id && @collection.memberships:auth.status ?= "active"`;
    groups.viewRule = `@request.auth.id != "" && @collection.memberships:auth.group ?= id && @collection.memberships:auth.user ?= @request.auth.id && @collection.memberships:auth.status ?= "active"`;
    groups.updateRule = `@request.auth.id != "" && @collection.memberships:auth.group ?= id && @collection.memberships:auth.user ?= @request.auth.id && @collection.memberships:auth.status ?= "active" && @collection.memberships:auth.role ?= "moderator"`;
    save(groups);

    // ------------------------------------------------------------- invitations
    const invitations = new Collection({
        type: "base",
        name: "invitations",
        listRule: `@request.auth.id != "" && createdBy = @request.auth.id`,
        viewRule: `@request.auth.id != "" && createdBy = @request.auth.id`,
        createRule: `@request.auth.id != "" && createdBy = @request.auth.id && @collection.memberships:auth.group ?= group && @collection.memberships:auth.user ?= @request.auth.id && @collection.memberships:auth.status ?= "active" && @collection.memberships:auth.role ?= "moderator"`,
        updateRule: `@request.auth.id != "" && createdBy = @request.auth.id && @collection.memberships:auth.group ?= group && @collection.memberships:auth.user ?= @request.auth.id && @collection.memberships:auth.status ?= "active" && @collection.memberships:auth.role ?= "moderator"`,
        deleteRule: null,
        fields: [
            { name: "group", type: "relation", required: true, collectionId: groups.id, maxSelect: 1, onDelete: "cascade" },
            { name: "code", type: "text", required: true, max: 64, pattern: "^[A-Za-z0-9]{16,64}$" },
            { name: "createdBy", type: "relation", required: true, collectionId: accounts.id, maxSelect: 1, onDelete: "cascade" },
            { name: "expiresAt", type: "date", required: true },
            { name: "revokedAt", type: "date" },
            { name: "maxUses", type: "number", required: true, min: 1, max: 100 },
            { name: "usedCount", type: "number", min: 0 },
        ],
        indexes: [
            "CREATE UNIQUE INDEX idx_invitations_code ON invitations (code)",
            "CREATE INDEX idx_invitations_group ON invitations (group)",
        ],
    });
    save(invitations);

    // ------------------------------------------------------------------ posts
    const posts = new Collection({
        type: "base",
        name: "posts",
        listRule: `@request.auth.id != "" && status = "visible" && @collection.memberships:auth.group ?= group && @collection.memberships:auth.user ?= @request.auth.id && @collection.memberships:auth.status ?= "active"`,
        viewRule: `@request.auth.id != "" && status = "visible" && @collection.memberships:auth.group ?= group && @collection.memberships:auth.user ?= @request.auth.id && @collection.memberships:auth.status ?= "active"`,
        createRule: `@request.auth.id != "" && author = @request.auth.id && status = "visible" && @collection.memberships:auth.group ?= group && @collection.memberships:auth.user ?= @request.auth.id && @collection.memberships:auth.status ?= "active"`,
        updateRule: `@request.auth.id != "" && author = @request.auth.id`,
        deleteRule: `@request.auth.id != "" && (author = @request.auth.id || (@collection.memberships:auth.group ?= group && @collection.memberships:auth.user ?= @request.auth.id && @collection.memberships:auth.status ?= "active" && @collection.memberships:auth.role ?= "moderator"))`,
        fields: [
            { name: "group", type: "relation", required: true, collectionId: groups.id, maxSelect: 1, onDelete: "cascade" },
            { name: "author", type: "relation", required: true, collectionId: accounts.id, maxSelect: 1, onDelete: "cascade" },
            { name: "body", type: "text", required: true, min: 1, max: 2000 },
            { name: "status", type: "select", required: true, maxSelect: 1, values: ["visible", "hidden"] },
            { name: "hiddenReason", type: "text", max: 300 },
        ],
        indexes: [
            "CREATE INDEX idx_posts_group_status ON posts (group, status)",
            "CREATE INDEX idx_posts_author ON posts (author)",
        ],
    });
    save(posts);

    // ---------------------------------------------------------------- reports
    const reports = new Collection({
        type: "base",
        name: "reports",
        listRule: `@request.auth.id != "" && @collection.memberships:auth.group ?= group && @collection.memberships:auth.user ?= @request.auth.id && @collection.memberships:auth.status ?= "active" && @collection.memberships:auth.role ?= "moderator"`,
        viewRule: `@request.auth.id != "" && @collection.memberships:auth.group ?= group && @collection.memberships:auth.user ?= @request.auth.id && @collection.memberships:auth.status ?= "active" && @collection.memberships:auth.role ?= "moderator"`,
        createRule: `@request.auth.id != "" && reporter = @request.auth.id && @collection.memberships:auth.group ?= group && @collection.memberships:auth.user ?= @request.auth.id && @collection.memberships:auth.status ?= "active"`,
        updateRule: `@request.auth.id != "" && @collection.memberships:auth.group ?= group && @collection.memberships:auth.user ?= @request.auth.id && @collection.memberships:auth.status ?= "active" && @collection.memberships:auth.role ?= "moderator"`,
        deleteRule: null, // moderation history is retained, not client-deletable
        fields: [
            { name: "group", type: "relation", required: true, collectionId: groups.id, maxSelect: 1, onDelete: "cascade" },
            { name: "reporter", type: "relation", required: true, collectionId: accounts.id, maxSelect: 1, onDelete: "cascade" },
            { name: "targetPost", type: "relation", collectionId: posts.id, maxSelect: 1, onDelete: "nullify" },
            { name: "targetUser", type: "relation", collectionId: accounts.id, maxSelect: 1, onDelete: "nullify" },
            { name: "reason", type: "text", required: true, max: 500 },
            { name: "status", type: "select", required: true, maxSelect: 1, values: ["open", "resolved", "dismissed"] },
            { name: "resolution", type: "text", max: 500 },
            { name: "handledBy", type: "relation", collectionId: accounts.id, maxSelect: 1, onDelete: "nullify" },
        ],
        indexes: [
            "CREATE INDEX idx_reports_group_status ON reports (group, status)",
        ],
    });
    save(reports);

    // ----------------------------------------------------------------- blocks
    const blocks = new Collection({
        type: "base",
        name: "blocks",
        listRule: `@request.auth.id != "" && blocker = @request.auth.id`,
        viewRule: `@request.auth.id != "" && blocker = @request.auth.id`,
        createRule: `@request.auth.id != "" && blocker = @request.auth.id`,
        updateRule: null,
        deleteRule: `@request.auth.id != "" && blocker = @request.auth.id`,
        fields: [
            { name: "blocker", type: "relation", required: true, collectionId: accounts.id, maxSelect: 1, onDelete: "cascade" },
            { name: "blocked", type: "relation", required: true, collectionId: accounts.id, maxSelect: 1, onDelete: "cascade" },
        ],
        indexes: [
            "CREATE UNIQUE INDEX idx_blocks_pair ON blocks (blocker, blocked)",
        ],
    });
    save(blocks);

    // -------------------------------------------------------------- audit log
    const auditLog = new Collection({
        type: "base",
        name: "audit_log",
        listRule: null,
        viewRule: null,
        createRule: null,
        updateRule: null,
        deleteRule: null,
        fields: [
            { name: "actor", type: "relation", collectionId: accounts.id, maxSelect: 1, onDelete: "nullify" },
            { name: "action", type: "text", required: true, max: 80 },
            { name: "targetType", type: "text", max: 40 },
            { name: "targetId", type: "text", max: 40 },
            { name: "group", type: "relation", collectionId: groups.id, maxSelect: 1, onDelete: "nullify" },
            { name: "meta", type: "json" },
        ],
        indexes: ["CREATE INDEX idx_audit_action ON audit_log (action)"],
    });
    save(auditLog);
}, (app) => {
    // Down: drop in reverse dependency order (the built-in "users" is left untouched).
    ["audit_log", "blocks", "reports", "posts", "invitations", "memberships",
     "groups", "goals", "checkins", "helplines", "facilities", "accounts"].forEach((name) => {
        try {
            app.delete(app.findCollectionByNameOrId(name));
        } catch (e) {
            // already gone
        }
    });
});