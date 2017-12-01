export default function(viewportData: IViewportEventData) {
  let data = [
    viewportRectangleToArray(viewportData.viewport),
    documentSizeToArray(viewportData.document),
    viewportData.dpi,
    viewportData.visibility,
    viewportData.type
  ];
  return data;
}

function viewportRectangleToArray(rectangle: IViewportRectangle) {
  return [rectangle.x, rectangle.y, rectangle.width, rectangle.height];
}

function documentSizeToArray(docSize: IDocumentSize) {
  return [docSize.width, docSize.height];
}
