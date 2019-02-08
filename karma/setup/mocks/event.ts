import { IEnvelope, IEvent, IPayload } from "@clarity-types/core";

export const MockEventName = "ClarityTestMockEvent";

export function createMockEvent(eventName?: string) {
    let mockEvent: IEvent = {
        id: -1,
        state: {},
        time: -1,
        type: eventName || MockEventName
    };
    return mockEvent;
}

export function createMockEnvelope(sequenceNumber?: number): IEnvelope {
    return {
        clarityId: "MockClarityId",
        impressionId: "MockImpressionId",
        projectId: "MockProjectId",
        sequenceNumber: sequenceNumber >= 0 ? sequenceNumber : -1,
        time: -1,
        url: window.location.toString(),
        version: "0.0.0"
    };
}
