import { InputChangeData, PointerData, ResizeData, ScrollData, SelectionData, UnloadData, VisibilityData } from "../interaction";
import { PartialEvent } from "./core";

export interface InputChangeEvent extends PartialEvent { data: InputChangeData; }
export interface PointerEvent extends PartialEvent { data: PointerData; }
export interface ResizeEvent extends PartialEvent { data: ResizeData; }
export interface ScrollEvent extends PartialEvent { data: ScrollData; }
export interface SelectionEvent extends PartialEvent { data: SelectionData; }
export interface UnloadEvent extends PartialEvent { data: UnloadData; }
export interface VisibilityEvent extends PartialEvent { data: VisibilityData; }
export interface InteractionEvent extends PartialEvent {
    data: InputChangeData | PointerData | ResizeData | ScrollData | SelectionData | UnloadData | VisibilityData;
}
