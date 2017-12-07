import DiscoverConverters from "./toarray/discover";
import InstrumentationConverters from "./toarray/instrumentation";
import LayoutConverters from "./toarray/layout";
import PerformanceConverters from "./toarray/performance";
import PointerConverters from "./toarray/pointer";
import ViewportConverters from "./toarray/viewport";

export default function(event: IEvent): IEventArray {
  let converter = converters[event.origin][event.type];
  let data: IEventArray = [
    event.id,
    event.origin,
    event.type,
    event.time,
    converter(event.data)
  ];
  return data;
}

let converters = [];
converters[Origin.Discover] = DiscoverConverters;
converters[Origin.Instrumentation] = InstrumentationConverters;
converters[Origin.Layout] = LayoutConverters;
converters[Origin.Performance] = PerformanceConverters;
converters[Origin.Pointer] = PointerConverters;
converters[Origin.Viewport] = ViewportConverters;
