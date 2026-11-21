// DayZero — application settings: identity, rate limiting.
//
// CORS is deliberately NOT set to "*" here; the server is started with an explicit
// --origins flag (see server/serve.sh) so that only the DayZero web origin may call
// the API with credentials. Android calls are same-host and do not send an Origin.

migrate((app) => {
    const settings = app.settings();

    settings.meta.appName = "DayZero";
    settings.meta.appURL = "http://127.0.0.1:8090";

    // Built-in rate limiter (available since PocketBase v0.23).
    // Labels are tags; duration is in seconds and resets the token bucket.
    settings.rateLimits = {
        enabled: true,
        rules: [
            { label: "*:auth",      audience: "", duration: 60, maxRequests: 10  }, // login / register / password
            { label: "*:create",    audience: "", duration: 60, maxRequests: 40  },
            { label: "*:list",      audience: "", duration: 60, maxRequests: 180 },
            { label: "*:view",      audience: "", duration: 60, maxRequests: 240 },
            { label: "*:update",    audience: "", duration: 60, maxRequests: 60  },
            { label: "*:delete",    audience: "", duration: 60, maxRequests: 30  },
            { label: "*:realtime",  audience: "", duration: 60, maxRequests: 30  },
            { label: "/api/",       audience: "", duration: 60, maxRequests: 120 }, // custom routes
        ],
    };

    app.save(settings);
}, (app) => {
    const settings = app.settings();
    settings.rateLimits = { enabled: false, rules: [] };
    app.save(settings);
});