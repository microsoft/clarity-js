import { IConfig } from "../clarity";

// Default configuration
export let config: IConfig = {
  plugins: ["viewport", "layout", "pointer", "performance", "errors"],
  uploadUrl: "",
  delay: 500,
  batchLimit: 100 * 1024, // 100 kilobytes
  totalLimit: 20 * 1024 * 1024,  // 20 megabytes
  reUploadLimit: 1,
  showText: false,
  showImages: false,
  timeToYield: 50,
  instrument: false,
  cssRules: false,
  uploadHandler: null,
  customInstrumentation: null,
  debug: false,
  validateConsistency: false,
  backgroundMode: false
};
