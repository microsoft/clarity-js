export type NumberJson = Array<number | number[]>;

export interface IShadowDomNode extends HTMLDivElement {
  node: Node;
  info: INodeInfo;
  computeInfo: () => INodeInfo;
}

/* Computed CSS styles associated with a layout element */
export interface ILayoutStyle {
  visibility?: string;
  color?: string;
  backgroundColor?: string;
  backgroundImage?: string;
  overflowX?: string;
  overflowY?: string;
}

export interface ILayoutRectangle {
  x: number; /* X coordinate of the element */
  y: number; /* Y coordinate of the element */
  width: number; /* Width of the element */
  height: number; /* Height of the element */
  scrollX?: number; /* Scroll left of the element */
  scrollY?: number; /* Scroll top of the element */
}

export const enum Source {
  Discover,
  Mutation,
  Scroll,
  Input
}

export const enum Action {
  Insert,
  Update,
  Remove,
  Move
}

export interface IAttributes {
  [key: string]: string;
}

export interface INodeInfo {
  index: number;
  ignore: boolean;
  forceMask: boolean;
  state: ILayoutState;
}

export interface ILayoutState {
  index: number;  /* Index of the layout element */
  tag: string;  /* Tag name of the element */
  source: Source; /* Source of discovery */
  action: Action; /* Reflect the action with respect to DOM */
  parent: number; /* Index of the parent element */
  previous: number; /* Index of the previous sibling, if known */
  next: number; /* Index of the next sibling, if known */
  mutationSequence?: number;  /* Sequence number of the mutation batch */
}

export interface IDoctypeLayoutState extends ILayoutState {
  attributes: {
    name: string;
    publicId: string;
    systemId: string;
  };
}

export interface IElementLayoutState extends ILayoutState {
  attributes: IAttributes;  /* Attributes associated with an element */
  layout: ILayoutRectangle; /* Layout rectangle */
  style: ILayoutStyle; /* Layout computed styles */
}

export interface IStyleLayoutState extends IElementLayoutState {
  cssRules: string[];
}

export interface ITextLayoutState extends ILayoutState {
  content: string;
}

export interface IIgnoreLayoutState extends ILayoutState {
  nodeType: number;
  elementTag?: string;
}

export interface IMutationEntry {
  node: Node;
  action: Action;
  parent?: Node;
  previous?: Node;
  next?: Node;
}

export const enum LayoutRoutine {
  DiscoverDom,
  Mutation
}

export interface ILayoutRoutineInfo {
  action: LayoutRoutine;
}

export interface IMutationRoutineInfo extends ILayoutRoutineInfo {
  mutationSequence: number; /* Sequence number of the mutation batch */
  batchSize: number;  /* Number of mutation records in the mutation callback */
}

// export interface to store some information about the initial state of the node
// in cases where mutation happens before we process the node for the first time.
// Stroring original values of the properties that can were mutated allows us to
// re-construct the initial state of the node even after mutation has happened.
export interface INodePreUpdateInfo {
  characterData?: string;
  attributes?: IAttributes;
}

export interface IShadowDomMutationSummary {
  newNodes: IShadowDomNode[];
  movedNodes: IShadowDomNode[];
  removedNodes: IShadowDomNode[];
  updatedNodes: IShadowDomNode[];
}
