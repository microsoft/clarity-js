// Allows data sent via. normal DOM event handlers to be logged alongside Clarity data by listening to the
// custom DOM event "claritydata".
// Custom event documentation: https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent
import { addEvent, bind } from "./../core";

export default class CustomData implements IPlugin {
    private eventName = "Custom";

    public activate() {
        bind(window, "claritydata", this.customDataHandler.bind(this));
    }

    public reset(): void {
        return;
    }

    public teardown() {
        return;
    }

    private customDataHandler(customEvent: ICustomEvent) {
		addEvent(this.eventName, { type: customEvent.detail.type, data: customEvent.detail.data });
    }
}
