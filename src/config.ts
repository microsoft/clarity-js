// Default configuration
export let config: IConfig = {
  delay: 500,
  batchLimit: 100 * 1024, // 100 kilobytes
  totalLimit: 20 * 1024 * 1024,  // 20 megabytes
  uploadUrl: "",
  showText: false,
  showImages: false,
  timeToYield: 50,
  instrument: false,
  uploadHandler: null,
  debug: false,
  validateConsistency: false,
  plugins: ["viewport", "layout", "pointer", "performance", "errors"]
};
