// Allows data sent via. normal DOM event handlers to be logged alongside Clarity data by listening to the
// custom DOM event "claritydata".
import { addEvent, bind } from "./../core";

// Events coming from normal DOM will have additional data in details property
interface ICustomEvent extends Event {
    detail: any;
}

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
        addEvent(this.eventName, { detail: customEvent.detail });
    }
}
