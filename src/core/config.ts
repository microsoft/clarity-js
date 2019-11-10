import { Config } from "@clarity-types/core";

let config: Config = {
    projectId: null,
    yield: 30, // 30 milliseconds
    lookahead: 500, // 500 milliseconds
    distance: 20, // 20 pixels
    interval: 25, // 25 milliseconds
    delay: 1000, // 1 second
    expire: 7, // 7 days
    ping: 60 * 1000, // 1 minute
    timeout: 10 * 60 * 1000, // 10 minutes
    shutdown: 2 * 60 * 60 * 1000, // 2 hours
    cssRules: false,
    lean: false,
    tokens: [],
    url: "",
    onstart: null,
    upload: null
};

export default config;
