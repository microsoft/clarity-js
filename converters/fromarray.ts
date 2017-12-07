import DiscoverConverters from "./fromarray/discover";
import InstrumentationConverters from "./fromarray/instrumentation";
import LayoutConverters from "./fromarray/layout";
import PerformanceConverters from "./fromarray/performance";
import PointerConverters from "./fromarray/pointer";
import ViewportConverters from "./fromarray/viewport";

export default function(eventArray: IEventArray): IEvent {
  let id      = eventArray[0];
  let origin  = eventArray[1];
  let type    = eventArray[2];
  let time    = eventArray[3];
  let data    = converters[origin][type](eventArray[4]);
  let event: IEvent = { origin, type, id, time, data };
  return event;
}

let converters = [];
converters[Origin.Discover] = DiscoverConverters;
converters[Origin.Instrumentation] = InstrumentationConverters;
converters[Origin.Layout] = LayoutConverters;
converters[Origin.Performance] = PerformanceConverters;
converters[Origin.Pointer] = PointerConverters;
converters[Origin.Viewport] = ViewportConverters;
