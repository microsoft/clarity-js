let discoverConverters = [];
discoverConverters[DiscoverEventType.Discover] = discoverToArray;

export default discoverConverters;

function discoverToArray(discover: IDiscover) {
  let data = [ discover.dom ];
  return data;
}
