import { IConfig } from "@clarity-types/core";

let config: IConfig = {
    projectId: null,
    longtask: 30,
    lookahead: 500,
    distance: 20,
    interval: 25,
    delay: 1000,
    expire: 7,
    ping: 60 * 1000,
    timeout: 10 * 60 * 1000,
    cssRules: false,
    lean: false,
    tokens: [],
    url: "",
    onstart: null,
    upload: null
};

export default config;
