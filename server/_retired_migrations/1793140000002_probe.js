migrate((app) => {
    try {
        console.log("PROBE hooksDir=" + $hooksDir);
    } catch (e) {
        console.log("PROBE $hooksDir unavailable: " + e);
    }
    try {
        console.log("PROBE hooksDirType=" + typeof $hooksDir);
    } catch (e) {
        console.log("PROBE type error: " + e);
    }
}, (app) => {});
