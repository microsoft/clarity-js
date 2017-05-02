// Get a reference to script tag responsible for executing clarity script
export let script = document.currentScript || document.getElementById("clarity-script");

export let config: IConfig = {
  delay: num("data-delay", 500),
  batchLimit: num("data-batchlimit", 100 * 1024), // 100 kilobytes
  totalLimit: num("data-totallimit", 20 * 1024 * 1024),  // 20 megabytes
  uploadUrl: str("data-upload", ""),
  showText: bool("data-showtext", false),
  instrument: bool("data-instrument", false),
  timeToYield: num("data-yield", 50),
  activateEvent: str("data-event", ""),
  debug: bool("data-debug", false)
};

function get(attribute: string, defaultValue: any): any {
  if (script && script.hasAttribute(attribute)) {
    return script.getAttribute(attribute);
  }
  return defaultValue;
}

function num(attribute: string, defaultValue: number): number {
  return parseInt(get(attribute, defaultValue), 10);
}

function str(attribute: string, defaultValue: string): string {
  return get(attribute, defaultValue);
}

function bool(attribute: string, defaultValue: boolean): boolean {
  let value = get(attribute, defaultValue);
  return (value === true || value === "true");
}
