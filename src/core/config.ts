import { IConfig } from "@clarity-types/core";

let config: IConfig = {
    sessionId: null,
    projectId: null,
    longTask: 30,
    lookahead: 500,
    distance: 20,
    interval: 25,
    delay: 1000,
    expire: 7,
    cssRules: false,
    lean: false,
    tokens: [],
    url: "",
    upload: null
};

export default config;
