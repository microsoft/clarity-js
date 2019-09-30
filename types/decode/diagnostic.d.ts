import { ImageErrorData, ScriptErrorData } from "../diagnostic";
import { PartialEvent } from "./core";

export interface BrokenImageEvent extends PartialEvent { data: ImageErrorData; }
export interface ScriptErrorEvent extends PartialEvent { data: ScriptErrorData; }
export interface DiagnosticEvent extends PartialEvent {
    data: ImageErrorData | ScriptErrorData;
}
