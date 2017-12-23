/* ##################################### */
/* ############   CONFIG   ############# */
/* ##################################### */

interface IConfig {
  // Active plugins
  plugins?: string[];

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
  // Validating consistency can be costly performance-wise, because it requires
  // re-traversing entire DOM and ShadowDom to compare them against each other.
  // The upside is knowing deterministically that all activity on the page was
  // interpreted correctly and data is reliable.
  validateConsistency?: boolean;

  // If this flag is enabled, Clarity will not send any data until trigger function is called.
  // Clarity will still run in the background collecting events and compressing them into batches,
  // but actual sending will only be done one the trigger is fired.
  waitForTrigger?: boolean;
}

/* ##################################### */
/* #############   CORE   ############## */
/* ##################################### */

declare const enum State {
  Loaded,
  Activated,
  Unloaded,
  Activating,
  Unloading
}

interface IPlugin {
  activate(): void;
  teardown(): void;
  reset(): void;
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
  time?: number;
  sequenceNumber?: number;
}

interface IEventData {
  type: string;
  state: any;
  time?: number;
}

interface IEvent extends IEventData {
  id: number; /* Event ID */
  time: number; /* Time relative to page start */
}

interface IDroppedPayloadInfo {
  payload: string;
  xhrErrorState: IXhrErrorEventState;
}

interface IUploadInfo {
  payload: string;
  onSuccess?: UploadCallback;
  onFailure?: UploadCallback;
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
/* ######   COMPRESSION WORKER   ####### */
/* ##################################### */

declare const enum WorkerMessageType {
  /* Main thread to Worker messages */
  AddEvent,
  ForceCompression,

  /* Worker to main thread messages */
  CompressedBatch
}

interface IWorkerMessage {
  type: WorkerMessageType;
}

interface ITimestampedWorkerMessage extends IWorkerMessage {
  time: number;
}

interface IAddEventMessage extends ITimestampedWorkerMessage {
  event: IEvent;
}

interface ICompressedBatchMessage extends IWorkerMessage {
  compressedData: string;
  rawData: string;
  eventCount: number;
}

/* ##################################### */
/* ############   LAYOUT   ############# */
/* ##################################### */

type NumberJson = Array<number | number[]>;

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
  elementTag?: string;
}

interface IMutationEntry {
  node: Node;
  action: Action;
  parent?: Node;
  previous?: Node;
  next?: Node;
}

declare const enum LayoutRoutine {
  DiscoverDom,
  Mutation
}

interface ILayoutRoutineInfo {
  action: LayoutRoutine;
}

interface IMutationRoutineInfo extends ILayoutRoutineInfo {
  mutationSequence: number; /* Sequence number of the mutation batch */
  batchSize: number;  /* Number of mutation records in the mutation callback */
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
  ShadowDomInconsistent,
  ClarityActivateError
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
  // JSON of node indicies, representing the DOM
  dom: NumberJson;

  // JSON of ShadowNode IDs, representing the inconsistent ShadowDom
  shadowDom: NumberJson;

  // JSON of ShadowNode IDs, representing the last consistent ShadowDom
  lastConsistentShadowDom: NumberJson;

  // Last action that happened before we found out that ShadowDom is inconsistent
  lastAction: ILayoutRoutineInfo;

  // To handle specific MutationObserver behavior in IE, we wait for ShadowDom to become inconsistent twice in a row,
  // before we stop processing mutations and send ShadowDomInconsistentEvent. This means that the actual transition
  // from consistent to inconsistent state happened on some previous action and there was also an event created for it.
  // That first event is sent in this property.
  firstEvent?: IShadowDomInconsistentEventState;
}

interface IClarityActivateErrorState extends IInstrumentationEventState {
  error: string;
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
