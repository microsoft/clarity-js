/* ##################################### */
/* ############   LIBRARY   ############ */
/* ##################################### */

interface IClarity {
  start(config?: IConfig): void;
  stop(): void;
}

/* ##################################### */
/* ############   CONFIG   ############# */
/* ##################################### */

export interface IConfig {
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

  // Pointer to the function which would be responsible for obtaining a
  // page level GUID.
  // If left unspecified, random GUID will be generated
  getImpressionId?: () => string;

  // Pointer to the function which would be responsible for obtaining a
  // user level GUID.
  // If left unspecified, the ClarityID cookie will be used or randomly generated
  getCid?: () => string;

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

declare const enum Origin {
  /* 0 */ Discover,
  /* 1 */ Instrumentation,
  /* 2 */ Layout,
  /* 3 */ Performance,
  /* 4 */ Pointer,
  /* 5 */ Viewport
}

  activate(): void;
  teardown(): void;
  reset(): void;
}

interface IPayload {
  envelope: IEnvelope;
  events: IEventArray[];
  metadata?: IImpressionMetadata;
}

interface IEnvelope {
  impressionId: string;
  time: number;
  sequenceNumber: number;
}

interface IImpressionMetadata {
  clarityId: string;
  impressionId: string;
  url: string;
  version: string;
}

interface IEventInfo {
  origin: number;
  type: number;
  data: any;
  time?: number;
}

interface IEvent extends IEventInfo {
  id: number; /* Event ID */
  time: number; /* Time relative to page start */
}

// IEvent object converted to a value array representation
type IEventArray = [
  number, // id
  Origin, // origin
  number, // type
  number, // time
  any[]   // data, converted to a value array
];

interface IDroppedPayloadInfo {
  payload: string;
  xhrError: IXhrErrorEventData;
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

export type UploadCallback = (status: number) => void;
export type UploadHandler = (payload: string, onSuccess?: UploadCallback, onFailure?: UploadCallback) => void;

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
  event: IEventArray;
}

interface ICompressedBatchMessage extends IWorkerMessage {
  compressedData: string;
  rawData: string;
  eventCount: number;
}

/* ##################################### */
/* ############   LAYOUT   ############# */
/* ##################################### */

type InputElement = HTMLTextAreaElement | HTMLInputElement | HTMLSelectElement;
type CharacterDataNode = Text | Comment | ProcessingInstruction;
type NumberJson = Array<number | number[]>;

declare const enum Action {
  /* 0 */ Discover,
  /* 1 */ Insert,
  /* 2 */ Remove,
  /* 3 */ Move,
  /* 4 */ AttributeUpdate,
  /* 5 */ CharacterDataUpdate,
  /* 6 */ Scroll,
  /* 7 */ Input
}

declare const enum DiscoverEventType {
  Discover
}

declare const enum LayoutRoutine {
  DiscoverDom,
  Mutation
}

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

interface IAttributes {
  [key: string]: string;
}

interface IDiscover {
  dom: any[];
}

interface ILayoutEventData {
  action: Action;
  index: number;
  time?: number;
}

interface IMutation extends ILayoutEventData {
  mutationSequence: number;
}

interface IDiscoverInsert extends ILayoutEventData {
  state: ILayoutState;
}

interface IInsert extends IMutation {
  state: ILayoutState;
}

interface IRemove extends IMutation {
  // No extra properties required
}

interface IMove extends IMutation {
  parent: number; /* Index of the parent element */
  previous: number; /* Index of the previous sibling, if known */
  next: number; /* Index of the next sibling, if known */
}

interface IAttributeUpdate extends IMutation {
  new?: IAttributes;
  removed?: string[];
  layout?: ILayoutRectangle;  // Attribute updates can resize element or enable scrolling, so layout can change
}

interface ICharacterDataUpdate extends IMutation {
  content: string;
}

interface IScroll extends ILayoutEventData {
  scrollX: number;
  scrollY: number;
}

interface IInput extends ILayoutEventData {
  value: string;
}

// Generic storage of various data pieces that can be passed along with
// different layout events originating from different actions
interface ILayoutEventInfo extends ILayoutEventData {
  node: Node;
}

interface ILayoutState {
  index: number;  /* Index of the layout element */
  parent: number; /* Index of the parent element */
  previous: number; /* Index of the previous sibling, if known */
  next: number; /* Index of the next sibling, if known */
  tag: string;  /* Tag name of the element */
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

interface IInputLayoutState extends IElementLayoutState {
  value: string;
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

declare const enum PointerEventType {
  Pointer
}

interface IPointerModule {
  transform(evt: Event): IPointerEventData[];
}

/* Spec: https://www.w3.org/TR/pointerevents/#pointerevent-interface */
interface IPointerEventData {
  index: number; /* Pointer ID */
  type: string; /* Original event that is mapped to pointer event */
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

declare const enum ViewportEventType {
  Viewport
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

interface IViewportEventData {
  viewport: IViewportRectangle; /* Viewport rectangle */
  document: IDocumentSize; /* Document size */
  dpi: number; /* DPI */
  visibility: string; /* Visibility state of the page */
  type: string; /* Source event */
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
  ClarityActivateError,
  Trigger
}

interface IJsErrorEventData {
  source: string;
  message: string;
  stack: string;
  lineno: number;
  colno: number;
}

interface IMissingFeatureEventData {
  missingFeatures: string[];
}

interface IXhrErrorEventData {
  requestStatus: number;
  sequenceNumber: number;
  compressedLength: number;
  rawLength: number;
  firstEventId: number;
  lastEventId: number;
  attemptNumber: number;
}

interface ITotalByteLimitExceededEventData {
  bytes: number;
}

interface IClarityAssertFailedEventData {
  source: string;
  comment: string;
}

interface IClarityDuplicatedEventData {
  currentImpressionId: string;
}

interface IShadowDomInconsistentEventData {
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
  firstEvent?: IShadowDomInconsistentEventData;
}

interface IClarityActivateErrorEventData {
  error: string;
}

interface ITriggerState extends IInstrumentationEventState {
  key: string;
}

/* ##################################### */
/* #########   PERFORMANCE   ########### */
/* ##################################### */

declare const enum PerformanceEventType {
  NavigationTiming,
  ResourceTiming
}

// Replicates PerformanceTiming interface, but without toJSON property
interface IPerformanceNavigationTiming {
  connectEnd: number;
  connectStart: number;
  domainLookupEnd: number;
  domainLookupStart: number;
  domComplete: number;
  domContentLoadedEventEnd: number;
  domContentLoadedEventStart: number;
  domInteractive: number;
  domLoading: number;
  fetchStart: number;
  loadEventEnd: number;
  loadEventStart: number;
  msFirstPaint: number;
  navigationStart: number;
  redirectEnd: number;
  redirectStart: number;
  requestStart: number;
  responseEnd: number;
  responseStart: number;
  unloadEventEnd: number;
  unloadEventStart: number;
  secureConnectionStart: number;
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
export function start(config?: IConfig): void;
export function stop(): void;