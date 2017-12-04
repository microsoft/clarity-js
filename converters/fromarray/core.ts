import DiscoverConverter from "./discover";
import InstrumentationConverter from "./instrumentation";
import LayoutConverter from "./layout";
import PerformanceConverter from "./performance";
import PointerConverter from "./pointer";
import ViewportConverter from "./viewport";

export default function(eventArray: IEventArray): IEvent {
  let type = eventArray[0];
  let id   = eventArray[1];
  let time = eventArray[2];
  let data = convertData(type, eventArray[3]);
  let converter = null;
  let event: IEvent = { type, id, time, data, converter: null };
  return event;
}

function convertData(type: string, dataArray: any[]): any {
  let data = null;
  switch (type) {
    case "Discover":
      data = DiscoverConverter(dataArray);
      break;
    case "Instrumentation":
      data = InstrumentationConverter(dataArray);
      break;
    case "Layout":
      data = LayoutConverter(dataArray);
      break;
    case "NavigationTiming":
    case "ResourceTiming":
      // Performance
      data = PerformanceConverter(dataArray, type);
      break;
    case "Pointer":
      data = PointerConverter(dataArray);
      break;
    case "Viewport":
      data = ViewportConverter(dataArray);
      break;
    default:
      console.warn("Unknown event type: " + type);
      break;
  }
  return data;
}
