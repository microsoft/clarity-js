let discoverConverters = [];
discoverConverters[DiscoverEventType.Discover] = discoverFromArray;

export default discoverConverters;

function discoverFromArray(discover: any[]): IDiscover {
  let data: IDiscover = {
    dom: discover[0]
  };
  return data;
}
