import assert from "node:assert";
import { test } from "node:test";
import { spawn, spawnSync } from "node:child_process";
import { readFileSync, mkdirSync, rmSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

// Resolve the server directory from this file, not from process.cwd(): the
// suite must behave identically whether it is run from the repo root or via
// `npm run test:server`, which cd's into server/ first.
const SERVER_DIR = fileURLToPath(new URL("..", import.meta.url)).replace(/[\\/]+$/, "");
const PORT = 8190;
// Origin only: request paths below are absolute, and an absolute path would
// silently discard the /api prefix if it were part of this base URL.
const ORIGIN = `http://127.0.0.1:${PORT}`;
const BASE = `${ORIGIN}/api`;

// The pilot circle and its moderator membership are server-provisioned: both
// groups.createRule and memberships.createRule are null, so a normal client can
// never create them. This is the only way to seed them, and it mirrors how an
// operator provisions a controlled pilot in production.
const SUPERUSER_EMAIL = "admin@dayzero.test";
const SUPERUSER_PASSWORD = "n0tForProduction-su!";

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// PocketBase REST collection access is /api/collections/<name>/records[/<id>];
// auth and the custom /api/dayzero/* routes keep their own shapes. Call sites in
// this file use the short /collections/<name> form, so normalise it in one place.
function collectionPath(path) {
    const q = path.indexOf("?");
    const pathname = q === -1 ? path : path.slice(0, q);
    const query = q === -1 ? "" : path.slice(q);
    const m = /^\/collections\/([^/]+)(\/.*)?$/.exec(pathname);
    if (!m) return path;
    const rest = m[2] || "";
    if (rest.startsWith("/records") || rest.startsWith("/auth-") ||
        rest.startsWith("/confirm-") || rest.startsWith("/request-password-reset")) {
        return path;
    }
    return "/collections/" + m[1] + "/records" + rest + query;
}

// Paths in this file are written either as /collections/... or already carry the
// /api prefix for the custom /api/dayzero/* routes; normalise both to one origin.
function apiUrl(path) {
    const normalised = collectionPath(path);
    return new URL(normalised.startsWith("/api/") ? normalised : BASE + normalised, ORIGIN);
}

function request(method, path, opts = {}) {
    const url = apiUrl(path);
    const headers = new Headers(opts.headers || {});
    if (opts.token) {
        headers.set("Authorization", `Bearer ${opts.token}`);
    }
    if (opts.body !== undefined) {
        headers.set("Content-Type", "application/json");
    }
    return fetch(url.toString(), {
        method,
        headers,
        body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    }).then((r) => ({
        status: r.status,
        json: () => r.json().catch(() => ({})),
        text: () => r.text(),
        ok: r.ok,
    }));
}

function post(path, body, opts = {}) {
    return request("POST", path, { ...opts, body });
}

function del(path, opts = {}) {
    return request("DELETE", path, opts);
}

function patch(path, body, opts = {}) {
    return request("PATCH", path, { ...opts, body });
}

function startServer() {
    const tmpData = join(SERVER_DIR, "pb_data_test");
    rmSync(tmpData, { recursive: true, force: true });
    mkdirSync(tmpData, { recursive: true });
    mkdirSync(join(tmpData, "pb_hooks"), { recursive: true });
    mkdirSync(join(tmpData, "pb_migrations"), { recursive: true });
    for (const f of readdirSync(join(SERVER_DIR, "pb_hooks"))) {
        writeFileSync(join(tmpData, "pb_hooks", f), readFileSync(join(SERVER_DIR, "pb_hooks", f)));
    }
    for (const f of readdirSync(join(SERVER_DIR, "pb_migrations"))) {
        writeFileSync(join(tmpData, "pb_migrations", f), readFileSync(join(SERVER_DIR, "pb_migrations", f)));
    }

    const env = {
        ...process.env,
        POCKETBASE_ENV: "test",
    };

    // Provision the operator superuser into the throwaway data directory first;
    // without it the seeded pilot circle cannot be created.
    const su = spawnSync(SERVER_DIR + "/pocketbase.exe", [
        "superuser", "upsert", SUPERUSER_EMAIL, SUPERUSER_PASSWORD, "--dir=" + tmpData,
    ], { env, encoding: "utf8" });
    if (su.status !== 0) {
        throw new Error("superuser upsert failed: " + su.stdout + su.stderr);
    }
    // PocketBase 0.40 takes the data directory from --dir (there is no --config
    // flag and POCKETBASE_CONFIG_DIR is not read), so pointing --dir at the
    // throwaway directory is what keeps this suite off the real pb_data.
    const pb = spawn(SERVER_DIR + "/pocketbase.exe", [
        "serve",
        "--http=127.0.0.1:" + PORT,
        "--origins=*",
        "--dir=" + tmpData,
        "--hooksDir=" + tmpData + "/pb_hooks",
        "--migrationsDir=" + tmpData + "/pb_migrations",
    ], { env, stdio: ["ignore", "pipe", "pipe"] });

    let out = "";
    let err = "";
    pb.stdout.on("data", (d) => (out += d.toString()));
    pb.stderr.on("data", (d) => (err += d.toString()));

    return new Promise((resolve, reject) => {
        let settled = false;
        let poll = null;
        const finish = (err) => {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            clearTimeout(poll);
            // A live view of the server output: some failures only surface as a
            // generic 400 in the HTTP response, with the real cause on the console.
            if (err) reject(err); else resolve({ pb, tmpData, log: () => out + err });
        };
        const timer = setTimeout(
            () => finish(new Error("server did not start: " + out + err)),
            30000
        );
        // A settled promise must also stop the polling chain, otherwise the timer
        // keeps the event loop alive and the test runner never terminates.
        const exited = () => finish(new Error("server exited early: " + out + err));
        pb.on("close", exited);
        pb.on("exit", exited);
        const check = () => {
            if (settled) return;
            if ((out + err).includes("Server started")) return finish();
            if ((out + err).length > 8000) {
                return finish(new Error("server failed to start: " + out + err));
            }
            poll = setTimeout(check, 100);
        };
        check();
    });
}

// Account creation and sign-in are two separate API calls: POST /collections/accounts
// creates, and auth-with-password only authenticates an existing account.
async function register(email, password) {
    const created = await (await post("/collections/accounts", {
        email,
        password,
        passwordConfirm: password,
        language: "en",
        timezone: "Asia/Kolkata",
    })).json();
    assert.ok(created.id, "account create failed for " + email + ": " + JSON.stringify(created));

    const session = await (await post("/collections/accounts/auth-with-password", {
        identity: email,
        password,
    })).json();
    assert.ok(session.token, "login failed for " + email + ": " + JSON.stringify(session));
    // PocketBase answers auth-with-password with { token, record } — the account
    // id lives on record, not at the top level.
    assert.ok(session.record && session.record.id, "no account record in login response: " + JSON.stringify(session));
    return { token: session.token, id: session.record.id };
}

async function superuserToken() {
    const session = await (await post("/collections/_superusers/auth-with-password", {
        identity: SUPERUSER_EMAIL,
        password: SUPERUSER_PASSWORD,
    })).json();
    assert.ok(session.token, "superuser login failed: " + JSON.stringify(session));
    return session.token;
}

async function seed(tokenAlice) {
    const bob = await register("bob@example.test", "n0tForProduction!");
    const su = await superuserToken();
    const asSuperuser = { token: su };

    // Server-side provisioning of the controlled pilot (client createRule is null).
    const group = await (await post("/collections/groups", {
        name: "Pilot Circle",
        description: "A small pilot circle",
        communityRules: "Be kind. No pressure. No medical advice.",
        inviteOnly: true,
        status: "active",
        createdBy: tokenAliceAccountId,
    }, asSuperuser)).json();
    assert.ok(group.id, "group id missing: " + JSON.stringify(group));

    const membership = await (await post("/collections/memberships", {
        group: group.id,
        user: tokenAliceAccountId,
        pseudonym: "Al",
        role: "moderator",
        status: "active",
        joinedAt: new Date().toISOString(),
        addedBy: tokenAliceAccountId,
    }, asSuperuser)).json();
    assert.ok(membership.id, "moderator membership missing: " + JSON.stringify(membership));

    // Provision the single-use invite server-side, then demote Alice to an
    // ordinary member so the negative-privilege assertions below are meaningful.
    const invite = await (await post("/collections/invitations", {
        group: group.id,
        code: "SOLOINVITECODE1234ABC",
        createdBy: tokenAliceAccountId,
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        maxUses: 1,
        usedCount: 0,
    }, asSuperuser)).json();
    assert.ok(invite.id, "invite id missing: " + JSON.stringify(invite));

    const demoted = await patch("/collections/memberships/" + membership.id, {
        role: "member",
    }, asSuperuser);
    assert.ok(demoted.ok, "demotion should be applied by the operator");

    const aliceCheckin = await post("/collections/checkins", {
        user: tokenAliceAccountId,
        localDate: "2026-01-01",
        mood: 4,
        note: "ok",
        completed: true,
        recordedAt: new Date().toISOString(),
    }, { token: tokenAlice });
    assert.ok(aliceCheckin.ok, "alice checkin failed");

    const bobCheckin = await post("/collections/checkins", {
        user: bob.id,
        localDate: "2026-01-01",
        mood: 2,
        note: "hard day",
        completed: true,
        recordedAt: new Date().toISOString(),
    }, { token: bob.token });
    assert.ok(bobCheckin.ok, "bob checkin failed");

    const aliceGoal = await post("/collections/goals", {
        user: tokenAliceAccountId,
        title: "Keep going",
        active: true,
        createdAt: new Date().toISOString(),
    }, { token: tokenAlice });
    assert.ok(aliceGoal.ok, "alice goal failed");

    const alicePost = await post("/collections/posts", {
        group: group.id,
        author: tokenAliceAccountId,
        body: "If you are reading this, the server is still standing.",
        status: "visible",
    }, { token: tokenAlice });
    assert.ok(alicePost.ok, "alice post failed");

    // Bob only becomes a member later (via the invite), so his post is created
    // inside the tests that run after he has joined.
    return { bob, group, invite, aliceCheckin, bobCheckin, aliceGoal, alicePost };
}

let tokenAliceAccountId = null;

test("DayZero server security", { timeout: 120000 }, async (t) => {
    const { pb, tmpData, log } = await startServer();
    let tokenAlice = null, tokenBob = null, aliceId = null, bobId = null, groupId = null, inviteCode = null;
    try {
        const alice = await register("alice@example.test", "n0tForProduction!");
        tokenAlice = alice.token;
        aliceId = alice.id;
        tokenAliceAccountId = alice.id;

        const s = await seed(tokenAlice);
        tokenBob = s.bob.token;
        bobId = s.bob.id;
        groupId = s.group.id;
        inviteCode = s.invite.code;

        await t.test("unauthenticated access is rejected", async () => {
            const r = await request("GET", "/collections/checkins");
            const body = await r.json();
            // PocketBase answers a failed listRule either with 401/403 or with
            // 200 + an empty page; never with another user's records.
            assert.ok(!r.ok || (Array.isArray(body.items) && body.items.length === 0),
                "unauthenticated checkins list must expose nothing: " + JSON.stringify(body));
        });

        await t.test("alice cannot read bob checkins", async () => {
            const r = await request("GET", "/collections/checkins?filter=user%3D'" + bobId + "'", { token: tokenAlice });
            const body = await r.json();
            assert.ok(body.items.length === 0, "alice should see no bob checkins");
        });

        await t.test("alice cannot update bob checkins", async () => {
            const bobCheckins = await (await request("GET", "/collections/checkins?filter=user%3D'" + bobId + "'&limit=1", { token: tokenBob })).json();
            assert.ok(bobCheckins.items.length === 1);
            const r = await patch("/collections/checkins/" + bobCheckins.items[0].id, { mood: 5 }, { token: tokenAlice });
            assert.ok(!r.ok, "alice should not update bob checkins");
        });

        await t.test("alice cannot delete bob checkins", async () => {
            const bobCheckins = await (await request("GET", "/collections/checkins?filter=user%3D'" + bobId + "'&limit=1", { token: tokenBob })).json();
            assert.ok(bobCheckins.items.length === 1);
            const r = await del("/collections/checkins/" + bobCheckins.items[0].id, { token: tokenAlice });
            assert.ok(!r.ok, "alice should not delete bob checkins");
        });

        await t.test("bob cannot read alice goals", async () => {
            const r = await request("GET", "/collections/goals?filter=user%3D'" + aliceId + "'", { token: tokenBob });
            const body = await r.json();
            assert.ok(body.items.length === 0, "bob should see no alice goals");
        });

        await t.test("alice cannot self-promote role on accounts", async () => {
            const r = await patch("/collections/accounts/" + aliceId, { role: "moderator" }, { token: tokenAlice });
            assert.ok(!r.ok, "role self-promotion should fail");
            const updated = await (await request("GET", "/collections/accounts/" + aliceId, { token: tokenAlice })).json();
            assert.ok(updated.role === "member", "role should remain member");
        });

        await t.test("alice cannot self-promote role on memberships", async () => {
            const memberships = await (await request("GET", "/collections/memberships?filter=user%3D'" + aliceId + "'&limit=1", { token: tokenAlice })).json();
            assert.ok(memberships.items.length === 1);
            const r = await patch("/collections/memberships/" + memberships.items[0].id, { role: "moderator" }, { token: tokenAlice });
            assert.ok(!r.ok, "membership role self-promotion should fail");
        });

        await t.test("alice cannot create membership for bob", async () => {
            const r = await post("/collections/memberships", {
                group: groupId,
                user: bobId,
                pseudonym: "BobIn",
                role: "member",
                status: "active",
                joinedAt: new Date().toISOString(),
                addedBy: aliceId,
            }, { token: tokenAlice });
            assert.ok(!r.ok, "client-created membership should fail");
        });

        await t.test("alice cannot create invitation as non-moderator", async () => {
            const r = await post("/collections/invitations", {
                group: groupId,
                code: "bad-invite-" + Date.now(),
                createdBy: aliceId,
                expiresAt: new Date(Date.now() + 3600000).toISOString(),
                maxUses: 1,
                usedCount: 0,
            }, { token: tokenAlice });
            assert.ok(!r.ok, "non-moderator invitation creation should fail");
        });

        await t.test("alice cannot create invitation with forged createdBy", async () => {
            const modMembership = await (await request("GET", "/collections/memberships?filter=user%3D'" + aliceId + "'&limit=1", { token: tokenAlice })).json();
            const r = await post("/collections/invitations", {
                group: groupId,
                code: "forged-invite-" + Date.now(),
                createdBy: modMembership.items[0].id,
                expiresAt: new Date(Date.now() + 3600000).toISOString(),
                maxUses: 1,
                usedCount: 0,
            }, { token: tokenAlice });
            assert.ok(!r.ok, "forged createdBy invitation should fail");
        });

        await t.test("bob cannot join with a made-up code", async () => {
            const r = await post("/api/dayzero/community/join", { code: "not-a-real-code", pseudonym: "Bob" }, { token: tokenBob });
            const body = await r.json();
            assert.ok(!r.ok, "made-up code should be rejected");
            assert.ok(body.code === "invalid_code" || body.code === "not_found", "unexpected error " + JSON.stringify(body));
        });

        await t.test("bob can join the pilot circle with a valid single-use invite", async () => {
            const r = await post("/api/dayzero/community/join", { code: inviteCode, pseudonym: "Bob" }, { token: tokenBob });
            const body = await r.json();
            assert.ok(r.ok, "join should succeed");
            assert.ok(body.code === "joined");

            const memberships = await (await request("GET", "/collections/memberships?filter=group%3D'" + groupId + "'&limit=5", { token: tokenBob })).json();
            // Relation fields come back as bare ids unless explicitly expanded.
            const bobMembership = memberships.items.find((m) => (typeof m.user === "string" ? m.user : m.user?.id) === bobId);
            assert.ok(bobMembership, "bob membership present");
            assert.ok(bobMembership.role === "member", "role should be member");
            assert.ok(bobMembership.status === "active", "status should be active");
        });

        await t.test("alice cannot hide another member's post by direct PATCH", async () => {
            const bobPost = await post("/collections/posts", {
                group: groupId,
                author: bobId,
                body: "Bob's message from the pilot circle.",
                status: "visible",
            }, { token: tokenBob });
            const bobPostBody = await bobPost.json();
            assert.ok(bobPost.ok, "bob should be able to post after joining: " + JSON.stringify(bobPostBody));

            const posts = await (await request("GET", "/collections/posts?filter=author%3D'" + bobId + "'&limit=1", { token: tokenAlice })).json();
            assert.ok(posts.items.length === 1, "alice should be able to read the visible group post");
            const r = await patch("/collections/posts/" + posts.items[0].id, { status: "hidden" }, { token: tokenAlice });
            assert.ok(!r.ok, "non-author non-moderator should not change post status");
        });

        await t.test("non-moderator cannot use the moderation route", async () => {
            const posts = await (await request("GET", "/collections/posts?filter=author%3D'" + aliceId + "'&limit=1", { token: tokenAlice })).json();
            assert.ok(posts.items.length === 1, "alice should see her own post");
            const r = await post("/api/dayzero/moderation/posts/" + posts.items[0].id, { action: "hide", reason: "not a moderator" }, { token: tokenAlice });
            assert.ok(!r.ok, "demoted member should not be able to moderate posts");

            const bobMembership = (await (await request("GET", "/collections/memberships?filter=user%3D'" + bobId + "'&limit=1", { token: tokenBob })).json()).items[0];
            assert.ok(bobMembership, "bob membership should be readable by bob");
            const members = await post("/api/dayzero/moderation/members/" + bobMembership.id, { action: "ban" }, { token: tokenAlice });
            assert.ok(!members.ok, "demoted member should not be able to moderate members");
        });

        await t.test("same single-use invite cannot be redeemed twice", async () => {
            const r = await post("/api/dayzero/community/join", { code: inviteCode, pseudonym: "Bob2" }, { token: tokenBob });
            const body = await r.json();
            assert.ok(!r.ok, "second redemption should fail");
            assert.ok(body.code === "fully_used" || body.code === "already_member" || body.code === "invalid_code", "unexpected error " + JSON.stringify(body));
        });

        await t.test("expired invite is rejected", async () => {
            // Only a moderator (here: the operator acting as one) can create an
            // invitation at all; the expiry check happens during redemption.
            const su = await superuserToken();
            const expireNow = await post("/collections/invitations", {
                group: groupId,
                code: "EXPIREDINVITE" + Date.now(),
                createdBy: aliceId,
                expiresAt: new Date(Date.now() - 60000).toISOString(),
                maxUses: 1,
                usedCount: 0,
            }, { token: su });
            const expired = await expireNow.json();
            const r = await post("/api/dayzero/community/join", { code: expired.code, pseudonym: "Late" }, { token: tokenBob });
            const body = await r.json();
            assert.ok(!r.ok, "expired invite should fail");
            assert.ok(body.code === "expired", "unexpected error " + JSON.stringify(body));
        });

        await t.test("revoked invite is rejected", async () => {
            const su = await superuserToken();
            const revokeNow = await post("/collections/invitations", {
                group: groupId,
                code: "REVOKEDINVITE" + Date.now(),
                createdBy: aliceId,
                expiresAt: new Date(Date.now() + 3600000).toISOString(),
                maxUses: 1,
                usedCount: 0,
            }, { token: su });
            const toRevoke = await revokeNow.json();
            assert.ok(toRevoke.id, "operator should be able to create an invite: " + JSON.stringify(toRevoke));
            await patch("/collections/invitations/" + toRevoke.id, { revokedAt: new Date().toISOString() }, { token: su });
            const r = await post("/api/dayzero/community/join", { code: toRevoke.code, pseudonym: "Revoked" }, { token: tokenBob });
            const body = await r.json();
            assert.ok(!r.ok, "revoked invite should fail");
            assert.ok(body.code === "revoked", "unexpected error " + JSON.stringify(body));
        });

        await t.test("account deletion requires the account password", async () => {
            // The route deletes only the authenticated account, and only after
            // re-authentication; a wrong password must leave it untouched.
            const r = await post("/api/dayzero/account/delete", { password: "wrong-password" }, { token: tokenAlice });
            assert.ok(!r.ok, "deletion with a wrong password should fail");

            const still = await request("GET", "/collections/accounts/" + aliceId, { token: tokenAlice });
            assert.ok(still.ok, "account should still exist after a failed deletion");
        });

        await t.test("alice can delete her own account with correct password", async () => {
            const r = await post("/api/dayzero/account/delete", { password: "n0tForProduction!" }, { token: tokenAlice });
            const body = await r.json();
            assert.ok(r.ok, "self deletion should succeed: " + JSON.stringify(body) +
                "\nSERVER LOG:\n" + log().split("\n").slice(-15).join("\n"));
            assert.ok(body.code === "deleted", "unexpected result " + JSON.stringify(body));

            const after = await request("GET", "/collections/accounts/" + aliceId, { token: tokenAlice });
            assert.ok(!after.ok, "deleted account should be gone");
        });

        await t.test("account deletion removes private records", async () => {
            // Alice's token died with her account, so the operator verifies.
            const su = await superuserToken();
            const asSuperuser = { token: su };

            const checkins = await (await request("GET", "/collections/checkins?filter=user%3D'" + aliceId + "'", asSuperuser)).json();
            assert.ok(checkins.items.length === 0, "alice checkins should be gone after deletion");

            const goals = await (await request("GET", "/collections/goals?filter=user%3D'" + aliceId + "'", asSuperuser)).json();
            assert.ok(goals.items.length === 0, "alice goals should be gone after deletion");

            const memberships = await (await request("GET", "/collections/memberships?filter=user%3D'" + aliceId + "'", asSuperuser)).json();
            assert.ok(memberships.items.length === 0, "alice memberships should be gone after deletion");

            const posts = await (await request("GET", "/collections/posts?filter=author%3D'" + aliceId + "'", asSuperuser)).json();
            assert.ok(posts.items.length === 0, "alice posts should be gone after deletion");
        });

        await t.test("auth endpoints leak no stack traces", async () => {
            const r = await post("/collections/accounts/auth-with-password", { identity: "nope@example.test", password: "x" });
            const text = await r.text();
            assert.ok(!text.includes("at "), "stack trace should not leak: " + text);
            assert.ok(!/\brequire\s*\(/.test(text), "require leak: " + text);
            assert.ok(!text.includes("ReferenceError"), "exception leak: " + text);
            assert.ok(!text.includes("TypeError"), "exception leak: " + text);
            assert.ok(!text.includes("pocketbase"), "implementation detail leak: " + text);
        });

        await t.test("forged ownership field is ignored on create", async () => {
            const forged = await post("/collections/checkins", {
                user: bobId,
                localDate: "2026-01-02",
                mood: 1,
                note: "forged",
                completed: true,
                recordedAt: new Date().toISOString(),
            }, { token: tokenAlice });
            const body = await forged.json();
            assert.ok(!forged.ok, "forged user ownership should be rejected");
        });

        await t.test("malformed payloads are rejected without crash", async () => {
            const r = await post("/collections/checkins", "not-json", { token: tokenBob, headers: { "Content-Type": "application/json" } });
            assert.ok(!r.ok, "malformed json should fail");
        });

        await t.test("oversized membership pseudonym is rejected", async () => {
            const memberships = await (await request("GET", "/collections/memberships?filter=user%3D'" + bobId + "'&limit=1", { token: tokenBob })).json();
            assert.ok(memberships.items.length === 1);
            const m = memberships.items[0];
            const r = await patch("/collections/memberships/" + m.id, { pseudonym: "x".repeat(200) }, { token: tokenBob });
            assert.ok(!r.ok, "oversized pseudonym should fail");
        });

        await t.test("rate limiter returns 429 under sustained auth pressure", async () => {
            let got429 = false;
            for (let i = 0; i < 20; i++) {
                const r = await post("/collections/accounts/auth-with-password", {
                    email: "flood@example.test",
                    password: "x",
                    passwordConfirm: "x",
                    language: "en",
                    timezone: "Asia/Kolkata",
                });
                if (r.status === 429) {
                    got429 = true;
                    break;
                }
                await sleep(30);
            }
            assert.ok(got429, "rate limit should kick in");
        });
    } finally {
        pb.kill("SIGTERM");
        await sleep(500);
        try { pb.kill("SIGKILL"); } catch (e) {}
        rmSync(tmpData, { recursive: true, force: true });
    }
});
