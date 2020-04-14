import { ImageErrorData, InternalErrorData, ScriptErrorData } from "../diagnostic";
import { PartialEvent } from "./core";

export interface ImageErrorEvent extends PartialEvent { data: ImageErrorData; }
export interface ScriptErrorEvent extends PartialEvent { data: ScriptErrorData; }
export interface InternalErrorEvent extends PartialEvent { data: InternalErrorData; }
export interface DiagnosticEvent extends PartialEvent {
    data: ImageErrorData | InternalErrorData | ScriptErrorData;
}
