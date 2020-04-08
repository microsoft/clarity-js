import { InputData, PointerData, ResizeData, ScrollData, SelectionData, UnloadData, VisibilityData } from "../interaction";
import { PartialEvent } from "./core";

export interface InputEvent extends PartialEvent { data: InputData; }
export interface PointerEvent extends PartialEvent { data: PointerData; }
export interface ResizeEvent extends PartialEvent { data: ResizeData; }
export interface ScrollEvent extends PartialEvent { data: ScrollData; }
export interface SelectionEvent extends PartialEvent { data: SelectionData; }
export interface UnloadEvent extends PartialEvent { data: UnloadData; }
export interface VisibilityEvent extends PartialEvent { data: VisibilityData; }
export interface InteractionEvent extends PartialEvent {
    data: InputData | PointerData | ResizeData | ScrollData | SelectionData | UnloadData | VisibilityData;
}
