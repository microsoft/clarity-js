import DiscoverConverters from "./discover";
import InstrumentationConverters from "./instrumentation";
import LayoutConverters from "./layout";
import PerformanceConverters from "./performance";
import PointerConverters from "./pointer";
import ViewportConverters from "./viewport";

export default function(eventArray: IEventArray): IEvent {
  let id      = eventArray[0];
  let origin  = eventArray[1];
  let type    = eventArray[2];
  let time    = eventArray[3];
  let data    = converters[origin][type](eventArray[4]);
  let event: IEvent = { origin, type, id, time, data };
  return event;
}

export { layoutStateFromArray } from "./layout";

let converters = [];
converters[Origin.Discover] = DiscoverConverters;
converters[Origin.Instrumentation] = InstrumentationConverters;
converters[Origin.Layout] = LayoutConverters;
converters[Origin.Performance] = PerformanceConverters;
converters[Origin.Pointer] = PointerConverters;
converters[Origin.Viewport] = ViewportConverters;
