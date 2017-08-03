/* ##################################### */
/* ############   CONFIG   ############# */
/* ##################################### */

interface IConfig {
  // Endpoint, to which data will be uploaded
  uploadUrl?: string;

  // Each new event is going to delay data upload to server by this number of milliseconds
  delay?: number;

  // Maximum number of event bytes that Clarity can send in a single upload
  batchLimit?: number;

  // Maximum number of bytes that Clarity can send per page overall
  totalLimit?: number;

  // If set to false, text on the page will be masked with asterisks
  showText?: boolean;

  // If set to false, src of images won't be captured
  showImages?: boolean;

  // Maximum number of milliseconds, after which Clarity should yield the thread
  // It is used to avoid freezing the page during large object serialization
  timeToYield?: number;

  // Send back instrumentation data, if set to true
  instrument?: boolean;

  // Pointer to the function which would be responsible for sending the data
  // If left unspecified, raw payloads will be uploaded to the uploadUrl endpoint
  uploadHandler?: UploadHandler;

  // Setting to enable debug features (e.g. console.log statements)
  debug?: boolean;

  // Setting to enable consistency verifications between real DOM and shadow DOM
  ensureConsistency?: boolean;

  // Active plugins
  plugins?: string[];
}

/* ##################################### */
/* #############   CORE   ############## */
/* ##################################### */

declare const enum State {
  Loaded,
  Activated,
  Unloaded
}

interface IPayload {
  envelope: IEnvelope;
  events: IEvent[];
}

interface IEnvelope {
  clarityId: string;
  impressionId: string;
  url: string;
  version: string;
  time: number;
  sequenceNumber: number;
}

interface IEvent {
  id: number; /* Event ID */
  time: number; /* Time relative to page start */
  type: string; /* Type of the event */
  state: any;
}

interface IDroppedPayloadInfo {
  payload: string;
  xhrErrorState: IXhrErrorEventState;
}

interface IPlugin {
  activate(): void;
  teardown(): void;
  reset(): void;
}

interface IEventBindingPair {
  target: EventTarget;
  listener: EventListener;
}

interface IBindingContainer {
  [key: string]: IEventBindingPair[];
}

type UploadCallback = (status: number) => void;
type UploadHandler = (payload: string, onSuccess?: UploadCallback, onFailure?: UploadCallback) => void;

/* ##################################### */
/* ############   LAYOUT   ############# */
/* ##################################### */

interface IShadowDomNode extends HTMLDivElement {
  node: Node; /* Reference to the node in the real DOM */
  ignore: boolean;  /* Flag to avoid sending data for that node */
}

interface ILayoutRectangle {
  x: number; /* X coordinate of the element */
  y: number; /* Y coordinate of the element */
  width: number; /* Width of the element */
  height: number; /* Height of the element */
  scrollX?: number; /* Scroll left of the element */
  scrollY?: number; /* Scroll top of the element */
}

declare const enum Source {
  Discover,
  Mutation,
  Scroll,
  Input
}

declare const enum Action {
  Insert,
  Update,
  Remove,
  Move
}

interface IAttributes {
  [key: string]: string;
}

// Generic storage of various data pieces that can be passed along with
// different layout events originating from different actions
interface ILayoutEventInfo {
  node: Node;
  index: number;
  source: Source;
  action: Action;
  time?: number;
}

interface ILayoutState {
  index: number;  /* Index of the layout element */
  tag: string;  /* Tag name of the element */
  source: Source; /* Source of discovery */
  action: Action; /* Reflect the action with respect to DOM */
  parent: number; /* Index of the parent element */
  previous: number; /* Index of the previous sibling, if known */
  next: number; /* Index of the next sibling, if known */
  mutationSequence?: number;  /* Sequence number of the mutation batch */
}

interface IDoctypeLayoutState extends ILayoutState {
  attributes: {
    name: string;
    publicId: string;
    systemId: string;
  };
}

interface IElementLayoutState extends ILayoutState {
  attributes: IAttributes;  /* Attributes associated with an element */
  layout: ILayoutRectangle; /* Layout rectangle */
}

interface ITextLayoutState extends ILayoutState {
  content: string;
}

interface IIgnoreLayoutState extends ILayoutState {
  nodeType: number;
}

interface IMutationEntry {
  node: Node;
  action: Action;
  parent?: Node;
  previous?: Node;
  next?: Node;
}

// Interface to store some information about the initial state of the node
// in cases where mutation happens before we process the node for the first time.
// Stroring original values of the properties that can were mutated allows us to
// re-construct the initial state of the node even after mutation has happened.
interface INodePreUpdateInfo {
  characterData?: string;
  attributes?: IAttributes;
}

interface IShadowDomMutationSummary {
  newNodes: IShadowDomNode[];
  movedNodes: IShadowDomNode[];
  removedNodes: IShadowDomNode[];
  updatedNodes: IShadowDomNode[];
}

/* ##################################### */
/* ###########   POINTER   ############# */
/* ##################################### */

interface IPointerEvent extends IEvent {
  state: IPointerState;
}

interface IPointerModule {
  transform(evt: Event): IPointerState[];
}

/* Spec: https://www.w3.org/TR/pointerevents/#pointerevent-interface */
interface IPointerState {
  index: number; /* Pointer ID */
  event: string; /* Original event that is mapped to pointer event */
  pointer: string; /* pointerType: mouse, pen, touch */
  x: number; /* X-Axis */
  y: number; /* Y-Axis */
  width: number;
  height: number;
  pressure: number;
  tiltX: number;
  tiltY: number;
  target: number; /* Layout index of the target element */
  buttons: number;
}

/* ##################################### */
/* ##########   VIEWPORT   ############# */
/* ##################################### */

interface IViewportEvent extends IEvent {
  state: IViewportState;
}

interface IViewportRectangle {
  x: number; /* X coordinate of the element */
  y: number; /* Y coordinate of the element */
  width: number; /* Width of the element */
  height: number; /* Height of the element */
}

interface IDocumentSize {
  width: number; /* Document width */
  height: number; /* Document height */
}

interface IViewportState {
  viewport: IViewportRectangle; /* Viewport rectangle */
  document: IDocumentSize; /* Document size */
  dpi: number; /* DPI */
  visibility: string; /* Visibility state of the page */
  event: string; /* Source event */
}

/* ##################################### */
/* #######   INSTRUMENTATION   ######### */
/* ##################################### */

declare const enum Instrumentation {
  JsError,
  MissingFeature,
  XhrError,
  TotalByteLimitExceeded,
  Teardown,
  ClarityAssertFailed,
  ClarityDuplicated,
  ShadowDomInconsistent
}

interface IInstrumentationEventState {
  type: Instrumentation;
}

interface IJsErrorEventState extends IInstrumentationEventState {
  source: string;
  message: string;
  stack: string;
  lineno: number;
  colno: number;
}

interface IMissingFeatureEventState extends IInstrumentationEventState {
  missingFeatures: string[];
}

interface IXhrErrorEventState extends IInstrumentationEventState {
  requestStatus: number;
  sequenceNumber: number;
  compressedLength: number;
  rawLength: number;
  firstEventId: number;
  lastEventId: number;
  attemptNumber: number;
}

interface ITotalByteLimitExceededEventState extends IInstrumentationEventState {
  bytes: number;
}

interface IClarityAssertFailedEventState extends IInstrumentationEventState {
  source: string;
  comment: string;
}

interface IClarityDuplicatedEventState extends IInstrumentationEventState {
  currentImpressionId: string;
}

interface IShadowDomInconsistentEventState extends IInstrumentationEventState {
  dom: string;
  shadowDom: string;
  lastAction: string;
  lastConsistentShadowDom?: string;
}

/* ##################################### */
/* #########   PERFORMANCE   ########### */
/* ##################################### */

interface IPerformanceTiming extends PerformanceTiming {
  // We send back all properties from performance.timing object
}

interface IPerformanceResourceTiming {
  duration: number;
  initiatorType: string;
  startTime: number;
  connectStart: number;
  connectEnd: number;
  requestStart: number;
  responseStart: number;
  responseEnd: number;
  name: string;
  transferSize?: number;
  encodedBodySize?: number;
  decodedBodySize?: number;
}

/* ##################################### */
/* ############   LIBRARY   ############ */
/* ##################################### */
interface IClarity {
  start(config?: IConfig): void;
  stop(): void;
}
