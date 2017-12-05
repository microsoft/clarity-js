import DiscoverConverters from "./discover";
import InstrumentationConverters from "./instrumentation";
import LayoutConverters from "./layout";
import PerformanceConverters from "./performance";
import PointerConverters from "./pointer";
import ViewportConverters from "./viewport";

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
