import { config } from "./config";
import { addEvent } from "./core";

export const InstrumentationEventName = "Instrumentation";

export function instrument(eventState: IInstrumentationEventState) {
  if (config.instrument) {
    addEvent(InstrumentationEventName, eventState);
  }
}
