import { IClarityFields, UploadHandler } from "./core";

export interface IConfig {
    // Active plugins
    plugins?: string[];

    // Endpoint, to which data will be uploaded
    uploadUrl?: string;

    // A list of URLs to ignore when instrumenting network resource entries
    // This is useful to prevent Clarity from instrumenting its own activity
    urlBlacklist?: string[];

    // Each new event is going to delay data upload to server by this number of milliseconds
    delay?: number;

    // Maximum number of event bytes that Clarity can send in a single upload
    batchLimit?: number;

    // Maximum number of bytes that Clarity can send per page overall
    totalLimit?: number;

    // Maximum number of XHR re-delivery attempts for a single payload
    reUploadLimit?: number;

    // If set to 'true', clarity-js will NOT write CID (Clarity ID) cookie
    disableCookie?: boolean;

    // Names of the attributes that need to be masked (on top of default ones), when showText is false
    sensitiveAttributes?: string[];

    // Send back instrumentation data, if set to true
    instrument?: boolean;

    // Inspect CSSRuleList for style elements and send CSSRules data instead of style's text children
    cssRules?: boolean;

    // Pointer to the function which would be responsible for sending the data
    // If left unspecified, raw payloads will be uploaded to the uploadUrl endpoint
    uploadHandler?: UploadHandler;

    // XHLHttpRequest headers to be added to every upload request with the default upload handler
    // Object is a map from header names to header values
    uploadHeaders?: { [key: string]: string; };

    // Pointer to the function which will be responsible for giving Clarity
    // a dictionary of strings that the user wants logged in each Clarity payload
    customInstrumentation?: (fields: IClarityFields) => { [key: string]: string; };

    // Setting to enable debug features (e.g. console.log statements)
    debug?: boolean;

    // Setting to enable consistency verifications between real DOM and shadow DOM
    // Validating consistency can be costly performance-wise, because it requires
    // re-traversing entire DOM and ShadowDom to compare them against each other.
    // The upside is knowing deterministically that all activity on the page was
    // interpreted correctly and data is reliable.
    validateConsistency?: boolean;

    // If this flag is enabled, Clarity will not send any data until trigger function is called.
    // Clarity will still run in the background collecting events and compressing them into batches,
    // but actual sending will only be done one the trigger is fired.
    backgroundMode?: boolean;

    // Identifier of the project to which this impression will be merged on the backend
    projectId?: string;

    // For pointer events, compute and record pointe event coordinates relative to its target's top left corner
    pointerTargetCoords?: boolean;
}
