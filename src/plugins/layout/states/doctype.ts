import { IDoctypeLayoutState } from "@clarity-types/layout";
import { createGenericLayoutState, Tags } from "./generic";

export function createDoctypeLayoutState(doctypeNode: DocumentType): IDoctypeLayoutState {
    let doctypeState = createGenericLayoutState(doctypeNode, Tags.Doc) as IDoctypeLayoutState;
    doctypeState.attributes = {
        name: doctypeNode.name,
        publicId: doctypeNode.publicId,
        systemId: doctypeNode.systemId
    };
    return doctypeState;
}
