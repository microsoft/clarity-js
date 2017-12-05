let viewportConverters = [];
viewportConverters[ViewportEventType.Viewport] = viewportFromArray;

export default viewportConverters;

function viewportFromArray(viewportData: any[]): IViewportEventData {
  let data: IViewportEventData = {
    viewport    : viewportRectangleFromArray(viewportData[0]),
    document    : documentSizeFromArray(viewportData[1]),
    dpi         : viewportData[2],
    visibility  : viewportData[3],
    type        : viewportData[4]
  };
  return data;
}

function viewportRectangleFromArray(rectangle: any[]): IViewportRectangle {
  return {
    x       : rectangle[0],
    y       : rectangle[1],
    width   : rectangle[2],
    height  : rectangle[3]
  };
}

function documentSizeFromArray(docSize: any[]): IDocumentSize {
  return {
    width   : docSize[0],
    height  : docSize[1]
  };
}
