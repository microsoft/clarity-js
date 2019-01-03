import { IConfig } from "../types/index";

// Default configuration
export let config: IConfig = {
  plugins: ["viewport", "layout", "pointer", "performance", "errors"],
  uploadUrl: "",
  urlBlacklist: [],
  delay: 500,
  batchLimit: 100 * 1024, // 100 kilobytes
  totalLimit: 20 * 1024 * 1024,  // 20 megabytes
  reUploadLimit: 1,
  allowIdCookie: false,
  showText: false,
  showLinks: false,
  showImages: false,
  sensitiveAttributes: [],
  timeToYield: 50,
  instrument: false,
  cssRules: false,
  uploadHandler: null,
  uploadHeaders: {
    "Content-Type": "application/json"
  },
  customInstrumentation: null,
  debug: false,
  validateConsistency: false,
  backgroundMode: false
};
