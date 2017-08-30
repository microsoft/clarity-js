import { start } from "../src/clarity";
import { config } from "../src/config";

let sentEvents: IEvent[] = [];

export function getSentEvents(): IEvent[] {
  return sentEvents;
}

export function clearSentEvents() {
  sentEvents = [];
}

export function onWorkerMessage(data: any) {
  let message = JSON.parse(data) as IWorkerMessage;
  switch (message.type) {
    case WorkerMessageType.AddEvent:
      let addEventMsg = message as IAddEventMessage;
      sentEvents.push(addEventMsg.event);
      break;
    default:
      break;
  }
}

// Make config uri non-empty, so that Clarity executes send
// Allow instrumentation events
export let testConfig: IConfig = {
  uploadUrl: "https://www.claritytest.com/test",
  instrument: true,
  validateConsistency: true
};

start(testConfig);
