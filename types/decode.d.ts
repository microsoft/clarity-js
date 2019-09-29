import { Event, IEnvelope, IMetricData, IPageData, IPingData, ISummaryData, ITagData,  } from "./data";
import { IBrokenImageData, IScriptErrorData } from "./diagnostic";
import { IChangeData, IPointerData, IResizeData, IScrollData, ISelectionData, IUnloadData, IVisibileData } from "./interaction";
import { IAttributes, IBoxModelData, IChecksumData, IDocumentData, IResourceData } from "./layout";

export type DecodedEvent = IDataEvent | IDiagnosticEvent | IInteractionEvent | ILayoutEvent;

export interface IDecodedPayload {
    timestamp: number;
    envelope: IEnvelope;
    ua?: string;
    metric?: IMetricEvent[];
    page?: IPageEvent[];
    ping?: IPingEvent[];
    tag?: ITagEvent[];
    image?: IBrokenImageEvent[];
    script?: IScriptErrorEvent[];
    change?: IChangeEvent[];
    pointer?: IPointerEvent[];
    resize?: IResizeEvent[];
    scroll?: IScrollEvent[];
    selection?: ISelectionEvent[];
    unload?: IUnloadEvent[];
    visible?: IVisibileEvent[];
    boxmodel?: IBoxModelEvent[];
    checksum?: IChecksumEvent[];
    resource?: IResourceEvent[];
    dom?: IDomEvent[];
    doc?: IDocumentEvent[];
    summary?: ISummaryEvent[];
}

export interface IPartialEvent {
    time: number;
    event: Event;
}

/* Data Events */
export interface IMetricEvent extends IPartialEvent { data: IMetricData; }
export interface IPageEvent extends IPartialEvent { data: IPageData; }
export interface IPingEvent extends IPartialEvent { data: IPingData; }
export interface ISummaryEvent extends IPartialEvent { data: ISummaryData[]; }
export interface ITagEvent extends IPartialEvent { data: ITagData; }
export interface IDataEvent extends IPartialEvent {
    data: IMetricData | IPageData | IPingData | ISummaryData[] | ITagData;
}

/* Diagnostic Events */
export interface IBrokenImageEvent extends IPartialEvent { data: IBrokenImageData; }
export interface IScriptErrorEvent extends IPartialEvent { data: IScriptErrorData; }
export interface IDiagnosticEvent extends IPartialEvent {
    data: IBrokenImageData | IScriptErrorData;
}

/* Interaction Events */
export interface IChangeEvent extends IPartialEvent { data: IChangeData; }
export interface IPointerEvent extends IPartialEvent { data: IPointerData; }
export interface IResizeEvent extends IPartialEvent { data: IResizeData; }
export interface IScrollEvent extends IPartialEvent { data: IScrollData; }
export interface ISelectionEvent extends IPartialEvent { data: ISelectionData; }
export interface IUnloadEvent extends IPartialEvent { data: IUnloadData; }
export interface IVisibileEvent extends IPartialEvent { data: IVisibileData; }
export interface IInteractionEvent extends IPartialEvent {
    data: IChangeData | IPointerData | IResizeData | IScrollData | ISelectionData | IUnloadData | IVisibileData;
}

/* Layout Events */
export interface IBoxModelEvent extends IPartialEvent { data: IBoxModelData[]; }
export interface IChecksumEvent extends IPartialEvent { data: IChecksumData[]; }
export interface IDocumentEvent extends IPartialEvent { data: IDocumentData; }
export interface IDomEvent extends IPartialEvent { data: IDomData[]; }
export interface IResourceEvent extends IPartialEvent { data: IResourceData[]; }
export interface ILayoutEvent extends IPartialEvent {
    data: IBoxModelData[] | IChecksumData[] | IDocumentData | IDomData[] | IResourceData[];
}

/* Event Data */

export interface IDomData {
    id: number;
    parent: number;
    next: number;
    tag: string;
    attributes?: IAttributes;
    value?: string;
}
