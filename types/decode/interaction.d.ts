import { InputChangeData, PointerData, ResizeData, ScrollData, SelectionData, UnloadData, VisibileData } from "../interaction";
import { PartialEvent } from "./core";

export interface InputChangeEvent extends PartialEvent { data: InputChangeData; }
export interface PointerEvent extends PartialEvent { data: PointerData; }
export interface ResizeEvent extends PartialEvent { data: ResizeData; }
export interface ScrollEvent extends PartialEvent { data: ScrollData; }
export interface SelectionEvent extends PartialEvent { data: SelectionData; }
export interface UnloadEvent extends PartialEvent { data: UnloadData; }
export interface VisibileEvent extends PartialEvent { data: VisibileData; }
export interface InteractionEvent extends PartialEvent {
    data: InputChangeData | PointerData | ResizeData | ScrollData | SelectionData | UnloadData | VisibileData;
}
